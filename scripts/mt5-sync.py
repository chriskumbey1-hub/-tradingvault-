#!/usr/bin/env python3
"""
TradeVault MT5 Sync Script
===========================
Fetches account data and trade history from MetaTrader 5 and pushes to TradeVault.

Requirements:
  pip install MetaTrader5 requests

Usage:
  python mt5-sync.py --login 12345678 --password "YourPassword" --server "ICMarkets-Live" --url https://tradevult.vercel.app --token YOUR_SERVICE_TOKEN

  Or set environment variables:
    MT5_LOGIN=12345678
    MT5_PASSWORD=YourPassword
    MT5_SERVER=ICMarkets-Live
    TRADEVAULT_URL=https://tradevult.vercel.app
    TRADEVAULT_API_TOKEN=your_api_token

Run as scheduled task (Windows):
  schtasks /create /tn "TradeVault MT5 Sync" /tr "python mt5-sync.py" /sc minute /mo 5

Run manually:
  python mt5-sync.py --login 12345678 --password "Pass" --server "Server"
"""

import argparse
import json
import os
import sys
from datetime import datetime, timedelta

try:
    import MetaTrader5 as mt5
except ImportError:
    print("ERROR: MetaTrader5 package not installed.")
    print("Run: pip install MetaTrader5")
    print("Note: Only works on Windows with MT5 terminal installed.")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: requests package not installed.")
    print("Run: pip install requests")
    sys.exit(1)


def connect_mt5(login: int, password: str, server: str) -> dict:
    """Initialize MT5 connection and fetch account info."""
    if not mt5.initialize():
        error = mt5.last_error()
        raise ConnectionError(f"MT5 initialization failed: {error}")

    authorized = mt5.login(login, password=password, server=server)
    if not authorized:
        error = mt5.last_error()
        mt5.shutdown()
        raise ConnectionError(f"MT5 login failed for {login}@{server}: {error}")

    info = mt5.account_info()
    if info is None:
        mt5.shutdown()
        raise ConnectionError("Failed to get account info")

    return {
        "balance": info.balance,
        "equity": info.equity,
        "margin": info.margin,
        "freeMargin": info.margin_free,
        "leverage": info.leverage,
        "currency": info.currency,
        "server": info.server,
        "platform": "mt5",
        "accountNumber": str(info.login),
        "openPositions": info.positions,
        "floatingPnl": info.profit,
    }


def fetch_closed_trades(days: int = 30) -> list:
    """Fetch closed trades from MT5 history."""
    now = datetime.now()
    from_date = now - timedelta(days=days)

    deals = mt5.history_deals_get(from_date, now)
    if deals is None:
        return []

    trades = []
    for deal in deals:
        if deal.entry == mt5.DEAL_ENTRY_OUT or deal.entry == mt5.DEAL_ENTRY_OUT_BY:
            trades.append({
                "brokerTradeId": str(deal.order),
                "brokerOrderId": str(deal.order),
                "symbol": deal.symbol,
                "marketType": detect_market_type(deal.symbol),
                "direction": "long" if deal.type == mt5.DEAL_TYPE_BUY else "short",
                "entryPrice": deal.price,
                "exitPrice": deal.price,
                "entryTime": datetime.fromtimestamp(deal.time).isoformat(),
                "exitTime": datetime.fromtimestamp(deal.time).isoformat(),
                "lotSize": deal.volume,
                "profitLoss": deal.profit,
                "commission": deal.commission,
                "swap": deal.swap,
                "fees": abs(deal.commission) + abs(deal.swap),
                "status": "closed",
                "comment": deal.comment or "",
            })

    return trades


def fetch_positions() -> list:
    """Fetch open positions from MT5."""
    positions = mt5.positions_get()
    if positions is None:
        return []

    result = []
    for pos in positions:
        result.append({
            "brokerTradeId": f"pos-{pos.ticket}",
            "symbol": pos.symbol,
            "direction": "long" if pos.type == mt5.ORDER_TYPE_BUY else "short",
            "entryPrice": pos.price_open,
            "currentPrice": pos.price_current,
            "lotSize": pos.volume,
            "profitLoss": pos.profit,
            "swap": pos.swap,
            "commission": 0,
            "entryTime": datetime.fromtimestamp(pos.time).isoformat(),
        })

    return result


def detect_market_type(symbol: str) -> str:
    """Detect market type from symbol name."""
    symbol_upper = symbol.upper()
    if any(x in symbol_upper for x in ["XAU", "XAG", "GOLD", "SILVER", "OIL", "CRUDE"]):
        return "commodities"
    if any(x in symbol_upper for x in ["BTC", "ETH", "CRYPTO", "COIN"]):
        return "crypto"
    if any(x in symbol_upper for x in ["US30", "NAS100", "SPX500", "SP500", "DAX", "FTSE", "NIKKEI", "JP225"]):
        return "indices"
    return "forex"


def push_to_tradevault(base_url: str, api_token: str, connection_id: str, account_info: dict, trades: list, positions: list):
    """Push data to TradeVault API."""
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }

    # Push account info
    payload = {
        "connectionId": connection_id,
        "accountInfo": account_info,
        "trades": trades,
        "positions": positions,
        "syncedAt": datetime.now().isoformat(),
    }

    url = f"{base_url}/api/broker-sync/push"
    resp = requests.post(url, json=payload, headers=headers, timeout=30)

    if resp.status_code == 200:
        result = resp.json()
        print(f"Sync complete: {result.get('tradesImported', 0)} trades imported, "
              f"{result.get('tradesSkipped', 0)} skipped")
    else:
        print(f"Error pushing to TradeVault: {resp.status_code} - {resp.text}")


def main():
    parser = argparse.ArgumentParser(description="TradeVault MT5 Sync Script")
    parser.add_argument("--login", type=int, default=int(os.environ.get("MT5_LOGIN", 0)))
    parser.add_argument("--password", default=os.environ.get("MT5_PASSWORD", ""))
    parser.add_argument("--server", default=os.environ.get("MT5_SERVER", ""))
    parser.add_argument("--url", default=os.environ.get("TRADEVAULT_URL", "https://tradevult.vercel.app"))
    parser.add_argument("--token", default=os.environ.get("TRADEVAULT_API_TOKEN", ""))
    parser.add_argument("--connection-id", default=os.environ.get("TRADEVAULT_CONNECTION_ID", ""))
    parser.add_argument("--days", type=int, default=30, help="Days of history to fetch")
    args = parser.parse_args()

    if not args.login or not args.password or not args.server:
        print("ERROR: MT5 credentials required.")
        print("Usage: python mt5-sync.py --login 12345678 --password 'Pass' --server 'Server'")
        print("Or set MT5_LOGIN, MT5_PASSWORD, MT5_SERVER environment variables.")
        sys.exit(1)

    if not args.token or not args.connection_id:
        print("ERROR: TradeVault API token and connection ID required.")
        print("Set TRADEVAULT_API_TOKEN and TRADEVAULT_CONNECTION_ID environment variables.")
        sys.exit(1)

    print(f"Connecting to MT5: {args.login}@{args.server}...")

    try:
        account_info = connect_mt5(args.login, args.password, args.server)
        print(f"Connected! Balance: {account_info['balance']} {account_info['currency']}")

        print(f"Fetching last {args.days} days of trade history...")
        trades = fetch_closed_trades(args.days)
        print(f"Found {len(trades)} closed trades")

        positions = fetch_positions()
        print(f"Found {len(positions)} open positions")

        print(f"Pushing to TradeVault ({args.url})...")
        push_to_tradevault(args.url, args.token, args.connection_id, account_info, trades, positions)

    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
    finally:
        mt5.shutdown()
        print("MT5 connection closed.")


if __name__ == "__main__":
    main()
