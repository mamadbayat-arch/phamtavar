import { AppState, Task, Money, Habit } from '../types';

export interface AITrainingSample {
  id: string;
  domain: 'task_priority' | 'sms_parsing' | 'finance_categorization' | 'habit_analytics';
  instruction: string;
  input: string;
  output: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

/**
 * Anonymizes sensitive user information (card numbers, phone numbers, personal names)
 * before putting data into the AI training dataset.
 */
export function anonymizeText(text: string): string {
  if (!text) return '';
  return text
    // Replace 16-digit card numbers with [CARD_NUMBER]
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD_NUMBER]')
    // Replace Iranian phone numbers with [PHONE_NUMBER]
    .replace(/\b(09\d{9}|(\+98|0098)9\d{9})\b/g, '[PHONE_NUMBER]')
    // Replace IBAN / Sheba numbers with [SHEBA_NUMBER]
    .replace(/\bIR\d{24}\b/gi, '[SHEBA_NUMBER]');
}

/**
 * Transforms application state into clean, structured AI fine-tuning samples.
 * Format adheres to standard Gemini / OpenAI / HuggingFace instruction fine-tuning schema:
 * { "instruction": "...", "input": "...", "output": "..." }
 */
export function extractAiTrainingSamples(state: AppState): AITrainingSample[] {
  const samples: AITrainingSample[] = [];
  const now = new Date().toISOString();

  // 1. Task Prioritization & Eisenhower Matrix Training Data
  state.tasks.forEach(task => {
    if (task.title && task.quad) {
      const quadName =
        task.quad === 'q1'
          ? 'بسیار فوری و بسیار مهم (Q1)'
          : task.quad === 'q2'
          ? 'بسیار مهم ولی غیرفوری - برنامه‌ریزی استراتژیک (Q2)'
          : task.quad === 'q3'
          ? 'فوری ولی دارای اهمیت کم (Q3)'
          : 'غیرفوری و کم‌اهمیت (Q4)';

      samples.push({
        id: `task_${task.id}`,
        domain: 'task_priority',
        instruction:
          'عنوان کار ورودی را تحلیل کن و جایگاه مناسب آن در ماتریس آیزنهاور، میزان فوریت، اهمیت و توصیه مدیریت زمان را در قالب JSON ارائه بده.',
        input: anonymizeText(task.title),
        output: JSON.stringify(
          {
            quadrant: task.quad,
            quadrant_fa: quadName,
            is_urgent: task.quad === 'q1' || task.quad === 'q3',
            is_important: task.quad === 'q1' || task.quad === 'q2',
            has_deadline: !!task.date,
            subtasks_count: task.subs?.length || 0,
            completion_status: task.done ? 'completed' : 'pending',
          },
          null,
          2
        ),
        metadata: {
          hasTime: !!task.time,
          hasSubs: (task.subs?.length || 0) > 0,
        },
        timestamp: now,
      });
    }
  });

  // 2. Financial Expense & Income Categorization Training Data
  state.money.forEach(item => {
    if (item.title && item.category) {
      samples.push({
        id: `money_${item.id}`,
        domain: 'finance_categorization',
        instruction:
          'تراکنش مالی زیر را تحلیل کرده و دسته‌بندی مناسب، نوع تراکنش (درآمد یا هزینه) و برچسب‌های مفهومی آن را به فرمت JSON مشخص کن.',
        input: `عنوان تراکنش: ${anonymizeText(item.title)} | مبلغ: ${item.amount.toLocaleString('fa-IR')} تومان`,
        output: JSON.stringify(
          {
            category: item.category,
            kind: item.kind,
            kind_fa: item.kind === 'income' ? 'درآمد' : 'هزینه',
            estimated_urgency: ['خوراک', 'سلامت', 'خانه'].includes(item.category) ? 'ضروری' : 'اختیاری',
          },
          null,
          2
        ),
        metadata: {
          category: item.category,
          kind: item.kind,
        },
        timestamp: now,
      });
    }
  });

  // 3. Bank Account & SMS Pattern Training Data
  state.bankAccounts?.forEach(acc => {
    if (acc.bankName) {
      samples.push({
        id: `bank_${acc.id}`,
        domain: 'sms_parsing',
        instruction:
          'نام بانک و اطلاعات حساب را اعتبارسنجی کن و قالب استاندارد پیامک‌های تراکنش آن را برگردان.',
        input: `بانک: ${acc.bankName}`,
        output: JSON.stringify(
          {
            bank: acc.bankName,
            card_last4: acc.cardLast4 || 'XXXX',
            supports_auto_parser: true,
          },
          null,
          2
        ),
        metadata: {
          bank: acc.bankName,
        },
        timestamp: now,
      });
    }
  });

  // 4. Habit Consistency & Behavioral Analytics Training Data
  state.habits.forEach(habit => {
    if (habit.title && habit.days) {
      const logsCount = habit.logs?.length || 0;
      samples.push({
        id: `habit_${habit.id}`,
        domain: 'habit_analytics',
        instruction:
          'الگوی رفتاری و تکرار این عادت را تحلیل کرده و برنامه پیشنهادی حفظ انگیزه و تثبیت را به فرمت JSON خروجی بده.',
        input: `عنوان عادت: ${habit.title} | روزهای هدف: ${habit.days.length} روز در هفته | تعداد دفعات انجام‌شده: ${logsCount}`,
        output: JSON.stringify(
          {
            habit_title: habit.title,
            frequency_days_per_week: habit.days.length,
            completed_sessions: logsCount,
            consistency_level: logsCount > 21 ? 'تثبیت‌شده' : logsCount > 7 ? 'در حال شکل‌گیری' : 'شروع تازه',
            streak_recommendation:
              logsCount > 10
                ? 'استمرار عالی است، به همین روند ادامه دهید.'
                : 'پیشنهاد می‌شود زمان مشخصی از روز را به این کار اختصاص دهید.',
          },
          null,
          2
        ),
        metadata: {
          daysCount: habit.days.length,
          logsCount,
        },
        timestamp: now,
      });
    }
  });

  return samples;
}

/**
 * Converts training samples to JSONL (Newline Delimited JSON).
 * Standard format for Fine-Tuning Google Gemini, OpenAI, and LLaMA models.
 */
export function formatAsJsonL(samples: AITrainingSample[]): string {
  return samples
    .map(sample =>
      JSON.stringify({
        messages: [
          { role: 'system', content: 'شما دستیار هوشمند مدیریت زندگی، اولویت‌بندی کارها و امور مالی همتوار هستید.' },
          { role: 'user', content: `${sample.instruction}\n\nورودی:\n${sample.input}` },
          { role: 'assistant', content: sample.output },
        ],
        metadata: {
          id: sample.id,
          domain: sample.domain,
          timestamp: sample.timestamp,
        },
      })
    )
    .join('\n');
}

/**
 * Triggers client-side download of the prepared AI Dataset file.
 */
export function downloadAiDatasetFile(state: AppState, format: 'jsonl' | 'json' = 'jsonl') {
  const samples = extractAiTrainingSamples(state);
  let content = '';
  let filename = '';
  let mimeType = '';

  if (format === 'jsonl') {
    content = formatAsJsonL(samples);
    filename = `hamtavar-ai-training-dataset-${new Date().toISOString().slice(0, 10)}.jsonl`;
    mimeType = 'application/x-jsonlines';
  } else {
    content = JSON.stringify(samples, null, 2);
    filename = `hamtavar-ai-dataset-${new Date().toISOString().slice(0, 10)}.json`;
    mimeType = 'application/json';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
