import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { SessionBars } from "@/components/session-bars";
import {
  amountScale,
  formatAmount,
  formatDay,
  formatFetchedAt,
  formatPct,
  hongKongDay,
  shiftDay,
} from "@/lib/format";
import { getBoard, type Board, type MarketBoard, type Session } from "@/lib/markets";

export const Route = createFileRoute("/")({
  loader: () => getBoard({ data: { fresh: false } }),
  component: Home,
});

type RangeId = "10" | "30" | "90" | "ytd" | "all";

const RANGES: { id: RangeId; label: string }[] = [
  { id: "10", label: "近十日" },
  { id: "30", label: "近一月" },
  { id: "90", label: "近三月" },
  { id: "ytd", label: "今年" },
  { id: "all", label: "全部" },
];

function Home() {
  const initial = Route.useLoaderData();
  const [board, setBoard] = useState<Board>(initial);
  const [range, setRange] = useState<RangeId>("10");
  const [pending, setPending] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  async function refresh() {
    setPending(true);
    setRefreshError(null);
    try {
      setBoard(await getBoard({ data: { fresh: true } }));
    } catch {
      setRefreshError("刷新失败，先显示上一次的数据。");
    } finally {
      setPending(false);
    }
  }

  const today = hongKongDay(board.fetchedAt);
  const earliest = board.markets
    .map((market) => market.sessions[0]?.date)
    .filter((date): date is string => Boolean(date))
    .sort()[0];
  const kept = board.markets.reduce((sum, market) => sum + market.sessions.length, 0);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="border-b-2 border-ink pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-widest text-muted">TURNOVER DESK</p>
            <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
              三市成交
            </h1>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={pending}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-medium text-paper disabled:opacity-60"
          >
            <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} aria-hidden />
            {pending ? "更新中" : "刷新数据"}
          </button>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          A股、港股、美股按本币归档。新的交易日会补进去，以前的留着。换时间看，页面不会越拉越长。
        </p>
        <p className="mt-2 text-xs text-muted">
          香港时间 {formatFetchedAt(board.fetchedAt)} 更新
          {earliest ? ` · 档案从 ${formatDay(earliest).full} 起，已保存 ${kept} 条` : ""}
          {refreshError ? ` · ${refreshError}` : ""}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-1" role="tablist" aria-label="时间范围">
          {RANGES.map((item) => {
            const active = range === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRange(item.id)}
                className={`min-h-11 border-b-2 px-3 text-sm ${
                  active ? "border-ink font-medium text-ink" : "border-transparent text-muted"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {board.markets.map((market) => (
          <MarketCard key={market.id} market={market} span={windowOf(market.sessions, range, today)} />
        ))}
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-3">
        {board.markets.map((market) => (
          <SessionList
            key={market.id}
            market={market}
            sessions={windowOf(market.sessions, range, today)}
            label={RANGES.find((item) => item.id === range)?.label ?? ""}
          />
        ))}
      </section>

      <footer className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        <p>成交额是成交金额，不是成交股数。A股用人民币，港股用港元，美股用美元。三个市场的休市日不一样，日期不会强行对齐。</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {board.markets.map((market) => (
            <li key={market.id}>
              {market.name}：{market.definition || market.error}
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
}

function windowOf(sessions: Session[], range: RangeId, today: string): Session[] {
  if (range === "all") return sessions;
  if (range === "10") return sessions.slice(-10);
  const start = range === "ytd" ? `${today.slice(0, 4)}-01-01` : shiftDay(today, range === "30" ? 31 : 92);
  return sessions.filter((session) => session.date >= start);
}

function MarketCard({ market, span }: { market: MarketBoard; span: Session[] }) {
  const latest = market.sessions[market.sessions.length - 1];
  if (!latest) {
    return (
      <article className="rounded-card border border-line bg-card p-5">
        <h2 className="font-serif text-2xl">{market.name}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{market.error ?? "暂无数据"}</p>
      </article>
    );
  }
  const shown = span.length > 0 ? span : market.sessions.slice(-10);
  const scale = amountScale(shown.map((session) => session.amount));
  const amount = formatAmount(latest.amount, market.currency, scale);
  const day = formatDay(latest.date);
  const up = (latest.amountChangePct ?? 0) > 0;
  const down = (latest.amountChangePct ?? 0) < 0;

  return (
    <article className="flex flex-col rounded-card border border-line bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-2xl font-semibold">{market.name}</h2>
        <p className="text-xs text-muted">
          {day.md} {day.week}
        </p>
      </div>
      <p className="mt-1 text-sm text-muted">{market.blurb}</p>
      <p className="mt-5 font-serif text-4xl font-semibold tabular-nums tracking-tight">
        {amount.value}
        <span className="ml-1 font-sans text-sm font-medium text-muted">{amount.unit}</span>
      </p>
      <p className={`mt-2 text-sm font-medium tabular-nums ${up ? "text-up" : down ? "text-down" : "text-muted"}`}>
        成交额较上一日 {formatPct(latest.amountChangePct)}
      </p>
      {market.indexName && latest.close ? (
        <p className="mt-1 text-xs tabular-nums text-muted">
          {market.indexName} {latest.close.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}{" "}
          <span className={indexTone(latest.indexChangePct)}>{formatPct(latest.indexChangePct)}</span>
        </p>
      ) : null}
      <div className="mt-4">
        <SessionBars sessions={shown} currency={market.currency} />
      </div>
    </article>
  );
}

function SessionList({
  market,
  sessions,
  label,
}: {
  market: MarketBoard;
  sessions: Session[];
  label: string;
}) {
  const rows = [...sessions].reverse();
  const scale = amountScale(sessions.map((session) => session.amount));
  const years = new Set(sessions.map((session) => session.date.slice(0, 4)));
  const scroll = rows.length > 12;
  return (
    <section className="rounded-card border border-line bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl font-semibold">
          {market.name}
          <span className="ml-2 font-sans text-sm font-normal text-muted">{label}</span>
        </h2>
        <p className="text-xs tabular-nums text-muted">{rows.length > 0 ? `${rows.length} 日` : ""}</p>
      </div>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{market.error ?? "这个区间没有交易日"}</p>
      ) : (
        <ol className={`mt-3 divide-y divide-line ${scroll ? "max-h-96 overflow-y-auto" : ""}`}>
          {rows.map((session, index) => {
            const amount = formatAmount(session.amount, market.currency, scale);
            const day = formatDay(session.date);
            const year = session.date.slice(0, 4);
            const prevYear = rows[index - 1]?.date.slice(0, 4);
            const up = (session.amountChangePct ?? 0) > 0;
            const down = (session.amountChangePct ?? 0) < 0;
            return (
              <li key={session.date} className="py-2 text-sm">
                {years.size > 1 && year !== prevYear ? (
                  <p className="pb-1 text-xs text-muted">{year}年</p>
                ) : null}
                <div className="flex items-baseline gap-3">
                  <span className="shrink-0 text-muted">
                    {day.md}
                    <span className="ml-1">{day.week}</span>
                  </span>
                  <span className="ml-auto tabular-nums font-medium">
                    {amount.value}
                    <span className="ml-1 text-xs font-normal text-muted">{amount.unit}</span>
                  </span>
                  <span
                    className={`w-14 shrink-0 text-right text-xs tabular-nums ${up ? "text-up" : down ? "text-down" : "text-muted"}`}
                  >
                    {formatPct(session.amountChangePct)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function indexTone(value: number | null): string {
  if (value === null || value === 0) return "text-muted";
  return value > 0 ? "text-up" : "text-down";
}
