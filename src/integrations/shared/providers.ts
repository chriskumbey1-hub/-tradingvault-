import type { ProviderMeta } from "./types";

export const PROVIDERS: ProviderMeta[] = [
  // ---- Forex / CFD ----
  {
    id: "mt5",
    name: "MetaTrader 5",
    category: "forex",
    hasRealApi: false,
    description:
      "MT5 does not expose a public REST API. Requires a local MT5 Gateway server or a VPS bridge to relay trades via the MetaTrader 5 Python package.",
    icon: "mt5",
    fields: [
      { key: "loginId", label: "Login ID", type: "text", placeholder: "12345678", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "Your MT5 password", required: true },
      {
        key: "server",
        label: "Server",
        type: "select",
        required: true,
        helpText: "Select your broker's server",
        options: [
          { label: "IC Markets (Live)", value: "ICMarkets-Live" },
          { label: "IC Markets (Demo)", value: "ICMarkets-Demo" },
          { label: "Pepperstone (Live)", value: "Pepperstone-Live" },
          { label: "Pepperstone (Demo)", value: "Pepperstone-Demo" },
          { label: "FTMO (Live)", value: "FTMO-Live" },
          { label: "FTMO (Demo)", value: "FTMO-Demo" },
          { label: "Other", value: "other" },
        ],
      },
    ],
  },
  {
    id: "mt4",
    name: "MetaTrader 4",
    category: "forex",
    hasRealApi: false,
    description:
      "MT4 has no official public API. Requires a MT4 Manager API license or a bridge solution to access trade data programmatically.",
    icon: "mt4",
    fields: [
      { key: "loginId", label: "Login ID", type: "text", placeholder: "12345678", required: true },
      { key: "password", label: "Password", type: "password", placeholder: "Your MT4 password", required: true },
      {
        key: "server",
        label: "Server",
        type: "select",
        required: true,
        helpText: "Select your broker's server",
        options: [
          { label: "MetaQuotes-Demo", value: "MetaQuotes-Demo" },
          { label: "Other", value: "other" },
        ],
      },
    ],
  },
  {
    id: "ctrader",
    name: "cTrader",
    category: "forex",
    hasRealApi: false,
    description:
      "cTrader Open API exists but requires broker registration and OAuth app approval. Placeholder — needs client credentials from your broker.",
    icon: "ctrader",
    fields: [
      { key: "clientId", label: "Client ID", type: "text", placeholder: "Your cTrader Open API client ID", required: true },
      { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "Your cTrader Open API secret", required: true },
    ],
  },
  {
    id: "dxtrade",
    name: "DXtrade",
    category: "forex",
    hasRealApi: false,
    description:
      "DXtrade does not expose a public API for retail users. Integration requires broker-side API access or CSV import.",
    icon: "dxtrade",
    fields: [
      { key: "email", label: "Email", type: "text", placeholder: "your@email.com", required: true },
      { key: "password", label: "Password", type: "password", required: true },
      { key: "brokerUrl", label: "Broker URL", type: "url", placeholder: "https://your-broker.dx.trade", required: true },
    ],
  },
  {
    id: "matchtrader",
    name: "Match-Trader",
    category: "forex",
    hasRealApi: false,
    description:
      "Match-Trader provides a WebSocket API that requires broker provisioning. Integration needs broker cooperation or CSV import.",
    icon: "matchtrader",
    fields: [
      { key: "email", label: "Email", type: "text", placeholder: "your@email.com", required: true },
      { key: "password", label: "Password", type: "password", required: true },
      { key: "brokerUrl", label: "Broker URL", type: "url", placeholder: "https://your-broker.match-trader.com", required: true },
    ],
  },

  // ---- Crypto ----
  {
    id: "binance",
    name: "Binance",
    category: "crypto",
    hasRealApi: true,
    description:
      "Live integration via Binance REST API (Futures + Spot). Requires API key with Futures/Spot read permissions. IP whitelist recommended.",
    icon: "binance",
    fields: [
      { key: "apiKey", label: "API Key", type: "text", placeholder: "Your Binance API key", required: true },
      { key: "apiSecret", label: "API Secret", type: "password", placeholder: "Your Binance API secret", required: true },
    ],
  },
  {
    id: "bybit",
    name: "Bybit",
    category: "crypto",
    hasRealApi: true,
    description:
      "Live integration via Bybit V5 REST API (Linear, Inverse, Spot). Requires API key with trade read permissions.",
    icon: "bybit",
    fields: [
      { key: "apiKey", label: "API Key", type: "text", placeholder: "Your Bybit API key", required: true },
      { key: "apiSecret", label: "API Secret", type: "password", placeholder: "Your Bybit API secret", required: true },
    ],
  },

  // ---- Multi-platform ----
  {
    id: "oanda",
    name: "OANDA",
    category: "multi",
    hasRealApi: true,
    description:
      "Live integration via OANDA v20 REST API. Supports both live and practice (demo) accounts. Requires a Personal Access Token.",
    icon: "oanda",
    fields: [
      { key: "accessToken", label: "Personal Access Token", type: "password", placeholder: "Your OANDA PAT", required: true },
      { key: "accountId", label: "Account ID", type: "text", placeholder: "101-001-12345678-001", required: true },
      {
        key: "environment",
        label: "Environment",
        type: "select",
        required: true,
        options: [
          { label: "Live", value: "live" },
          { label: "Practice (Demo)", value: "demo" },
        ],
      },
    ],
  },
];

export function getProvider(id: string): ProviderMeta | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function getProvidersByCategory(category: ProviderMeta["category"]): ProviderMeta[] {
  return PROVIDERS.filter((p) => p.category === category);
}
