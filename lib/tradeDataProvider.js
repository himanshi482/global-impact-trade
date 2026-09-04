import { query } from "./db";

export class DatabaseTradeProvider {
  constructor(databaseQuery = query) {
    this.databaseQuery = databaseQuery;
    this.source = "database";
  }

  async query(sql, params = []) {
    return this.databaseQuery(sql, params);
  }
}

export class ExternalTradeProvider {
  constructor({ baseUrl, apiKey }) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.source = "external";
  }

  async query() {
    throw new Error("External trade data provider adapter is not implemented");
  }
}

export function getTradeDataProvider() {
  const provider = process.env.TRADE_DATA_PROVIDER || "database";
  if (provider === "external" && process.env.TRADE_API_BASE_URL && process.env.TRADE_API_KEY) {
    return new ExternalTradeProvider({
      baseUrl: process.env.TRADE_API_BASE_URL,
      apiKey: process.env.TRADE_API_KEY,
    });
  }
  return new DatabaseTradeProvider();
}
