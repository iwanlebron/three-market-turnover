import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Currency } from "@/lib/markets";
import { amountScale, formatAmount, formatDay } from "@/lib/format";

type Point = { date: string; amount: number };

export function SessionBars({
  sessions,
  currency,
}: {
  sessions: Point[];
  currency: Currency;
}) {
  const scale = amountScale(sessions.map((session) => session.amount));
  const data = sessions.map((session) => ({
    ...session,
    label: formatDay(session.date).md.replace("月", "/").replace("日", ""),
  }));

  const tip = (
    <Tooltip
      cursor={{ fill: "var(--color-line)" }}
      content={({ active, payload }) => {
        if (!active || !payload?.length) return null;
        const point = payload[0]?.payload as Point | undefined;
        if (!point) return null;
        const amount = formatAmount(point.amount, currency, scale);
        const day = formatDay(point.date);
        return (
          <div className="rounded-md border border-line bg-card px-2 py-1 text-xs text-ink shadow-none">
            <div>
              {day.md} {day.week}
            </div>
            <div className="font-medium tabular-nums">
              {amount.value}
              {amount.unit}
            </div>
          </div>
        );
      }}
    />
  );

  return (
    <div className="h-24 w-full" role="img" aria-label="所选区间成交额">
      <ResponsiveContainer width="100%" height="100%">
        {data.length > 36 ? (
          <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[0, "auto"]} />
            {tip}
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--color-ink)"
              fill="var(--color-line)"
              isAnimationActive={false}
            />
          </AreaChart>
        ) : (
          <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="label" hide />
            <YAxis hide domain={[0, "auto"]} />
            {tip}
            <Bar dataKey="amount" radius={[2, 2, 0, 0]} isAnimationActive={false} maxBarSize={18}>
              {data.map((point, index) => (
                <Cell
                  key={point.date}
                  fill={index === data.length - 1 ? "var(--color-up)" : "var(--color-ink)"}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
