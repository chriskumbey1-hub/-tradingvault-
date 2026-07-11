interface Trade {
  symbol: string
  direction: string
  pnl: number
  status: string
}

interface DailySummaryEmailProps {
  date: string
  totalTrades: number
  wins: number
  losses: number
  netPnl: number
  winRate: number
  trades: Trade[]
}

export function DailySummaryEmail({
  date,
  totalTrades,
  wins,
  losses,
  netPnl,
  winRate,
  trades,
}: DailySummaryEmailProps) {
  return (
    <div
      style={{
        fontFamily: "'Inter', Arial, sans-serif",
        backgroundColor: "#18181b",
        padding: "32px",
        color: "#fafafa",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          backgroundColor: "#27272a",
          borderRadius: "12px",
          padding: "32px",
          border: "1px solid #3f3f46",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#fafafa",
            margin: "0 0 8px 0",
          }}
        >
          Daily Trading Summary
        </h1>
        <p style={{ fontSize: "14px", color: "#a1a1aa", margin: "0 0 24px 0" }}>
          {date}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          {[
            { label: "Total Trades", value: totalTrades.toString() },
            { label: "Wins", value: wins.toString() },
            { label: "Losses", value: losses.toString() },
            {
              label: "Net P&L",
              value: `$${netPnl >= 0 ? "+" : ""}${netPnl.toFixed(2)}`,
            },
            { label: "Win Rate", value: `${winRate.toFixed(1)}%` },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                backgroundColor: "#18181b",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  color: "#71717a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: "4px",
                }}
              >
                {stat.label}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color:
                    stat.label === "Net P&L"
                      ? netPnl >= 0
                        ? "#34d399"
                        : "#f87171"
                      : "#fafafa",
                }}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <h2
          style={{
            fontSize: "16px",
            fontWeight: 600,
            color: "#fafafa",
            margin: "0 0 12px 0",
          }}
        >
          Trade Breakdown
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr>
              {["Symbol", "Direction", "P&L", "Status"].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "8px 12px",
                    color: "#71717a",
                    fontWeight: 500,
                    borderBottom: "1px solid #3f3f46",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, i) => (
              <tr key={i}>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #27272a",
                    color: "#fafafa",
                    fontWeight: 500,
                  }}
                >
                  {trade.symbol}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #27272a",
                  }}
                >
                  <span
                    style={{
                      backgroundColor:
                        trade.direction.toLowerCase() === "long"
                          ? "#052e16"
                          : "#450a0a",
                      color:
                        trade.direction.toLowerCase() === "long"
                          ? "#34d399"
                          : "#f87171",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    {trade.direction}
                  </span>
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #27272a",
                    color: trade.pnl >= 0 ? "#34d399" : "#f87171",
                    fontWeight: 600,
                  }}
                >
                  ${trade.pnl >= 0 ? "+" : ""}
                  {trade.pnl.toFixed(2)}
                </td>
                <td
                  style={{
                    padding: "10px 12px",
                    borderBottom: "1px solid #27272a",
                    color: "#a1a1aa",
                  }}
                >
                  {trade.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {trades.length === 0 && (
          <p
            style={{
              textAlign: "center",
              color: "#71717a",
              padding: "24px",
              fontSize: "14px",
            }}
          >
            No trades recorded today
          </p>
        )}
      </div>

      <p
        style={{
          textAlign: "center",
          fontSize: "12px",
          color: "#52525b",
          marginTop: "16px",
        }}
      >
        TradeVault Daily Summary
      </p>
    </div>
  )
}
