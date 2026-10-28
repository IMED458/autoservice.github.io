export function toISODateInputValue(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDDMMYYYY(value?: string): string {
  if (!value) return '';

  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;

  const slashDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    return `${slashDate[1].padStart(2, '0')}/${slashDate[2].padStart(2, '0')}/${slashDate[3]}`;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return toISODateInputValue(parsed).split('-').reverse().join('/');
  }

  return value;
}

export function formatDateTimeDDMMYYYY(value?: string): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return formatDateDDMMYYYY(value);
  const date = formatDateDDMMYYYY(toISODateInputValue(parsed));
  const time = parsed.toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  return `${date} ${time}`;
}

export function parseDDMMYYYYToISO(value: string): string | null {
  const match = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (
    parsed.getFullYear() !== Number(year) ||
    parsed.getMonth() !== Number(month) - 1 ||
    parsed.getDate() !== Number(day)
  ) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

export function shiftISODate(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  return toISODateInputValue(new Date(y, m - 1, d + days));
}

/** Inclusive check on yyyy-mm-dd strings; empty bounds are open */
export function isDateInRange(isoDate: string | undefined, from: string, to: string): boolean {
  if (!from && !to) return true;
  if (!isoDate) return false;
  const d = isoDate.slice(0, 10);
  if (from && d < from) return false;
  if (to && d > to) return false;
  return true;
}
