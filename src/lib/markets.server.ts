import type { Sql } from "./db";
import type { Board, MarketBoard, Session } from "./markets";

type MarketId = MarketBoard["id"];
type Row = { date: string; amount: number; close: number | null };
type Attempt = { id: MarketId; rows: Row[] | null; error: string | null };

const UA = "Mozilla/5.0 (compatible; TurnoverDesk/1.0; +https://grok.com)";
const TTL_MS = 10 * 60 * 1000;
const FULL_DAYS = 2500;
const RECENT_DAYS = 40;
const ARCHIVE_ENOUGH = 400;

const PROFILES: Record<
  MarketId,
  Omit<MarketBoard, "sessions" | "error">
> = {
  cn: {
    id: "cn",
    name: "A股",
    blurb: "沪深两市",
    definition: "上证指数成交额加上深证综指成交额，也就是沪深两市成交额，不含北交所。",
    currency: "CNY",
    indexName: "上证",
  },
  hk: {
    id: "hk",
    name: "港股",
    blurb: "港交所证券",
    definition: "香港交易所每日市场总成交额，与港交所行情报告里的 Total market turnover 一致。",
    currency: "HKD",
    indexName: "恒指",
  },
  us: {
    id: "us",
    name: "美股",
    blurb: "全美股票",
    definition:
      "Cboe 汇总的全美股票名义成交额：各交易所加上场外交易报告（TRF），Tape A/B/C 合计，单位美元。",
    currency: "USD",
    indexName: null,
  },
};

let cache: { at: number; board: Board } | null = null;

export async function loadBoard(fresh: boolean): Promise<Board> {
  if (!fresh && cache && Date.now() - cache.at < TTL_MS) return cache.board;
  const board = await buildBoard();
  const usable = board.markets.some((market) => market.sessions.length > 0);
  if (usable) cache = { at: Date.now(), board };
  return board;
}

async function buildBoard(): Promise<Board> {
  const spans = await safeSpans();
  const fetched = await Promise.all([
    attempt("cn", () => loadChinaRows(spanCount(spans, "cn") >= ARCHIVE_ENOUGH ? RECENT_DAYS : FULL_DAYS)),
    attempt("hk", () =>
      loadHongKongRows(spanCount(spans, "hk") >= ARCHIVE_ENOUGH ? RECENT_DAYS : 2000),
    ),
    attempt("us", () => loadUnitedStatesRows(spanCount(spans, "us") < ARCHIVE_ENOUGH)),
  ]);

  const stored = await remember(fetched);
  return {
    markets: (["cn", "hk", "us"] as const).map((id) => {
      const fromDb = stored?.get(id) ?? [];
      const got = fetched.find((item) => item.id === id);
      const rows = fromDb.length >= 2 ? fromDb : (got?.rows ?? []);
      return toMarket(id, rows, got?.error ?? null);
    }),
    fetchedAt: new Date().toISOString(),
  };
}

function spanCount(spans: Map<string, number>, id: MarketId): number {
  return spans.get(id) ?? 0;
}

function toMarket(id: MarketId, rows: Row[], error: string | null): MarketBoard {
  const profile = PROFILES[id];
  if (rows.length < 2) {
    return { ...profile, sessions: [], error: error ?? `${profile.name}成交额暂时取不到` };
  }
  try {
    return { ...profile, sessions: toSessions(rows), error: null };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "未知错误";
    return { ...profile, sessions: [], error: error ?? detail };
  }
}

async function attempt(id: MarketId, work: () => Promise<Row[]>): Promise<Attempt> {
  try {
    return { id, rows: dedupe(await work()), error: null };
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : "未知错误";
    return { id, rows: null, error: `${PROFILES[id].name}成交额暂时取不到（${detail}）` };
  }
}

async function safeSpans(): Promise<Map<string, number>> {
  try {
    const sql = await sqlClient();
    const rows = await sql.query<{ market: string; n: number }>(
      "select market, count(*)::int as n from turnovers group by market",
    );
    return new Map(rows.map((row) => [row.market, Number(row.n)]));
  } catch {
    return new Map();
  }
}

async function remember(fetched: Attempt[]): Promise<Map<MarketId, Row[]> | null> {
  try {
    const sql = await sqlClient();
    for (const item of fetched) {
      if (!item.rows?.length) continue;
      await upsert(sql, item.id, item.rows);
    }
    return readArchive(sql);
  } catch {
    return null;
  }
}

async function sqlClient(): Promise<Sql> {
  const { getSql } = await import("./db.ts");
  return getSql();
}

async function upsert(sql: Sql, market: MarketId, rows: Row[]): Promise<void> {
  const clean = rows.filter((row) => Number.isFinite(row.amount) && row.amount > 0);
  const size = 80;
  for (let offset = 0; offset < clean.length; offset += size) {
    const slice = clean.slice(offset, offset + size);
    const values: unknown[] = [];
    const tuples = slice.map((row, index) => {
      const base = index * 4;
      values.push(market, row.date, row.amount, row.close);
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`;
    });
    await sql.query(
      `insert into turnovers (market, day, amount, close) values ${tuples.join(", ")}
       on conflict (market, day) do update set amount = excluded.amount, close = excluded.close`,
      values,
    );
  }
}

async function readArchive(sql: Sql): Promise<Map<MarketId, Row[]>> {
  const rows = await sql.query<{
    market: string;
    day: string;
    amount: string;
    close: string | null;
  }>("select market, day::text as day, amount::text as amount, close::text as close from turnovers order by day asc");
  const grouped = new Map<MarketId, Row[]>();
  for (const row of rows) {
    if (row.market !== "cn" && row.market !== "hk" && row.market !== "us") continue;
    const close = row.close === null ? null : Number(row.close);
    const list = grouped.get(row.market) ?? [];
    list.push({
      date: String(row.day).slice(0, 10),
      amount: Number(row.amount),
      close: close !== null && Number.isFinite(close) ? close : null,
    });
    grouped.set(row.market, list);
  }
  return grouped;
}

async function loadChinaRows(limit: number): Promise<Row[]> {
  try {
    const rows = await loadChinaXuangubao(limit);
    assertRange(rows, 1e11, 2e13, "A股");
    return rows;
  } catch (error) {
    if (limit > RECENT_DAYS) return loadChinaRows(RECENT_DAYS);
    const rows = await loadChinaTonghuashun();
    assertRange(rows, 1e11, 2e13, "A股");
    if (error instanceof Error && rows.length === 0) throw error;
    return rows;
  }
}

async function loadChinaXuangubao(limit: number): Promise<Row[]> {
  const url = `https://api-ddc-wscn.xuangubao.cn/market/kline?prod_code=000001.SS,399106.SZ&tick_count=${limit}&period_type=86400&fields=tick_at,open_px,close_px,turnover_value`;
  const json = (await getJson(url, "https://wallstreetcn.com/")) as {
    data?: { fields?: string[]; candle?: Record<string, { lines?: number[][] }> };
  };
  const fields = json.data?.fields ?? [];
  const candle = json.data?.candle ?? {};
  const sh = candleRows(candle["000001.SS"], fields);
  const sz = candleRows(candle["399106.SZ"], fields);
  return mergeAmounts(sh, sz);
}

async function loadChinaTonghuashun(): Promise<Row[]> {
  const [shText, szText] = await Promise.all([
    getText("https://d.10jqka.com.cn/v6/line/16_1A0001/01/last.js", "https://q.10jqka.com.cn/"),
    getText("https://d.10jqka.com.cn/v6/line/32_399106/01/last.js", "https://q.10jqka.com.cn/"),
  ]);
  return mergeAmounts(parseTonghuashun(shText), parseTonghuashun(szText));
}

function candleRows(node: { lines?: number[][] } | undefined, fields: string[]): Row[] {
  const lines = node?.lines ?? [];
  const dateAt = fields.indexOf("tick_at");
  const closeAt = fields.indexOf("close_px");
  const amountAt = fields.indexOf("turnover_value");
  if (dateAt < 0 || amountAt < 0 || lines.length === 0) throw new Error("行情字段缺失");
  return lines.map((line) => ({
    date: utcDate(Number(line[dateAt])),
    amount: Number(line[amountAt]),
    close: closeAt >= 0 ? Number(line[closeAt]) : null,
  }));
}

function parseTonghuashun(text: string): Row[] {
  const match = text.match(/\((\{[\s\S]*\})\)\s*$/);
  if (!match) throw new Error("同花顺格式变化");
  const payload = JSON.parse(match[1]) as { data?: string };
  if (!payload.data) throw new Error("同花顺无数据");
  return payload.data
    .split(";")
    .filter(Boolean)
    .map((row) => {
      const parts = row.split(",");
      const raw = parts[0] ?? "";
      return {
        date: `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`,
        close: Number(parts[4]),
        amount: Number(parts[6]),
      };
    });
}

function mergeAmounts(primary: Row[], secondary: Row[]): Row[] {
  const extra = new Map(secondary.map((row) => [row.date, row.amount]));
  return primary
    .filter((row) => extra.has(row.date))
    .map((row) => ({
      date: row.date,
      close: row.close,
      amount: row.amount + (extra.get(row.date) ?? 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function loadHongKongRows(limit: number): Promise<Row[]> {
  try {
    return await hongKongBars(limit);
  } catch (error) {
    if (limit > RECENT_DAYS) return loadHongKongRows(RECENT_DAYS);
    throw error;
  }
}

async function hongKongBars(limit: number): Promise<Row[]> {
  const text = await getText(
    `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=hkHSI,day,,,${limit},qfq`,
    "https://gu.qq.com/",
  );
  const json = JSON.parse(text) as {
    data?: { hkHSI?: { day?: string[][]; qfqday?: string[][] } };
  };
  const bars = json.data?.hkHSI?.qfqday ?? json.data?.hkHSI?.day ?? [];
  const rows = bars
    .map((bar) => ({
      date: bar[0] ?? "",
      close: Number(bar[2]),
      amount: Number(bar[5]),
    }))
    .filter((row) => row.date && Number.isFinite(row.amount))
    .sort((a, b) => a.date.localeCompare(b.date));
  assertRange(rows, 1e10, 1e13, "港股");
  return rows;
}

async function loadUnitedStatesRows(full: boolean): Promise<Row[]> {
  const year = new Date().getUTCFullYear();
  const years: number[] = [];
  for (let cursor = full ? 2020 : year; cursor <= year; cursor += 1) years.push(cursor);
  const texts = await Promise.all(
    years.map((item) =>
      getText(
        `https://cdn.cboe.com/resources/us/equities/market-statistics/historical-market-volume/market_history_${item}.csv`,
        "https://www.cboe.com/",
      ).catch(() => ""),
    ),
  );
  const sums = new Map<string, number>();
  for (const text of texts) {
    if (!text) continue;
    for (const [day, amount] of parseCboe(text)) sums.set(day, amount);
  }
  const rows = [...sums.entries()]
    .map(([date, amount]) => ({ date, amount, close: null }))
    .sort((a, b) => a.date.localeCompare(b.date));
  assertRange(rows, 1e11, 1e14, "美股");
  return rows;
}

function parseCboe(text: string): Map<string, number> {
  const lines = text.trim().split(/\r?\n/);
  const header = (lines[0] ?? "").split(",");
  const dayAt = header.indexOf("Day");
  const nameAt = header.indexOf("Market Participant");
  const notionalAt = header.indexOf("Total Notional");
  if (dayAt < 0 || notionalAt < 0) throw new Error("Cboe 字段变化");
  const sums = new Map<string, number>();
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const parts = line.split(",");
    const day = parts[dayAt] ?? "";
    const name = parts[nameAt] ?? "";
    if (!day || /total/i.test(name)) continue;
    const notional = Number(parts[notionalAt]);
    if (!Number.isFinite(notional)) continue;
    sums.set(day, (sums.get(day) ?? 0) + notional);
  }
  return sums;
}

function dedupe(rows: Row[]): Row[] {
  const map = new Map<string, Row>();
  for (const row of rows) map.set(row.date, row);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function toSessions(rows: Row[]): Session[] {
  const clean = dedupe(rows).filter(
    (row) => /^\d{4}-\d{2}-\d{2}$/.test(row.date) && Number.isFinite(row.amount) && row.amount > 0,
  );
  if (clean.length < 2) throw new Error("交易日不足");
  return clean.map((row, index) => {
    const prev = index > 0 ? clean[index - 1] : null;
    const amountChangePct =
      prev && prev.amount > 0 ? ((row.amount - prev.amount) / prev.amount) * 100 : null;
    const indexChangePct =
      prev && prev.close && row.close ? ((row.close - prev.close) / prev.close) * 100 : null;
    return {
      date: row.date,
      amount: row.amount,
      close: row.close,
      amountChangePct,
      indexChangePct,
    };
  });
}

function assertRange(rows: Row[], min: number, max: number, label: string) {
  const latest = rows[rows.length - 1];
  if (!latest || latest.amount < min || latest.amount > max) {
    throw new Error(`${label}成交额超出合理区间`);
  }
}

function utcDate(seconds: number): string {
  const date = new Date(seconds * 1000);
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${date.getUTCFullYear()}-${month}-${day}`;
}

async function getText(url: string, referer: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*", Referer: referer },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

async function getJson(url: string, referer: string): Promise<unknown> {
  return JSON.parse(await getText(url, referer)) as unknown;
}
