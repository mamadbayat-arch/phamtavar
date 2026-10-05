import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IS_PROD = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

// ---------------------------------------------------------------------------
// Configuration (all secrets come from the environment, never from source)
// ---------------------------------------------------------------------------
const SMS_IR_API_KEY = (process.env.SMS_IR_API_KEY || '').trim();
const SMS_TEMPLATE_ID = Number(process.env.SMS_TEMPLATE_ID) || 100000;

// Without an SMS key the code can only be delivered by echoing it back to the
// client. That is acceptable on a developer machine and never in production.
const OTP_DEV_ECHO = !IS_PROD && (process.env.OTP_DEV_ECHO === 'true' || !SMS_IR_API_KEY);

const normalizeMobile = (value: unknown): string => {
  const digits = String(value ?? '')
    .replace(/[۰-۹]/g, c => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)))
    .replace(/[٠-٩]/g, c => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c)))
    .replace(/\D/g, '');
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  if (/^9\d{9}$/.test(digits)) return `0${digits}`;
  return digits;
};
const isValidMobile = (mobile: string) => /^09\d{9}$/.test(mobile);

const ADMIN_MOBILES = new Set(
  (process.env.ADMIN_MOBILES || '')
    .split(',')
    .map(normalizeMobile)
    .filter(isValidMobile)
);

let SESSION_SECRET = (process.env.SESSION_SECRET || '').trim();
if (SESSION_SECRET.length < 32) {
  if (IS_PROD) {
    console.error('[Config] SESSION_SECRET (حداقل ۳۲ نویسه) در حالت production الزامی است.');
    process.exit(1);
  }
  SESSION_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('[Config] SESSION_SECRET تنظیم نشده؛ کلید موقت ساخته شد و با هر راه‌اندازی، نشست‌ها باطل می‌شوند.');
}
if (IS_PROD && !SMS_IR_API_KEY) {
  console.warn('[Config] SMS_IR_API_KEY تنظیم نشده؛ ورود پیامکی کار نخواهد کرد.');
}
if (ADMIN_MOBILES.size === 0) {
  console.warn('[Config] ADMIN_MOBILES خالی است؛ پنل مدیریت برای هیچ‌کس فعال نیست.');
}

const CORS_ORIGINS = new Set(
  (process.env.CORS_ORIGINS || 'https://appassets.androidplatform.net')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);

const SFTP_CONFIG = {
  host: process.env.SFTP_HOST || '',
  port: Number(process.env.SFTP_PORT) || 22,
  username: process.env.SFTP_USERNAME || '',
  remoteDir: process.env.SFTP_REMOTE_DIR || '/',
};

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 3 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const MAX_LOG_FILE_BYTES = 20 * 1024 * 1024;

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.resolve(__dirname, 'data'));
const CLOUD_DIR = path.resolve(DATA_DIR, 'cloud_backups');
fs.mkdirSync(CLOUD_DIR, { recursive: true });

const ADS_FILE = path.resolve(DATA_DIR, 'ads.json');
const USERS_FILE = path.resolve(DATA_DIR, 'users.json');
const VERSION_FILE = path.resolve(DATA_DIR, 'version.json');
const AI_DATASET_FILE = path.resolve(DATA_DIR, 'ai_dataset.jsonl');
const BEHAVIORAL_LOGS_FILE = path.resolve(DATA_DIR, 'behavioral_logs.jsonl');

const readJson = <T>(file: string, fallback: T): T => {
  try {
    return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf-8')) as T) : fallback;
  } catch (err) {
    console.error(`[Storage] خواندن ${path.basename(file)} ناموفق بود:`, err);
    return fallback;
  }
};

// Write to a temp file first so a crash mid-write cannot corrupt the real one.
const writeJsonAtomic = (file: string, data: unknown) => {
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, file);
};

const appendJsonLines = (file: string, lines: string[]) => {
  if (lines.length === 0) return;
  try {
    if (fs.existsSync(file) && fs.statSync(file).size > MAX_LOG_FILE_BYTES) {
      fs.renameSync(file, `${file}.${new Date().toISOString().slice(0, 10)}.${Date.now()}.old`);
    }
  } catch {}
  fs.appendFileSync(file, lines.join('\n') + '\n', 'utf-8');
};

const readJsonLines = (file: string): any[] => {
  if (!fs.existsSync(file)) return [];
  const out: any[] = [];
  for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
    if (!line.trim()) continue;
    try {
      out.push(JSON.parse(line));
    } catch {}
  }
  return out;
};

const defaultVersion = {
  version: '1.2.0',
  versionCode: 2,
  releaseDate: '',
  minSupportedVersion: '1.0.0',
  isMandatory: false,
  changelog: [] as string[],
  apkUrl: 'https://github.com/mamadbayat-arch/phamtavar/raw/main/public/hamtavar-personal-debug.apk',
};

const defaultAds = {
  active: false,
  title: '',
  description: '',
  ctaText: '',
  ctaUrl: '',
  badge: '',
  bgColor: 'emerald',
};

// ---------------------------------------------------------------------------
// Sessions: stateless HMAC-signed tokens (no extra dependency needed)
// ---------------------------------------------------------------------------
interface Session {
  mobile: string;
  isAdmin: boolean;
  exp: number;
}

const b64url = (input: Buffer | string) => Buffer.from(input).toString('base64url');
const sign = (payload: string) => crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
};

const issueToken = (mobile: string): string => {
  const payload = b64url(JSON.stringify({ m: mobile, exp: Date.now() + SESSION_TTL_MS }));
  return `${payload}.${sign(payload)}`;
};

const readToken = (token: string): Session | null => {
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!isValidMobile(data.m) || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    // Admin rights are resolved on every request so removing a number from
    // ADMIN_MOBILES takes effect without waiting for tokens to expire.
    return { mobile: data.m, isAdmin: ADMIN_MOBILES.has(data.m), exp: data.exp };
  } catch {
    return null;
  }
};

type AuthedRequest = Request & { session?: Session };

const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const session = header.startsWith('Bearer ') ? readToken(header.slice(7).trim()) : null;
  if (!session) {
    return res.status(401).json({ success: false, message: 'نشست شما منقضی شده است. لطفاً دوباره وارد شوید.' });
  }
  req.session = session;
  next();
};

const requireAdmin = (req: AuthedRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (!req.session?.isAdmin) {
      return res.status(403).json({ success: false, message: 'این بخش فقط برای مدیر سامانه در دسترس است.' });
    }
    next();
  });
};

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, fixed window)
// ---------------------------------------------------------------------------
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

const hitRateLimit = (key: string, max: number, windowMs: number): boolean => {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
};

const limit = (name: string, max: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => {
  if (hitRateLimit(`${name}:${req.ip}`, max, windowMs)) {
    return res.status(429).json({ success: false, message: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.' });
  }
  next();
};

// mobile -> pending code
const otpStore = new Map<string, { codeHash: string; expiresAt: number; sentAt: number; attempts: number; fullName: string }>();
const hashOtp = (mobile: string, code: string) => sign(`otp:${mobile}:${code}`);

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) if (bucket.resetAt <= now) rateBuckets.delete(key);
  for (const [mobile, otp] of otpStore) if (otp.expiresAt <= now) otpStore.delete(mobile);
}, 60 * 1000).unref();

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();
app.disable('x-powered-by');
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', /^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY);
}

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const origin = req.headers.origin;
  if (origin && CORS_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: '3mb' }));

const str = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
};

// 1. Auth ------------------------------------------------------------------
app.post('/api/auth/send-otp', limit('otp-send-ip', 20, 60 * 60 * 1000), async (req, res) => {
  const mobile = normalizeMobile(req.body?.mobile);
  if (!isValidMobile(mobile)) {
    return res.status(400).json({ success: false, message: 'شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.' });
  }

  const pending = otpStore.get(mobile);
  if (pending && Date.now() - pending.sentAt < OTP_RESEND_COOLDOWN_MS) {
    const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - pending.sentAt)) / 1000);
    return res.status(429).json({ success: false, message: `برای ارسال مجدد کد ${wait} ثانیه صبر کنید.`, retryAfter: wait });
  }
  if (hitRateLimit(`otp-send-mobile:${mobile}`, 5, 60 * 60 * 1000)) {
    return res.status(429).json({ success: false, message: 'تعداد درخواست کد برای این شماره زیاد است. یک ساعت بعد تلاش کنید.' });
  }

  const code = crypto.randomInt(10000, 100000).toString();
  let smsSent = false;

  if (SMS_IR_API_KEY) {
    try {
      const response = await fetch('https://api.sms.ir/v1/send/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'x-api-key': SMS_IR_API_KEY },
        body: JSON.stringify({ mobile, templateId: SMS_TEMPLATE_ID, parameters: [{ name: 'CODE', value: code }] }),
        signal: AbortSignal.timeout(10000),
      });
      const data: any = await response.json().catch(() => null);
      smsSent = response.ok && data?.status === 1;
      if (!smsSent) console.warn('[OTP] SMS.ir پیامک را نپذیرفت:', response.status, data?.message);
    } catch (err: any) {
      console.warn('[OTP] اتصال به SMS.ir ناموفق بود:', err?.message);
    }
  }

  if (!smsSent && !OTP_DEV_ECHO) {
    return res.status(502).json({ success: false, message: 'ارسال پیامک ناموفق بود. چند دقیقه دیگر دوباره تلاش کنید.' });
  }

  otpStore.set(mobile, {
    codeHash: hashOtp(mobile, code),
    expiresAt: Date.now() + OTP_TTL_MS,
    sentAt: Date.now(),
    attempts: 0,
    fullName: str(req.body?.fullName, 80),
  });

  return res.json({
    success: true,
    smsSent,
    message: smsSent ? 'کد تأیید با پیامک ارسال شد.' : 'حالت توسعه: پیامک ارسال نشد و کد در همین صفحه نمایش داده می‌شود.',
    expiresIn: OTP_TTL_MS / 1000,
    // Only ever present on a non-production server.
    ...(OTP_DEV_ECHO && !smsSent ? { devCode: code } : {}),
  });
});

app.post('/api/auth/verify-otp', limit('otp-verify-ip', 60, 60 * 60 * 1000), (req, res) => {
  const mobile = normalizeMobile(req.body?.mobile);
  const code = normalizeMobile(req.body?.code);
  if (!isValidMobile(mobile) || !code) {
    return res.status(400).json({ success: false, message: 'شماره موبایل و کد الزامی هستند.' });
  }

  const pending = otpStore.get(mobile);
  if (!pending || Date.now() > pending.expiresAt) {
    otpStore.delete(mobile);
    return res.status(400).json({ success: false, message: 'کد منقضی شده است. لطفاً کد جدید دریافت کنید.' });
  }

  pending.attempts += 1;
  if (pending.attempts > OTP_MAX_ATTEMPTS) {
    otpStore.delete(mobile);
    return res.status(429).json({ success: false, message: 'تعداد تلاش ناموفق زیاد شد. کد جدید دریافت کنید.' });
  }
  if (!safeEqual(pending.codeHash, hashOtp(mobile, code))) {
    return res.status(400).json({ success: false, message: 'کد واردشده صحیح نیست.' });
  }
  otpStore.delete(mobile);

  const users = readJson<Record<string, any>>(USERS_FILE, {});
  const existing = users[mobile];
  const now = new Date().toISOString();
  const user = {
    mobile,
    fullName: str(req.body?.fullName, 80) || pending.fullName || existing?.fullName || 'کاربر همتوار',
    isVerified: true,
    registeredAt: existing?.registeredAt || now,
    lastLoginAt: now,
  };
  users[mobile] = user;
  try {
    writeJsonAtomic(USERS_FILE, users);
  } catch (err) {
    console.error('[Auth] ذخیره کاربر ناموفق بود:', err);
  }

  return res.json({
    success: true,
    message: 'ورود با موفقیت انجام شد.',
    token: issueToken(mobile),
    user: { ...user, isAdmin: ADMIN_MOBILES.has(mobile) },
  });
});

app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
  const user = readJson<Record<string, any>>(USERS_FILE, {})[req.session!.mobile];
  return res.json({
    success: true,
    user: {
      mobile: req.session!.mobile,
      fullName: user?.fullName || 'کاربر همتوار',
      isVerified: true,
      registeredAt: user?.registeredAt || new Date().toISOString(),
      isAdmin: req.session!.isAdmin,
    },
  });
});

// 2. App version -----------------------------------------------------------
app.get('/api/app/version', (_req, res) => {
  const { sftpServer: _internal, ...ver } = readJson<any>(VERSION_FILE, defaultVersion);
  return res.json({ ...defaultVersion, ...ver });
});

app.post('/api/app/version', requireAdmin, (req, res) => {
  const body = req.body || {};
  const version = str(body.version, 20);
  const versionCode = Number(body.versionCode);
  const apkUrl = str(body.apkUrl, 500) || defaultVersion.apkUrl;

  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    return res.status(400).json({ success: false, message: 'شماره نسخه باید به شکل 1.2.3 باشد.' });
  }
  if (!Number.isInteger(versionCode) || versionCode < 1) {
    return res.status(400).json({ success: false, message: 'کد نسخه باید عدد صحیح مثبت باشد.' });
  }
  // The update prompt sends users to this URL, so it must not be attacker-shaped.
  if (!isHttpsUrl(apkUrl) && !/^\/[\w\-./]+\.apk$/.test(apkUrl)) {
    return res.status(400).json({ success: false, message: 'نشانی فایل APK باید https یا مسیر داخلی باشد.' });
  }

  const updated = {
    version,
    versionCode,
    releaseDate: str(body.releaseDate, 20),
    minSupportedVersion: str(body.minSupportedVersion, 20) || defaultVersion.minSupportedVersion,
    isMandatory: body.isMandatory === true,
    changelog: (Array.isArray(body.changelog) ? body.changelog : [])
      .map((line: unknown) => str(line, 200))
      .filter(Boolean)
      .slice(0, 20),
    apkUrl,
  };
  writeJsonAtomic(VERSION_FILE, updated);
  return res.json({ success: true, message: 'اطلاعات نسخه سرور به‌روزرسانی شد.', version: updated });
});

// 3. Cloud backup (always scoped to the signed-in user) ----------------------
const backupPath = (mobile: string) => path.resolve(CLOUD_DIR, `${mobile}.json`);

app.post('/api/cloud/sync', requireAuth, limit('cloud-sync', 120, 60 * 60 * 1000), (req: AuthedRequest, res) => {
  const state = req.body?.state;
  if (!state || typeof state !== 'object' || Array.isArray(state)) {
    return res.status(400).json({ success: false, message: 'داده‌های پشتیبان نامعتبر است.' });
  }
  const mobile = req.session!.mobile;
  const syncedAt = new Date().toISOString();
  writeJsonAtomic(backupPath(mobile), { mobile, state, syncedAt });
  return res.json({ success: true, message: 'پشتیبان ابری در سرور ذخیره شد.', syncedAt });
});

app.get('/api/cloud/restore', requireAuth, (req: AuthedRequest, res) => {
  const file = backupPath(req.session!.mobile);
  if (!fs.existsSync(file)) {
    return res.json({ success: true, message: 'هنوز پشتیبان ابری برای این حساب ثبت نشده است.', backup: null });
  }
  return res.json({ success: true, message: 'پشتیبان ابری دریافت شد.', backup: readJson<any>(file, null) });
});

// 4. Announcement banner ---------------------------------------------------
app.get('/api/ads', (_req, res) => {
  return res.json({ success: true, ads: { ...defaultAds, ...readJson<any>(ADS_FILE, defaultAds) } });
});

app.post('/api/ads', requireAdmin, (req, res) => {
  const body = req.body || {};
  const ctaUrl = str(body.ctaUrl, 500);
  if (ctaUrl && !isHttpsUrl(ctaUrl)) {
    return res.status(400).json({ success: false, message: 'نشانی دکمه باید با https:// شروع شود.' });
  }
  const ads = {
    active: body.active === true,
    title: str(body.title, 120),
    description: str(body.description, 300),
    ctaText: str(body.ctaText, 40),
    ctaUrl,
    badge: str(body.badge, 20),
    bgColor: str(body.bgColor, 20) || 'emerald',
  };
  if (ads.active && !ads.title) {
    return res.status(400).json({ success: false, message: 'برای بنر فعال، عنوان الزامی است.' });
  }
  writeJsonAtomic(ADS_FILE, ads);
  return res.json({ success: true, message: 'تنظیمات بنر به‌روزرسانی شد.', ads });
});

// 5. AI dataset (admin only: these files hold data derived from users) -------
app.get('/api/ai/stats', requireAdmin, (_req, res) => {
  const items = readJsonLines(AI_DATASET_FILE);
  const domains: Record<string, number> = {};
  for (const item of items) {
    const domain = item.domain || item.metadata?.domain || 'general';
    domains[domain] = (domains[domain] || 0) + 1;
  }
  return res.json({
    success: true,
    totalSamples: items.length,
    domains,
    lastUpdated: fs.existsSync(AI_DATASET_FILE) ? fs.statSync(AI_DATASET_FILE).mtime.toISOString() : null,
    format: 'JSONL (chat messages)',
  });
});

const sendJsonLinesFile = (file: string, downloadName: string, res: Response) => {
  if (!fs.existsSync(file)) {
    return res.status(404).json({ success: false, message: 'هنوز داده‌ای ثبت نشده است.' });
  }
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  fs.createReadStream(file).pipe(res);
};

app.get('/api/ai/dataset', requireAdmin, (_req, res) => {
  sendJsonLinesFile(AI_DATASET_FILE, 'hamtavar-ai-training-dataset.jsonl', res);
});

app.post('/api/ai/sample', requireAdmin, (req, res) => {
  const raw = Array.isArray(req.body?.samples) ? req.body.samples : [req.body];
  const lines: string[] = [];
  for (const s of raw.slice(0, 2000)) {
    if (!s || typeof s !== 'object') continue;
    const messages = Array.isArray(s.messages)
      ? s.messages
          .filter((m: any) => m && typeof m.content === 'string' && ['system', 'user', 'assistant'].includes(m.role))
          .map((m: any) => ({ role: m.role, content: m.content.slice(0, 4000) }))
      : s.instruction || s.input
        ? [
            { role: 'system', content: 'شما موتور هوش مصنوعی همتوار هستید.' },
            { role: 'user', content: `${str(s.instruction, 2000)}\n\n${str(s.input, 4000)}`.trim() },
            { role: 'assistant', content: str(s.output, 4000) },
          ]
        : [];
    if (messages.length < 2) continue;
    lines.push(JSON.stringify({ messages, domain: str(s.domain, 40) || 'general', timestamp: new Date().toISOString() }));
  }
  appendJsonLines(AI_DATASET_FILE, lines);
  return res.json({ success: true, added: lines.length, message: `${lines.length} نمونه آموزشی به دیتاست اضافه شد.` });
});

// 6. Behavioural action logs -------------------------------------------------
app.post('/api/ml/log-action', requireAuth, limit('ml-log', 600, 60 * 60 * 1000), (req: AuthedRequest, res) => {
  const log = req.body || {};
  const actionType = str(log.actionType, 40);
  if (!/^[a-z_]+$/.test(actionType)) {
    return res.status(400).json({ success: false, message: 'لاگ رفتاری نامعتبر است.' });
  }
  const context = log.context && typeof log.context === 'object' ? log.context : {};
  let payloadSummary: unknown;
  try {
    const raw = JSON.stringify(context.payloadSummary ?? null);
    payloadSummary = raw.length <= 1000 ? JSON.parse(raw) : undefined;
  } catch {}

  // The phone number never goes into the training log; only a stable pseudonym.
  const entry = {
    id: str(log.id, 60) || `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    user: sign(`user:${req.session!.mobile}`).slice(0, 16),
    sessionId: str(log.sessionId, 60),
    actionType,
    entityType: str(log.entityType, 30),
    entityId: str(log.entityId, 60) || undefined,
    timestamp: new Date().toISOString(),
    epochMs: Date.now(),
    context: {
      dayOfWeek: Number(context.dayOfWeek) || 0,
      dayOfWeekFa: str(context.dayOfWeekFa, 20),
      hourOfDay: Number(context.hourOfDay) || 0,
      minuteOfHour: Number(context.minuteOfHour) || 0,
      isWeekend: context.isWeekend === true,
      currentView: str(context.currentView, 20),
      payloadSummary,
    },
  };
  appendJsonLines(BEHAVIORAL_LOGS_FILE, [JSON.stringify(entry)]);
  return res.json({ success: true });
});

app.get('/api/ml/action-logs', requireAdmin, (_req, res) => {
  const logs = readJsonLines(BEHAVIORAL_LOGS_FILE);
  const actionDistribution: Record<string, number> = {};
  const hourlyDistribution: Record<number, number> = {};
  for (const item of logs) {
    const action = item.actionType || 'unknown';
    actionDistribution[action] = (actionDistribution[action] || 0) + 1;
    const hour = Number(item.context?.hourOfDay);
    if (Number.isFinite(hour)) hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
  }
  return res.json({
    success: true,
    totalLogs: logs.length,
    actionDistribution,
    hourlyDistribution,
    recentLogs: logs.slice(-50).reverse(),
  });
});

app.get('/api/ml/export-behavior-dataset', requireAdmin, (_req, res) => {
  sendJsonLinesFile(BEHAVIORAL_LOGS_FILE, 'hamtavar-behavioral-ml-dataset.jsonl', res);
});

// 7. Publish the APK to the download server over SFTP -------------------------
app.post('/api/server/sftp-upload', requireAdmin, limit('sftp', 10, 60 * 60 * 1000), (req, res) => {
  const privateKey = typeof req.body?.privateKeyText === 'string' ? req.body.privateKeyText.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const apkPath = path.resolve(__dirname, 'public', 'hamtavar-personal-debug.apk');

  if (!SFTP_CONFIG.host || !SFTP_CONFIG.username) {
    return res.status(400).json({ success: false, message: 'SFTP_HOST و SFTP_USERNAME در تنظیمات سرور تعریف نشده‌اند.' });
  }
  if (!fs.existsSync(apkPath)) {
    return res.status(400).json({ success: false, message: 'فایل APK برای آپلود یافت نشد.' });
  }
  if (privateKey.length <= 10 && !password) {
    return res.status(400).json({ success: false, message: 'کلید خصوصی یا رمز عبور سرور الزامی است.' });
  }

  const conn = new Client();
  let finished = false;
  const finish = (status: number, body: Record<string, unknown>) => {
    if (finished) return;
    finished = true;
    conn.end();
    res.status(status).json(body);
  };

  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) return finish(500, { success: false, message: `خطا در باز کردن SFTP: ${err.message}` });
      const remoteFile = `${SFTP_CONFIG.remoteDir.replace(/\/$/, '')}/hamtavar-personal-debug.apk`;
      const writeStream = sftp.createWriteStream(remoteFile);
      writeStream.on('close', () => finish(200, { success: true, message: `فایل در مسیر ${remoteFile} بارگذاری شد.` }));
      writeStream.on('error', (uploadErr: any) =>
        finish(500, { success: false, message: `خطا در آپلود فایل: ${uploadErr.message}` })
      );
      fs.createReadStream(apkPath).pipe(writeStream);
    });
  });
  conn.on('error', err => finish(502, { success: false, message: `خطای اتصال SSH: ${err.message}` }));

  try {
    conn.connect({
      host: SFTP_CONFIG.host,
      port: SFTP_CONFIG.port,
      username: SFTP_CONFIG.username,
      readyTimeout: 10000,
      ...(privateKey.length > 10 ? { privateKey } : { password }),
    });
  } catch (err: any) {
    finish(400, { success: false, message: err?.message || 'خطا در اتصال به سرور' });
  }
});

// Unknown API routes must answer in JSON, not fall through to the SPA shell.
app.use('/api', (_req, res) => res.status(404).json({ success: false, message: 'مسیر یافت نشد.' }));

app.use(express.static(path.resolve(__dirname, 'public')));

async function startServer() {
  if (IS_PROD) {
    const dist = path.resolve(__dirname, 'dist');
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(path.resolve(dist, 'index.html')));
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err?.type === 'entity.too.large') {
      return res.status(413).json({ success: false, message: 'حجم داده ارسالی بیش از حد مجاز است.' });
    }
    if (err?.type === 'entity.parse.failed') {
      return res.status(400).json({ success: false, message: 'قالب داده ارسالی نامعتبر است.' });
    }
    console.error('[Server] خطای پیش‌بینی‌نشده:', err);
    return res.status(500).json({ success: false, message: 'خطای داخلی سرور.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Hamtavar Personal listening on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer();
