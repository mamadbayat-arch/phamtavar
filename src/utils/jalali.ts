// Persian / Jalali calendar utilities using ECMAScript Internationalization API

const jparts = new Intl.DateTimeFormat('en-US-u-ca-persian', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const pdateLong = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
});

const pdateShort = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const pdateMonth = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'long',
});

const faNumberFormatter = new Intl.NumberFormat('fa-IR');

export const toPersianDigits = (val: string | number): string => {
  return String(val).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]);
};

export const toEnglishDigits = (str: string): string => {
  return String(str).replace(/[۰-۹٠-٩]/g, c => {
    const farsi = '۰۱۲۳۴۵۶۷۸۹'.indexOf(c);
    if (farsi !== -1) return String(farsi);
    const arabic = '٠١٢٣٤٥٦٧٨٩'.indexOf(c);
    if (arabic !== -1) return String(arabic);
    return c;
  });
};

export const formatToman = (amount: number): string => {
  return `${faNumberFormatter.format(amount)} تومان`;
};

/** Persian-formatted number without a unit, e.g. ۱٬۷۰۰٬۰۰۰. */
export const formatAmount = (amount: number): string => faNumberFormatter.format(amount);

export const dateKey = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const getTodayKey = (): string => {
  return dateKey(new Date());
};

export const moveDay = (dateStr: string, days: number): string => {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return dateKey(d);
};

export const toJalali = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    const p = Object.fromEntries(
      jparts.formatToParts(new Date(dateStr + 'T12:00:00')).map(x => [x.type, x.value])
    );
    return `${p.year}/${p.month}/${p.day}`;
  } catch {
    return dateStr;
  }
};

export const formatJalaliLong = (dateStr?: string): string => {
  if (!dateStr) return 'بدون تاریخ';
  try {
    return pdateLong.format(new Date(dateStr + 'T12:00:00'));
  } catch {
    return dateStr;
  }
};

export const formatJalaliShort = (dateStr?: string): string => {
  if (!dateStr) return 'بدون تاریخ';
  try {
    return pdateShort.format(new Date(dateStr + 'T12:00:00'));
  } catch {
    return dateStr;
  }
};

export const formatJalaliMonth = (dateStr?: string): string => {
  if (!dateStr) return '';
  try {
    return pdateMonth.format(new Date(dateStr + 'T12:00:00'));
  } catch {
    return dateStr;
  }
};

export const parseJalali = (str: string): string => {
  let s = toEnglishDigits(str).trim();
  if (!s) return '';
  if (!/^\d{4}\/\d{2}\/\d{2}$/.test(s)) {
    throw new Error('تاریخ را به صورت ۱۴۰۵/۰۷/۱۰ وارد کنید.');
  }
  const y = Number(s.slice(0, 4));
  if (y < 1350 || y > 1500) {
    throw new Error('سال باید بین ۱۳۵۰ و ۱۵۰۰ باشد.');
  }
  const d = new Date(y + 621, 2, 1, 12);
  for (let i = 0; i < 400; i++) {
    if (toJalali(dateKey(d)) === s) {
      return dateKey(d);
    }
    d.setDate(d.getDate() + 1);
  }
  throw new Error('این تاریخ شمسی معتبر نیست.');
};

export const daysDiff = (targetDateStr: string, fromDateStr = getTodayKey()): number => {
  const d1 = new Date(fromDateStr + 'T12:00:00').getTime();
  const d2 = new Date(targetDateStr + 'T12:00:00').getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

export const shiftJMonth = (jMonthStr: string, delta: number): string => {
  let [y, m] = jMonthStr.split('/').map(Number);
  m += delta;
  while (m > 12) {
    m -= 12;
    y += 1;
  }
  while (m < 1) {
    m += 12;
    y -= 1;
  }
  return `${y}/${String(m).padStart(2, '0')}`;
};

export const getDayOfWeekName = (dateStr: string): string => {
  const day = new Date(dateStr + 'T12:00:00').getDay();
  // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const names = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  return names[day];
};

export const getShortDayName = (dateStr: string): string => {
  const day = new Date(dateStr + 'T12:00:00').getDay();
  const names = ['۱ش', '۲ش', '۳ش', '۴ش', '۵ش', 'ج', 'ش'];
  return names[day];
};

/**
 * Returns weekday index starting with Saturday = 0
 * Saturday (شنبه) = 0
 * Sunday (یکشنبه) = 1
 * Monday (دوشنبه) = 2
 * Tuesday (سه‌شنبه) = 3
 * Wednesday (چهارشنبه) = 4
 * Thursday (پنج‌شنبه) = 5
 * Friday (جمعه) = 6
 */
export const getJalaliWeekDayIndex = (dateStr: string): number => {
  const d = new Date(dateStr + 'T12:00:00');
  const jsDay = d.getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return (jsDay + 1) % 7;
};

export const getFullWeekDayName = (dateStr: string): string => {
  const names = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  return names[getJalaliWeekDayIndex(dateStr)];
};


/** Jalali day of month (1..31) for a Gregorian date key. */
export const getJalaliDay = (dateStr: string): number => Number(toJalali(dateStr).split('/')[2]) || 1;

/** "1405/07" for a Gregorian date key. */
export const getJalaliMonthKey = (dateStr: string): string => toJalali(dateStr).slice(0, 7);

/** Every Gregorian date key that falls inside the given Jalali month ("1405/07"). */
export const getDatesOfJalaliMonth = (jMonth: string): string[] => {
  let cur: string;
  try {
    cur = parseJalali(`${jMonth}/01`);
  } catch {
    return [];
  }
  const dates: string[] = [];
  while (dates.length < 31 && getJalaliMonthKey(cur) === jMonth) {
    dates.push(cur);
    cur = moveDay(cur, 1);
  }
  return dates;
};

const jMonthNames = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];

/** "مهر ۱۴۰۵" for "1405/07". */
export const formatJMonthKey = (jMonth: string): string => {
  const [y, m] = jMonth.split('/').map(Number);
  return `${jMonthNames[m - 1] || ''} ${toPersianDigits(y)}`.trim();
};
