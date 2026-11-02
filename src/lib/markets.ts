import { createServerFn } from "@tanstack/react-start";

export type Currency = "CNY" | "HKD" | "USD";

export type Session = {
  date: string;
  amount: number;
  close: number | null;
  amountChangePct: number | null;
  indexChangePct: number | null;
};

export type MarketBoard = {
  id: "cn" | "hk" | "us";
  name: string;
  blurb: string;
  definition: string;
  currency: Currency;
  indexName: string | null;
  sessions: Session[];
  error: string | null;
};

export type Board = {
  markets: MarketBoard[];
  fetchedAt: string;
};

export const getBoard = createServerFn({ method: "GET" })
  .validator((input: unknown) => {
    const fresh =
      typeof input === "object" &&
      input !== null &&
      "fresh" in input &&
      (input as { fresh?: unknown }).fresh === true;
    return { fresh };
  })
  .handler(async ({ data }) => {
    const { loadBoard } = await import("./markets.server.ts");
    return loadBoard(data.fresh);
  });
