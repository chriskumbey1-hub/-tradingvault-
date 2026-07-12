"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

interface Trade {
  id: string;
  profit_loss: number;
  trade_date: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [calendarData, setCalendarData] = React.useState<
    Record<string, { pnl: number; trades: number }>
  >({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTrades = async () => {
      setLoading(true);
      const supabase = createClient();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const nextMonthDate = new Date(year, month + 1, 1);
      const endDate = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, "0")}-01`;

      const { data } = await supabase
        .from("trades")
        .select("id, profit_loss, trade_date")
        .gte("trade_date", startDate)
        .lt("trade_date", endDate);

      const grouped: Record<string, { pnl: number; trades: number }> = {};
      (data || []).forEach((t: Trade) => {
        if (!grouped[t.trade_date]) {
          grouped[t.trade_date] = { pnl: 0, trades: 0 };
        }
        grouped[t.trade_date].pnl += t.profit_loss || 0;
        grouped[t.trade_date].trades++;
      });

      Object.keys(grouped).forEach((key) => {
        grouped[key].pnl = Math.round(grouped[key].pnl);
      });

      setCalendarData(grouped);
      setLoading(false);
    };
    fetchTrades();
  }, [currentDate]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
    setSelectedDate(null);
  };

  const selectedDayData = selectedDate ? calendarData[selectedDate] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Trading Calendar</h1>
          <p className="text-sm text-zinc-400">
            Visualize your trading performance over time
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-lg text-zinc-100">
                  {monthNames[currentDate.getMonth()]}{" "}
                  {currentDate.getFullYear()}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-7 gap-1">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-sm font-medium text-zinc-400"
                    >
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: firstDayOfMonth + daysInMonth }).map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-lg bg-zinc-800" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1">
                  {dayNames.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-sm font-medium text-zinc-400"
                    >
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-20" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = formatDate(
                      currentDate.getFullYear(),
                      currentDate.getMonth(),
                      day
                    );
                    const dayData = calendarData[dateStr];
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex h-20 flex-col items-center justify-start rounded-lg p-2 transition-colors ${
                          isSelected
                            ? "bg-zinc-700 ring-1 ring-blue-500"
                            : "hover:bg-zinc-800"
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            isSelected ? "text-zinc-100" : "text-zinc-400"
                          }`}
                        >
                          {day}
                        </span>
                        {dayData && (
                          <div className="mt-1 w-full">
                            <div
                              className={`h-1 w-full rounded-full ${
                                dayData.pnl > 0
                                  ? "bg-emerald-500"
                                  : dayData.pnl < 0
                                  ? "bg-red-500"
                                  : "bg-zinc-600"
                              }`}
                            />
                            <p
                              className={`mt-1 text-xs ${
                                dayData.pnl > 0
                                  ? "text-emerald-500"
                                  : dayData.pnl < 0
                                  ? "text-red-500"
                                  : "text-zinc-500"
                              }`}
                            >
                              {dayData.pnl > 0 ? "+" : ""}
                              {dayData.pnl === 0 ? "-" : `$${dayData.pnl.toLocaleString()}`}
                            </p>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-6 border-t border-zinc-800 pt-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-zinc-400">Profitable</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm text-zinc-400">Loss</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-zinc-600" />
                  <span className="text-sm text-zinc-400">Breakeven</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {selectedDayData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader>
                <CardTitle className="text-lg text-zinc-100">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                    "en-US",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
                    <p className="text-sm text-zinc-400">Total Trades</p>
                    <p className="text-2xl font-bold text-zinc-100">
                      {selectedDayData.trades}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
                    <p className="text-sm text-zinc-400">Net P&L</p>
                    <p
                      className={`text-2xl font-bold ${
                        selectedDayData.pnl >= 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {selectedDayData.pnl >= 0 ? "+" : ""}$
                      {selectedDayData.pnl.toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-800/50 p-4">
                    <p className="text-sm text-zinc-400">Status</p>
                    <p
                      className={`text-2xl font-bold ${
                        selectedDayData.pnl > 0
                          ? "text-emerald-500"
                          : selectedDayData.pnl < 0
                          ? "text-red-500"
                          : "text-zinc-400"
                      }`}
                    >
                      {selectedDayData.pnl > 0
                        ? "Profitable"
                        : selectedDayData.pnl < 0
                        ? "Loss"
                        : "Breakeven"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
