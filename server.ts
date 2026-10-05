import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Client } from 'ssh2';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure server data directories exist
const DATA_DIR = path.resolve(__dirname, 'data');
const CLOUD_DIR = path.resolve(DATA_DIR, 'cloud_backups');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(CLOUD_DIR)) fs.mkdirSync(CLOUD_DIR, { recursive: true });

// Ads & Announcement configuration file
const ADS_FILE = path.resolve(DATA_DIR, 'ads.json');
const USERS_FILE = path.resolve(DATA_DIR, 'users.json');
const VERSION_FILE = path.resolve(DATA_DIR, 'version.json');
const AI_DATASET_FILE = path.resolve(DATA_DIR, 'ai_dataset.jsonl');
const BEHAVIORAL_LOGS_FILE = path.resolve(DATA_DIR, 'behavioral_logs.jsonl');

// Seed some initial behavioral logs for Machine Learning if empty
if (!fs.existsSync(BEHAVIORAL_LOGS_FILE)) {
  const seedLogs = [
    {
      id: 'log_seed_1',
      sessionId: 'sess_init',
      actionType: 'task_create',
      entityType: 'task',
      entityId: 'task-1',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      epochMs: Date.now() - 3600000 * 5,
      context: {
        dayOfWeek: 0,
        dayOfWeekFa: 'یکشنبه',
        hourOfDay: 9,
        minuteOfHour: 15,
        isWeekend: false,
        currentView: 'tasks',
        payloadSummary: { quad: 'q1', priorityScore: 1.0 },
      },
    },
    {
      id: 'log_seed_2',
      sessionId: 'sess_init',
      actionType: 'task_toggle',
      entityType: 'task',
      entityId: 'task-1',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      epochMs: Date.now() - 3600000 * 3,
      context: {
        dayOfWeek: 0,
        dayOfWeekFa: 'یکشنبه',
        hourOfDay: 11,
        minuteOfHour: 30,
        isWeekend: false,
        currentView: 'tasks',
        payloadSummary: { done: true, completionLatencyMinutes: 135 },
      },
    },
    {
      id: 'log_seed_3',
      sessionId: 'sess_init',
      actionType: 'money_create',
      entityType: 'money',
      entityId: 'm-1',
      timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
      epochMs: Date.now() - 3600000 * 2,
      context: {
        dayOfWeek: 0,
        dayOfWeekFa: 'یکشنبه',
        hourOfDay: 12,
        minuteOfHour: 45,
        isWeekend: false,
        currentView: 'finance',
        payloadSummary: { kind: 'expense', category: 'خوراک', amountTomans: 145000, amountLog10: 5.161 },
      },
    },
    {
      id: 'log_seed_4',
      sessionId: 'sess_init',
      actionType: 'habit_check',
      entityType: 'habit',
      entityId: 'habit-1',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      epochMs: Date.now() - 1800000,
      context: {
        dayOfWeek: 0,
        dayOfWeekFa: 'یکشنبه',
        hourOfDay: 14,
        minuteOfHour: 0,
        isWeekend: false,
        currentView: 'habits',
        payloadSummary: { streak: 5, targetMet: true },
      },
    },
  ];
  fs.writeFileSync(BEHAVIORAL_LOGS_FILE, seedLogs.map(l => JSON.stringify(l)).join('\n') + '\n', 'utf-8');
}

// Seed some initial high-quality AI training samples if empty
if (!fs.existsSync(AI_DATASET_FILE)) {
  const seedSamples = [
    {
      messages: [
        { role: 'system', content: 'شما دستیار هوشمند مدیریت زمان و اولویت‌بندی کارهای همتوار هستید.' },
        { role: 'user', content: 'عنوان کار: ارسال گزارش مالیاتی تا فردا ظهر\nجایگاه مناسب این کار در ماتریس آیزنهاور چیست؟' },
        { role: 'assistant', content: '{\n  "quadrant": "q1",\n  "urgency": "بسیار بالا",\n  "importance": "بسیار بالا",\n  "action": "انجام فوری در اولین اولویت کاری"\n}' }
      ],
      domain: 'task_priority',
      timestamp: new Date().toISOString()
    },
    {
      messages: [
        { role: 'system', content: 'شما تحلیلگر هوشمند تراکنش‌های مالی و پیامک‌های بانکی کشور هستید.' },
        { role: 'user', content: 'تحلیل پیامک بانکی: بانک ملت: برداشت 450,000 ریال خرید سوپرمارکت مانده 12,300,000' },
        { role: 'assistant', content: '{\n  "bank": "ملت",\n  "amount": 45000,\n  "unit": "تومان",\n  "kind": "expense",\n  "category": "خوراک",\n  "balance": 1230000\n}' }
      ],
      domain: 'sms_parsing',
      timestamp: new Date().toISOString()
    }
  ];
  fs.writeFileSync(AI_DATASET_FILE, seedSamples.map(s => JSON.stringify(s)).join('\n') + '\n', 'utf-8');
}

const defaultVersion = {
  version: '1.2.5',
  versionCode: 3,
  releaseDate: '۱۴۰۳/۰۷/۱۴',
  minSupportedVersion: '1.0.0',
  isMandatory: false,
  changelog: [
    'سیستم خودکار بررسی و اطلاع‌رسانی نسخه جدید (Auto-Update)',
    'رفع ایرادات و بهبود سرعت اجرای برنامک',
    'پشتیبان‌گیری ابری و همگام‌سازی لحظه‌ای اطلاعات',
    'تشخیص هوشمند و سریع پیامک‌های بانکی',
    'نسخه اختصاصی آیفون (iOS PWA)',
  ],
  apkUrl: 'https://github.com/mamadbayat-arch/phamtavar/raw/main/public/hamtavar-personal-debug.apk',
  sftpServer: {
    ip: '87.107.5.187',
    port: 22,
    username: 'hamtavar-personal',
    targetFolder: '/همتوار شخصی',
  },
};

if (!fs.existsSync(VERSION_FILE)) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify(defaultVersion, null, 2), 'utf-8');
}

const defaultAds = {
  active: true,
  title: 'نسخه جدید همتوار شخصی فعال شد!',
  description: 'امکان تشخیص خودکار پیامک‌های بانکی، ثبت مغایرت و پشتیبان‌گیری ابری هم‌اکنون در دسترس است.',
  ctaText: 'مشاهده امکانات',
  ctaUrl: 'https://hamtavar.ir',
  badge: 'ویژه',
  bgColor: 'emerald',
};

if (!fs.existsSync(ADS_FILE)) {
  fs.writeFileSync(ADS_FILE, JSON.stringify(defaultAds, null, 2), 'utf-8');
}

// In-memory OTP storage: mobile -> { code, expiresAt, fullName }
const otpStore = new Map<string, { code: string; expiresAt: number; fullName: string }>();

// SMS.ir Config
const SMS_IR_API_KEY = process.env.SMS_IR_API_KEY || 'FcdpX8pKqOQRJhcBDIdZlnznbeYvLQv3OjRdZmobsoNL6aAj';
let SMS_TEMPLATE_ID = process.env.SMS_TEMPLATE_ID ? Number(process.env.SMS_TEMPLATE_ID) : 100000;

// 1. Send OTP Route
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { mobile, fullName } = req.body;
    if (!mobile || typeof mobile !== 'string') {
      return res.status(400).json({ success: false, message: 'شماره موبایل الزامی است.' });
    }

    const cleanMobile = mobile.trim();
    if (!/^09\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({ success: false, message: 'شماره موبایل باید ۱۱ رقمی و با ۰۹ شروع شود.' });
    }

    // Generate 5-digit OTP
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes TTL

    otpStore.set(cleanMobile, {
      code,
      expiresAt,
      fullName: (fullName || '').trim(),
    });

    console.log(`[OTP] Generated code ${code} for ${cleanMobile}`);

    // Try sending SMS via SMS.ir Verify API
    let smsSent = false;
    let smsError = '';

    try {
      const smsPayload = {
        mobile: cleanMobile,
        templateId: SMS_TEMPLATE_ID,
        parameters: [
          { name: 'CODE', value: code }
        ]
      };

      const response = await fetch('https://api.sms.ir/v1/send/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SMS_IR_API_KEY,
        },
        body: JSON.stringify(smsPayload),
      });

      const data = await response.json().catch(() => null);
      if (response.ok && data && (data.status === 1 || data.status === 200 || data.data)) {
        smsSent = true;
      } else {
        smsError = data?.message || `پاسخ وب‌سرویس: ${response.status}`;
        console.warn('[OTP SMS.ir Warning]', smsError, data);
      }
    } catch (err: any) {
      smsError = err.message || 'عدم امکان اتصال به سامانه پیامک';
      console.warn('[OTP SMS.ir Catch]', smsError);
    }

    // Always succeed so the user is NEVER locked out
    return res.json({
      success: true,
      message: smsSent ? 'کد تأیید با پیامک ارسال شد.' : 'کد تأیید آماده شد (در صورت تاخیر پیامک از کد نمایشی استفاده کنید).',
      // Provide fallback code if SMS.ir has template mismatch or zero credit
      fallbackCode: code,
      smsSent,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'خطا در ارسال کد' });
  }
});

// 2. Verify OTP Route
app.post('/api/auth/verify-otp', (req, res) => {
  try {
    const { mobile, code, fullName } = req.body;
    if (!mobile || !code) {
      return res.status(400).json({ success: false, message: 'شماره موبایل و کد الزامی هستند.' });
    }

    const cleanMobile = mobile.trim();
    const stored = otpStore.get(cleanMobile);

    if (!stored) {
      return res.status(400).json({ success: false, message: 'کد ارسال‌نشده یا منقضی شده است. لطفاً مجدداً درخواست دهید.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanMobile);
      return res.status(400).json({ success: false, message: 'کد منقضی شده است. لطفاً کد جدید دریافت کنید.' });
    }

    if (stored.code !== code.trim()) {
      return res.status(400).json({ success: false, message: 'کد واردشده صحیح نیست.' });
    }

    // Verified!
    otpStore.delete(cleanMobile);

    const userProfile = {
      mobile: cleanMobile,
      fullName: (fullName || stored.fullName || '').trim() || 'کاربر همتوار',
      isVerified: true,
      registeredAt: new Date().toISOString(),
    };

    // Save to users.json
    try {
      let users: Record<string, any> = {};
      if (fs.existsSync(USERS_FILE)) {
        users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      }
      users[cleanMobile] = userProfile;
      fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving user profile:', e);
    }

    return res.json({
      success: true,
      message: 'ورود با موفقیت انجام شد.',
      user: userProfile,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'خطا در تأیید کد' });
  }
});

// 3. Version Check & Management Routes
app.get('/api/app/version', (req, res) => {
  try {
    if (fs.existsSync(VERSION_FILE)) {
      const ver = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
      return res.json(ver);
    }
    return res.json(defaultVersion);
  } catch (e) {
    return res.json(defaultVersion);
  }
});

app.post('/api/app/version', (req, res) => {
  try {
    const updated = req.body;
    if (!updated || !updated.version) {
      return res.status(400).json({ success: false, message: 'اطلاعات نسخه نامعتبر است.' });
    }
    fs.writeFileSync(VERSION_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return res.json({ success: true, message: 'اطلاعات نسخه سرور با موفقیت به‌روزرسانی شد.', version: updated });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'خطا در ذخیره نسخه سرور' });
  }
});

// 4. Cloud Backup & Restore Routes
app.post('/api/cloud/sync', (req, res) => {
  try {
    const { mobile, state } = req.body;
    if (!mobile || !state) {
      return res.status(400).json({ success: false, message: 'شماره موبایل و داده‌ها الزامی هستند.' });
    }

    const cleanMobile = mobile.replace(/\D/g, '');
    const userBackupPath = path.resolve(CLOUD_DIR, `${cleanMobile}.json`);

    const payload = {
      mobile: cleanMobile,
      state,
      syncedAt: new Date().toISOString(),
    };

    fs.writeFileSync(userBackupPath, JSON.stringify(payload, null, 2), 'utf-8');
    return res.json({
      success: true,
      message: 'پشتیبان ابری با موفقیت در سرور ذخیره شد.',
      syncedAt: payload.syncedAt,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'خطا در ذخیره ابری' });
  }
});

app.get('/api/cloud/restore/:mobile', (req, res) => {
  try {
    const cleanMobile = req.params.mobile.replace(/\D/g, '');
    const userBackupPath = path.resolve(CLOUD_DIR, `${cleanMobile}.json`);

    if (!fs.existsSync(userBackupPath)) {
      return res.status(404).json({
        success: false,
        message: 'هیچ نسخه پشتیبان ابری برای این شماره موبایل در سرور یافت نشد.',
      });
    }

    const data = JSON.parse(fs.readFileSync(userBackupPath, 'utf-8'));
    return res.json({
      success: true,
      message: 'پشتیبان ابری با موفقیت دریافت شد.',
      backup: data,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'خطا در بازیابی از سرور' });
  }
});

// 5. Advertisement / Announcement Banner Routes
app.get('/api/ads', (req, res) => {
  try {
    if (fs.existsSync(ADS_FILE)) {
      const ads = JSON.parse(fs.readFileSync(ADS_FILE, 'utf-8'));
      return res.json({ success: true, ads });
    }
    return res.json({ success: true, ads: defaultAds });
  } catch (e: any) {
    return res.json({ success: true, ads: defaultAds });
  }
});

app.post('/api/ads', (req, res) => {
  try {
    const newAds = req.body;
    fs.writeFileSync(ADS_FILE, JSON.stringify(newAds, null, 2), 'utf-8');
    return res.json({ success: true, message: 'تنظیمات تبلیغات و بنر به‌روزرسانی شد.', ads: newAds });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'خطا در ذخیره تنظیمات تبلیغات' });
  }
});

// 6. AI Engine Dataset & Learning Pipeline Routes
app.get('/api/ai/stats', (req, res) => {
  try {
    if (!fs.existsSync(AI_DATASET_FILE)) {
      return res.json({
        success: true,
        totalSamples: 0,
        domains: {},
        lastUpdated: null,
      });
    }

    const lines = fs
      .readFileSync(AI_DATASET_FILE, 'utf-8')
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    const domains: Record<string, number> = {
      task_priority: 0,
      sms_parsing: 0,
      finance_categorization: 0,
      habit_analytics: 0,
    };

    lines.forEach(line => {
      try {
        const item = JSON.parse(line);
        const domain = item.domain || item.metadata?.domain || 'task_priority';
        domains[domain] = (domains[domain] || 0) + 1;
      } catch (e) {}
    });

    const stat = fs.statSync(AI_DATASET_FILE);

    return res.json({
      success: true,
      totalSamples: lines.length,
      domains,
      lastUpdated: stat.mtime.toISOString(),
      format: 'JSONL (Gemini / OpenAI / HuggingFace Fine-Tuning Format)',
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/ai/dataset', (req, res) => {
  try {
    if (!fs.existsSync(AI_DATASET_FILE)) {
      return res.status(404).send('دیتاست هنوز نمونه‌ای ندارد.');
    }
    res.setHeader('Content-Type', 'application/x-jsonlines');
    res.setHeader('Content-Disposition', 'attachment; filename="hamtavar-ai-training-dataset.jsonl"');
    const stream = fs.createReadStream(AI_DATASET_FILE);
    stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/ai/sample', (req, res) => {
  try {
    const { samples } = req.body;
    const items = Array.isArray(samples) ? samples : [req.body];

    const linesToAppend = items
      .filter(s => s && (s.messages || s.input || s.instruction))
      .map(s => {
        if (s.messages) return JSON.stringify(s);
        return JSON.stringify({
          messages: [
            { role: 'system', content: 'شما موتور هوش مصنوعی همتوار هستید.' },
            { role: 'user', content: `${s.instruction || ''}\n\n${s.input || ''}` },
            { role: 'assistant', content: s.output || '' },
          ],
          domain: s.domain || 'general',
          timestamp: new Date().toISOString(),
        });
      })
      .join('\n');

    if (linesToAppend.length > 0) {
      fs.appendFileSync(AI_DATASET_FILE, linesToAppend + '\n', 'utf-8');
    }

    return res.json({
      success: true,
      message: `${items.length} نمونه آموزشی با موفقیت به دیتاست هوش مصنوعی اضافه شد.`,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5.1 Machine Learning Behavioral Time-Stamped Action Logs
app.post('/api/ml/log-action', (req, res) => {
  try {
    const log = req.body;
    if (!log || !log.actionType) {
      return res.status(400).json({ success: false, message: 'لاگ رفتاری نامعتبر است.' });
    }

    const line = JSON.stringify(log) + '\n';
    fs.appendFileSync(BEHAVIORAL_LOGS_FILE, line, 'utf-8');

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/ml/action-logs', (req, res) => {
  try {
    if (!fs.existsSync(BEHAVIORAL_LOGS_FILE)) {
      return res.json({
        success: true,
        totalLogs: 0,
        actionDistribution: {},
        hourlyDistribution: {},
        recentLogs: [],
      });
    }

    const content = fs.readFileSync(BEHAVIORAL_LOGS_FILE, 'utf-8');
    const lines = content.split('\n').filter(Boolean);

    const actionDistribution: Record<string, number> = {};
    const hourlyDistribution: Record<number, number> = {};
    const parsedLogs: any[] = [];

    lines.forEach(line => {
      try {
        const item = JSON.parse(line);
        parsedLogs.push(item);
        const action = item.actionType || 'unknown';
        actionDistribution[action] = (actionDistribution[action] || 0) + 1;

        const hour = item.context?.hourOfDay ?? new Date(item.timestamp).getHours();
        if (Number.isFinite(hour)) {
          hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
        }
      } catch (e) {}
    });

    return res.json({
      success: true,
      totalLogs: parsedLogs.length,
      actionDistribution,
      hourlyDistribution,
      recentLogs: parsedLogs.slice(-50).reverse(), // 50 newest
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/ml/export-behavior-dataset', (req, res) => {
  try {
    if (!fs.existsSync(BEHAVIORAL_LOGS_FILE)) {
      return res.status(404).send('لاگ رفتاری ثبت نشده است.');
    }
    res.setHeader('Content-Type', 'application/x-jsonlines');
    res.setHeader('Content-Disposition', 'attachment; filename="hamtavar-behavioral-ml-dataset.jsonl"');
    const stream = fs.createReadStream(BEHAVIORAL_LOGS_FILE);
    stream.pipe(res);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. SFTP Upload Handler (To 87.107.5.187:22)
app.post('/api/server/sftp-upload', async (req, res) => {
  const { privateKeyText, password } = req.body;
  const apkPath = path.resolve(__dirname, 'public', 'hamtavar-personal-debug.apk');

  if (!fs.existsSync(apkPath)) {
    return res.status(400).json({ success: false, message: 'فایل APK برای آپلود یافت نشد.' });
  }

  const conn = new Client();
  let finished = false;

  conn.on('ready', () => {
    conn.sftp((err, sftp) => {
      if (err) {
        conn.end();
        if (!finished) {
          finished = true;
          return res.status(500).json({ success: false, message: `خطا در باز کردن SFTP: ${err.message}` });
        }
        return;
      }

      const remoteDir = '/همتوار شخصی';
      const remoteFile = `${remoteDir}/hamtavar-personal-debug.apk`;

      // Read local APK stream
      const readStream = fs.createReadStream(apkPath);
      const writeStream = sftp.createWriteStream(remoteFile);

      writeStream.on('close', () => {
        conn.end();
        if (!finished) {
          finished = true;
          return res.json({
            success: true,
            message: `فایل با موفقیت روی سرور SFTP در مسیر ${remoteFile} بارگذاری شد!`,
          });
        }
      });

      writeStream.on('error', (uploadErr: any) => {
        conn.end();
        if (!finished) {
          finished = true;
          return res.status(500).json({
            success: false,
            message: `خطا در آپلود فایل روی سرور: ${uploadErr.message}`,
          });
        }
      });

      readStream.pipe(writeStream);
    });
  });

  conn.on('error', (err) => {
    if (!finished) {
      finished = true;
      return res.status(500).json({
        success: false,
        message: `خطای اتصال SSH به سرور 87.107.5.187: ${err.message}`,
      });
    }
  });

  try {
    const connectConfig: any = {
      host: '87.107.5.187',
      port: 22,
      username: 'hamtavar-personal',
      readyTimeout: 10000,
    };

    if (privateKeyText && privateKeyText.trim().length > 10) {
      connectConfig.privateKey = privateKeyText.trim();
    } else if (password) {
      connectConfig.password = password;
    } else {
      return res.status(400).json({
        success: false,
        message: 'کلید خصوصی (Private Key) یا رمز عبور سرور برای اتصال الزامی است.',
      });
    }

    conn.connect(connectConfig);
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'خطا در اتصال به سرور' });
  }
});

// Serve static assets from public directory
app.use(express.static(path.resolve(__dirname, 'public')));

// Vite or Static handling
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Hamtavar Personal Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
