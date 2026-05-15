/** Calendar month index for comparisons (year, month 0–11). */
export function monthIndex(year: number, month0: number): number {
  return year * 12 + month0;
}

/** Month 1–12 / year from lease start after adding (n - 1) whole months (first month is n = 1). */
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

/** Rent invoice slot (year, month 1–12, day) is within active lease. */
export function isRentalBillingDateInLease(
  leaseStart: Date,
  rentDurationMonths: number,
  year: number,
  month1: number,
  day: number,
): boolean {
  if (month1 < 1 || month1 > 12 || day < 1 || day > 31) return false;
  const lastDay = new Date(year, month1, 0).getDate();
  if (day > lastDay) return false;
  return isCalendarMonthInLease(
    leaseStart,
    rentDurationMonths,
    year,
    month1 - 1,
  );
}

export function rentPeriodKey(
  clientId: number,
  year: number,
  month1: number,
  day: number,
): string {
  return `${clientId}|${year}|${month1}|${day}`;
}
