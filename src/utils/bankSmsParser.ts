import { toEnglishDigits } from './jalali';

export interface ParsedBankSms {
  rawText: string;
  bankName: string;
  cardLast4?: string;
  kind: 'expense' | 'income';
  amount: number; // in Tomans
  balance?: number; // in Tomans
  description?: string;
  dateStr?: string;
  timeStr?: string;
}

export const KNOWN_BANKS: { name: string; aliases: string[]; color: string }[] = [
  { name: 'بانک ملت', aliases: ['ملت', 'mellat'], color: '#e11d48' },
  { name: 'بانک ملی', aliases: ['ملی', 'melli', 'bmi'], color: '#2563eb' },
  { name: 'بلوبانک', aliases: ['بلو', 'blubank', 'blu'], color: '#0284c7' },
  { name: 'بانک سامان', aliases: ['سامان', 'saman'], color: '#0d9488' },
  { name: 'بانک پاسارگاد', aliases: ['پاسارگاد', 'pasargad', 'bpi'], color: '#d97706' },
  { name: 'بانک رسالت', aliases: ['رسالت', 'resalat'], color: '#059669' },
  { name: 'بانک تجارت', aliases: ['تجارت', 'tejarat'], color: '#4f46e5' },
  { name: 'بانک صادرات', aliases: ['صادرات', 'saderat', 'bsi'], color: '#7c3aed' },
  { name: 'بانک سپه', aliases: ['سپه', 'sepah'], color: '#ea580c' },
  { name: 'بانک کشاورزی', aliases: ['کشاورزی', 'keshavarzi', 'bki'], color: '#16a34a' },
  { name: 'بانک شهر', aliases: ['شهر', 'shahr'], color: '#dc2626' },
  { name: 'بانک آینده', aliases: ['آینده', 'ayandeh'], color: '#9333ea' },
  { name: 'بانک پارسیان', aliases: ['پارسیان', 'parsian'], color: '#b45309' },
  { name: 'بانک رفاه', aliases: ['رفاه', 'refah'], color: '#0284c7' },
  { name: 'بانک مهر ایران', aliases: ['مهر ایران', 'قرض الحسنه مهر'], color: '#059669' },
  { name: 'بانک مسکن', aliases: ['مسکن', 'maskan'], color: '#d97706' },
];

/**
 * Parses Iranian bank SMS and extracts transaction details
 */
export function parseBankSms(rawText: string): ParsedBankSms | null {
  if (!rawText || typeof rawText !== 'string') return null;

  const normalized = toEnglishDigits(rawText.trim());

  // 1. Identify Bank
  let detectedBank = 'سایر بانک‌ها';
  for (const b of KNOWN_BANKS) {
    if (b.aliases.some(alias => normalized.includes(alias) || rawText.includes(alias))) {
      detectedBank = b.name;
      break;
    }
  }

  // 2. Identify Card or Account number (e.g. 4 digits or masked card)
  let cardLast4: string | undefined;
  const cardMatch =
    normalized.match(/(?:کارت|حساب|به|از|card)\s*(?:شماره|:)?\s*[\d\*\.]{0,12}(\d{4})/i) ||
    normalized.match(/(?:[^\d]|^)(\d{4})(?=[^\d]|$).*(?:کارت|حساب)/i);
  if (cardMatch && cardMatch[1]) {
    cardLast4 = cardMatch[1];
  }

  // 3. Identify Transaction Kind (expense vs income)
  const isIncome = /(واریز|سود|انتقال به حساب|پایا|ساتنا|افزایش)/i.test(normalized);
  const isExpense = /(برداشت|خرید|انتقال از|کسر|پرداخت قبوض|کاهش|خودپرداز)/i.test(normalized);

  let kind: 'expense' | 'income' = isIncome ? 'income' : 'expense';
  if (!isIncome && !isExpense) {
    // If ambiguous, default to expense
    kind = 'expense';
  }

  // 4. Extract Amount (مبلغ)
  // Look for patterns like: مبلغ: ۱۲۳,۰۰۰ ریال/تومان or برداشت ۱۲۳,۰۰۰ ریال/تومان
  let amount = 0;
  const amountPattern =
    /(?:مبلغ|واریز|برداشت|خرید|پرداخت|انتقال)?\s*:?\s*([\d,]+)\s*(ریال|تومان|ت)/i;
  const matchAmount = normalized.match(amountPattern);

  if (matchAmount && matchAmount[1]) {
    const rawVal = Number(matchAmount[1].replace(/,/g, ''));
    const unit = matchAmount[2];
    if (rawVal > 0) {
      amount = unit.includes('ریال') ? Math.round(rawVal / 10) : rawVal;
    }
  } else {
    // Fallback: look for largest number with commas
    const numbersWithCommas = normalized.match(/\b\d{1,3}(?:,\d{3})+\b/g);
    if (numbersWithCommas && numbersWithCommas.length > 0) {
      const parsedNumbers = numbersWithCommas.map(n => Number(n.replace(/,/g, '')));
      const firstNum = parsedNumbers[0];
      if (normalized.includes('ریال')) {
        amount = Math.round(firstNum / 10);
      } else {
        amount = firstNum;
      }
    }
  }

  // If amount is still 0 or invalid, this is not a valid transaction SMS
  if (amount <= 0) {
    return null;
  }

  // 5. Extract Balance (مانده / موجودی)
  let balance: number | undefined;
  const balancePattern =
    /(?:مانده|موجودی|مانده حساب|مانده فعلی|موجودی جدید|مانده پس از تراکنش)\s*:?\s*([\d,]+)\s*(ریال|تومان|ت)?/i;
  const matchBalance = normalized.match(balancePattern);

  if (matchBalance && matchBalance[1]) {
    const rawBal = Number(matchBalance[1].replace(/,/g, ''));
    const balUnit = matchBalance[2] || (normalized.includes('ریال') ? 'ریال' : 'تومان');
    if (rawBal >= 0) {
      balance = balUnit.includes('ریال') ? Math.round(rawBal / 10) : rawBal;
    }
  }

  // 6. Extract Description / Merchant
  let description = `${kind === 'expense' ? 'برداشت / خرید' : 'واریز'} ${detectedBank}`;
  const descMatch = normalized.match(/(?:خرید از|فروشگاه|پذیرنده|بابت|انتقال به|طرف)\s*:?\s*([^\n\r,]+)/i);
  if (descMatch && descMatch[1]) {
    description = descMatch[1].trim();
  }

  return {
    rawText,
    bankName: detectedBank,
    cardLast4,
    kind,
    amount,
    balance,
    description,
  };
}
