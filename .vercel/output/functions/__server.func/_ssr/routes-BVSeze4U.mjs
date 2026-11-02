import { o as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as RefreshCw } from "../_libs/lucide-react.mjs";
import { n as Route, r as getBoard } from "./router-HgL7BzjG.mjs";
import { a as Area, c as ResponsiveContainer, i as XAxis, l as Tooltip, n as BarChart, o as Bar, r as YAxis, s as Cell, t as AreaChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BVSeze4U.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var WEEKDAYS = [
	"周日",
	"周一",
	"周二",
	"周三",
	"周四",
	"周五",
	"周六"
];
function formatDay(iso) {
	const [year, month, day] = iso.split("-").map(Number);
	const week = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
	return {
		md: `${month}月${day}日`,
		week,
		full: `${year}年${month}月${day}日`
	};
}
function formatPct(value) {
	if (value === null || !Number.isFinite(value)) return "—";
	return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
/** One scale for a whole column, so 9830亿 and 1.04万亿 never sit in the same list. */
function amountScale(amounts) {
	return Math.max(0, ...amounts) / 1e8 >= 1e4 ? "wanYi" : "yi";
}
function formatAmount(amount, currency, scale) {
	const yi = amount / 1e8;
	const name = currency === "USD" ? "美元" : currency === "HKD" ? "港元" : "人民币";
	if (scale ? scale === "wanYi" : yi >= 1e4) return {
		value: trim(yi / 1e4),
		unit: `万亿${name}`
	};
	return {
		value: trim(yi),
		unit: `亿${name}`
	};
}
function trim(value) {
	if (value >= 100) return value.toFixed(0);
	if (value >= 10) return value.toFixed(1);
	return value.toFixed(2);
}
function hongKongDay(iso) {
	return new Intl.DateTimeFormat("en-CA", {
		timeZone: "Asia/Hong_Kong",
		year: "numeric",
		month: "2-digit",
		day: "2-digit"
	}).format(new Date(iso));
}
function shiftDay(iso, days) {
	const [year, month, day] = iso.split("-").map(Number);
	const next = new Date(Date.UTC(year, month - 1, day));
	next.setUTCDate(next.getUTCDate() - days);
	return next.toISOString().slice(0, 10);
}
function formatFetchedAt(iso) {
	const date = new Date(iso);
	const parts = new Intl.DateTimeFormat("zh-CN", {
		timeZone: "Asia/Hong_Kong",
		month: "numeric",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).formatToParts(date);
	const pick = (type) => parts.find((part) => part.type === type)?.value ?? "";
	return `${pick("month")}月${pick("day")}日 ${pick("hour")}:${pick("minute")}`;
}
function SessionBars({ sessions, currency }) {
	const scale = amountScale(sessions.map((session) => session.amount));
	const data = sessions.map((session) => ({
		...session,
		label: formatDay(session.date).md.replace("月", "/").replace("日", "")
	}));
	const tip = /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
		cursor: { fill: "var(--color-line)" },
		content: ({ active, payload }) => {
			if (!active || !payload?.length) return null;
			const point = payload[0]?.payload;
			if (!point) return null;
			const amount = formatAmount(point.amount, currency, scale);
			const day = formatDay(point.date);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-md border border-line bg-card px-2 py-1 text-xs text-ink shadow-none",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					day.md,
					" ",
					day.week
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "font-medium tabular-nums",
					children: [amount.value, amount.unit]
				})]
			});
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-24 w-full",
		role: "img",
		"aria-label": "所选区间成交额",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
			width: "100%",
			height: "100%",
			children: data.length > 36 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
				data,
				margin: {
					top: 4,
					right: 0,
					left: 0,
					bottom: 0
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "label",
						hide: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						hide: true,
						domain: [0, "auto"]
					}),
					tip,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
						type: "monotone",
						dataKey: "amount",
						stroke: "var(--color-ink)",
						fill: "var(--color-line)",
						isAnimationActive: false
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
				data,
				margin: {
					top: 4,
					right: 0,
					left: 0,
					bottom: 0
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
						dataKey: "label",
						hide: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
						hide: true,
						domain: [0, "auto"]
					}),
					tip,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
						dataKey: "amount",
						radius: [
							2,
							2,
							0,
							0
						],
						isAnimationActive: false,
						maxBarSize: 18,
						children: data.map((point, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, { fill: index === data.length - 1 ? "var(--color-up)" : "var(--color-ink)" }, point.date))
					})
				]
			})
		})
	});
}
var RANGES = [
	{
		id: "10",
		label: "近十日"
	},
	{
		id: "30",
		label: "近一月"
	},
	{
		id: "90",
		label: "近三月"
	},
	{
		id: "ytd",
		label: "今年"
	},
	{
		id: "all",
		label: "全部"
	}
];
function Home() {
	const initial = Route.useLoaderData();
	const [board, setBoard] = (0, import_react.useState)(initial);
	const [range, setRange] = (0, import_react.useState)("10");
	const [pending, setPending] = (0, import_react.useState)(false);
	const [refreshError, setRefreshError] = (0, import_react.useState)(null);
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
	const earliest = board.markets.map((market) => market.sessions[0]?.date).filter((date) => Boolean(date)).sort()[0];
	const kept = board.markets.reduce((sum, market) => sum + market.sessions.length, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b-2 border-ink pb-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-end justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs font-medium tracking-widest text-muted",
							children: "TURNOVER DESK"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-1 font-serif text-4xl font-semibold tracking-tight sm:text-5xl",
							children: "三市成交"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: refresh,
							disabled: pending,
							className: "inline-flex min-h-11 items-center gap-2 rounded-full border border-ink bg-ink px-4 text-sm font-medium text-paper disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, {
								className: pending ? "size-4 animate-spin" : "size-4",
								"aria-hidden": true
							}), pending ? "更新中" : "刷新数据"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-2xl text-sm leading-relaxed text-muted sm:text-base",
						children: "A股、港股、美股按本币归档。新的交易日会补进去，以前的留着。换时间看，页面不会越拉越长。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-xs text-muted",
						children: [
							"香港时间 ",
							formatFetchedAt(board.fetchedAt),
							" 更新",
							earliest ? ` · 档案从 ${formatDay(earliest).full} 起，已保存 ${kept} 条` : "",
							refreshError ? ` · ${refreshError}` : ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 flex flex-wrap gap-x-1",
						role: "tablist",
						"aria-label": "时间范围",
						children: RANGES.map((item) => {
							const active = range === item.id;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "tab",
								"aria-selected": active,
								onClick: () => setRange(item.id),
								className: `min-h-11 border-b-2 px-3 text-sm ${active ? "border-ink font-medium text-ink" : "border-transparent text-muted"}`,
								children: item.label
							}, item.id);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-6 grid gap-4 md:grid-cols-3",
				children: board.markets.map((market) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MarketCard, {
					market,
					span: windowOf(market.sessions, range, today)
				}, market.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-8 grid gap-4 lg:grid-cols-3",
				children: board.markets.map((market) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionList, {
					market,
					sessions: windowOf(market.sessions, range, today),
					label: RANGES.find((item) => item.id === range)?.label ?? ""
				}, market.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "mt-8 border-t border-line pt-4 text-xs leading-relaxed text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "成交额是成交金额，不是成交股数。A股用人民币，港股用港元，美股用美元。三个市场的休市日不一样，日期不会强行对齐。" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 list-disc space-y-1 pl-4",
					children: board.markets.map((market) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
						market.name,
						"：",
						market.definition || market.error
					] }, market.id))
				})]
			})
		]
	});
}
function windowOf(sessions, range, today) {
	if (range === "all") return sessions;
	if (range === "10") return sessions.slice(-10);
	const start = range === "ytd" ? `${today.slice(0, 4)}-01-01` : shiftDay(today, range === "30" ? 31 : 92);
	return sessions.filter((session) => session.date >= start);
}
function MarketCard({ market, span }) {
	const latest = market.sessions[market.sessions.length - 1];
	if (!latest) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "rounded-card border border-line bg-card p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-serif text-2xl",
			children: market.name
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm leading-relaxed text-muted",
			children: market.error ?? "暂无数据"
		})]
	});
	const shown = span.length > 0 ? span : market.sessions.slice(-10);
	const scale = amountScale(shown.map((session) => session.amount));
	const amount = formatAmount(latest.amount, market.currency, scale);
	const day = formatDay(latest.date);
	const up = (latest.amountChangePct ?? 0) > 0;
	const down = (latest.amountChangePct ?? 0) < 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex flex-col rounded-card border border-line bg-card p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl font-semibold",
					children: market.name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-muted",
					children: [
						day.md,
						" ",
						day.week
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted",
				children: market.blurb
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-5 font-serif text-4xl font-semibold tabular-nums tracking-tight",
				children: [amount.value, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-1 font-sans text-sm font-medium text-muted",
					children: amount.unit
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: `mt-2 text-sm font-medium tabular-nums ${up ? "text-up" : down ? "text-down" : "text-muted"}`,
				children: ["成交额较上一日 ", formatPct(latest.amountChangePct)]
			}),
			market.indexName && latest.close ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 text-xs tabular-nums text-muted",
				children: [
					market.indexName,
					" ",
					latest.close.toLocaleString("zh-CN", { maximumFractionDigits: 2 }),
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: indexTone(latest.indexChangePct),
						children: formatPct(latest.indexChangePct)
					})
				]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionBars, {
					sessions: shown,
					currency: market.currency
				})
			})
		]
	});
}
function SessionList({ market, sessions, label }) {
	const rows = [...sessions].reverse();
	const scale = amountScale(sessions.map((session) => session.amount));
	const years = new Set(sessions.map((session) => session.date.slice(0, 4)));
	const scroll = rows.length > 12;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-card border border-line bg-card p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-baseline justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "font-serif text-xl font-semibold",
				children: [market.name, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-2 font-sans text-sm font-normal text-muted",
					children: label
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tabular-nums text-muted",
				children: rows.length > 0 ? `${rows.length} 日` : ""
			})]
		}), rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-3 text-sm text-muted",
			children: market.error ?? "这个区间没有交易日"
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: `mt-3 divide-y divide-line ${scroll ? "max-h-96 overflow-y-auto" : ""}`,
			children: rows.map((session, index) => {
				const amount = formatAmount(session.amount, market.currency, scale);
				const day = formatDay(session.date);
				const year = session.date.slice(0, 4);
				const prevYear = rows[index - 1]?.date.slice(0, 4);
				const up = (session.amountChangePct ?? 0) > 0;
				const down = (session.amountChangePct ?? 0) < 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-2 text-sm",
					children: [years.size > 1 && year !== prevYear ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "pb-1 text-xs text-muted",
						children: [year, "年"]
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-baseline gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "shrink-0 text-muted",
								children: [day.md, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-1",
									children: day.week
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-auto tabular-nums font-medium",
								children: [amount.value, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ml-1 text-xs font-normal text-muted",
									children: amount.unit
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `w-14 shrink-0 text-right text-xs tabular-nums ${up ? "text-up" : down ? "text-down" : "text-muted"}`,
								children: formatPct(session.amountChangePct)
							})
						]
					})]
				}, session.date);
			})
		})]
	});
}
function indexTone(value) {
	if (value === null || value === 0) return "text-muted";
	return value > 0 ? "text-up" : "text-down";
}
//#endregion
export { Home as component };
