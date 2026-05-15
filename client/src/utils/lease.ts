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

export type CalendarMonthBounds = {
  minY: number;
  minM: number;
  maxY: number;
  maxM: number;
};

/** Initial / reset view: today clamped to rent lease or buy installment range. */
export function computeClampedCalendarMonth(
  paymentType: "rent" | "buy",
  opts: {
    leaseBounds: { y: number; m: number };
    leaseStart: Date;
    rentDurationMonths: number;
    buyBounds: CalendarMonthBounds;
    buyInstallmentCount: number;
  },
): { year: number; month: number } {
  const now = new Date();
  let ty = now.getFullYear();
  let tm = now.getMonth();

  if (paymentType === "rent") {
    const { y: jy, m: jm } = opts.leaseBounds;
    if (ty < jy || (ty === jy && tm < jm)) {
      ty = jy;
      tm = jm;
    }
    const last = lastLeaseMonth(opts.leaseStart, opts.rentDurationMonths);
    const endIdx = monthIndex(last.year, last.month1 - 1);
    if (monthIndex(ty, tm) > endIdx) {
      ty = last.year;
      tm = last.month1 - 1;
    }
  } else if (opts.buyInstallmentCount > 0) {
    const { minY, minM, maxY, maxM } = opts.buyBounds;
    if (ty < minY || (ty === minY && tm < minM)) {
      ty = minY;
      tm = minM;
    }
    if (ty > maxY || (ty === maxY && tm > maxM)) {
      ty = maxY;
      tm = maxM;
    }
  }

  return { year: ty, month: tm };
}
