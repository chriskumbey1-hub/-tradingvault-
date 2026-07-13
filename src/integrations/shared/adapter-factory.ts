import type { BrokerAdapter, ProviderId } from "./types";

/**
 * Adapter Registry — lazy-loaded singletons per provider.
 * Adding a new broker = create adapter file + register here.
 */

let adapters: Partial<Record<ProviderId, BrokerAdapter>> = {};

function register(provider: ProviderId, factory: () => BrokerAdapter) {
  Object.defineProperty(adapters, provider, {
    get() {
      if (!(adapters as Record<string, unknown>)[provider]) {
        (adapters as Record<string, BrokerAdapter>)[provider] = factory();
      }
      return (adapters as Record<string, BrokerAdapter>)[provider];
    },
    configurable: true,
  });
}

// Register all adapters (lazy — only instantiated on first access)
register("mt5", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MT5Adapter } = require("../mt5/adapter");
  return new MT5Adapter();
});
register("mt4", () => {
  const { MT4Adapter } = require("../mt4/adapter");
  return new MT4Adapter();
});
register("ctrader", () => {
  const { CTraderAdapter } = require("../ctrader/adapter");
  return new CTraderAdapter();
});
register("dxtrade", () => {
  const { DXTradeAdapter } = require("../dxtrade/adapter");
  return new DXTradeAdapter();
});
register("matchtrader", () => {
  const { MatchTraderAdapter } = require("../matchtrader/adapter");
  return new MatchTraderAdapter();
});
register("binance", () => {
  const { BinanceAdapter } = require("../binance/adapter");
  return new BinanceAdapter();
});
register("bybit", () => {
  const { BybitAdapter } = require("../bybit/adapter");
  return new BybitAdapter();
});
register("oanda", () => {
  const { OANDAAdapter } = require("../oanda/adapter");
  return new OANDAAdapter();
});

export function getAdapter(provider: ProviderId): BrokerAdapter | undefined {
  return adapters[provider];
}

export function getSupportedProviders(): ProviderId[] {
  return Object.keys(adapters) as ProviderId[];
}
