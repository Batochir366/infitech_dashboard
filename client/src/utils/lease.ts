/** Calendar helpers (aligned with server lease rules). */

export function monthIndex(year: number, month0: number): number {
  return year * 12 + month0;
}

export function lastLeaseMonth(
  leaseStart: Date,
  rentDurationMonths: number,
): { year: number; month1: number } {
  const startY = leaseStart.getFullYear();
  const startM0 = leaseStart.getMonth();
  const lastIdx = startM0 + rentDurationMonths - 1;
  const year = startY + Math.floor(lastIdx / 12);
  const month0 = lastIdx % 12;
  return { year, month1: month0 + 1 };
}

export function isCalendarMonthInLease(
  leaseStart: Date,
  rentDurationMonths: number,
  calYear: number,
  calMonth0: number,
): boolean {
  const start = monthIndex(leaseStart.getFullYear(), leaseStart.getMonth());
  const end = lastLeaseMonth(leaseStart, rentDurationMonths);
  const endIdx = monthIndex(end.year, end.month1 - 1);
  const cur = monthIndex(calYear, calMonth0);
  return cur >= start && cur <= endIdx;
}
