/**
 * 格式化日期
 */
export function formatDate(date: Date | string, format: string = 'YYYY-MM-DD'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 计算时间差（分钟）
 */
export function getMinutesDiff(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
}

/**
 * 检查日期是否在范围内
 */
export function isDateInRange(date: Date, start?: Date, end?: Date): boolean {
  const now = date.getTime();

  if (start && now < start.getTime()) {
    return false;
  }

  if (end && now > end.getTime()) {
    return false;
  }

  return true;
}
