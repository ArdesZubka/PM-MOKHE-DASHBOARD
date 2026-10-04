/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const MONTHS_SHORT_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des'
] as const;

export const MONTHS_FULL_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
] as const;

export interface FormatDateOptions {
  includeYear?: boolean;
  useFullMonth?: boolean;
}

/**
 * Formats a date string (ISO / YYYY-MM-DD / Date) into Indonesian human-friendly date.
 * Example: '2026-06-15' -> '15 Jun 2026' (or '15 Jun' if includeYear = false)
 */
export function formatDate(
  dateInput?: string | Date | null,
  options: FormatDateOptions = { includeYear: true, useFullMonth: false }
): string {
  if (!dateInput) return '-';

  const { includeYear = true, useFullMonth = false } = options;
  const monthList = useFullMonth ? MONTHS_FULL_ID : MONTHS_SHORT_ID;

  // If string matches YYYY-MM-DD or starts with YYYY-MM-DD (ISO string)
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateInput)) {
    const [yearStr, monthStr, dayStr] = dateInput.split('T')[0].split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    const d = parseInt(dayStr, 10);

    const monthName = monthList[m - 1] || '';
    if (includeYear) {
      return `${d} ${monthName} ${y}`;
    }
    return `${d} ${monthName}`;
  }

  // Fallback for Date objects or other string formats
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (d instanceof Date && !isNaN(d.getTime())) {
      const day = d.getDate();
      const monthName = monthList[d.getMonth()] || '';
      const year = d.getFullYear();

      if (includeYear) {
        return `${day} ${monthName} ${year}`;
      }
      return `${day} ${monthName}`;
    }
  } catch {
    // Return original string fallback if parsing fails
  }

  return typeof dateInput === 'string' ? dateInput : '-';
}

/**
 * Formats start and end dates as a connected range string with arrow separator.
 * Example: '2026-06-15', '2026-07-20' -> '15 Jun 2026 → 20 Jul 2026'
 */
export function formatDateRange(
  startDateInput?: string | Date | null,
  endDateInput?: string | Date | null,
  options?: FormatDateOptions
): string {
  const startFormatted = formatDate(startDateInput, options);
  const endFormatted = formatDate(endDateInput, options);

  if (startFormatted === '-' && endFormatted === '-') return '-';
  if (startFormatted === '-') return endFormatted;
  if (endFormatted === '-') return startFormatted;

  return `${startFormatted} → ${endFormatted}`;
}

/**
 * Short date format without year.
 * Example: '2026-06-15' -> '15 Jun'
 */
export function formatShortDate(dateInput?: string | Date | null): string {
  return formatDate(dateInput, { includeYear: false });
}
