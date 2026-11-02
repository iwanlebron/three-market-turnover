export type Currency = "CNY" | "HKD" | "USD";
export type AmountScale = "yi" | "wanYi";

const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

export function formatDay(iso: string): { md: string; week: string; full: string } {
  const [year, month, day] = iso.split("-").map(Number);
  const week = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
  return {
    md: `${month}月${day}日`,
    week,
    full: `${year}年${month}月${day}日`,
  };
}

export function formatPct(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

/** One scale for a whole column, so 9830亿 and 1.04万亿 never sit in the same list. */
export function amountScale(amounts: number[]): AmountScale {
  const maxYi = Math.max(0, ...amounts) / 1e8;
  return maxYi >= 10000 ? "wanYi" : "yi";
}

export function formatAmount(
  amount: number,
  currency: Currency,
  scale?: AmountScale,
): { value: string; unit: string } {
  const yi = amount / 1e8;
  const name = currency === "USD" ? "美元" : currency === "HKD" ? "港元" : "人民币";
  const useWan = scale ? scale === "wanYi" : yi >= 10000;
  if (useWan) {
    return { value: trim(yi / 10000), unit: `万亿${name}` };
  }
  return { value: trim(yi), unit: `亿${name}` };
}

function trim(value: number): string {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

export function hongKongDay(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function shiftDay(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day));
  next.setUTCDate(next.getUTCDate() - days);
  return next.toISOString().slice(0, 10);
}

export function formatFetchedAt(iso: string): string {
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Hong_Kong",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${pick("month")}月${pick("day")}日 ${pick("hour")}:${pick("minute")}`;
}
