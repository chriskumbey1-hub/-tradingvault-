"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Save, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function NotificationSettingsPage() {
  const { user } = useUser();
  const [dailySummary, setDailySummary] = React.useState(false);
  const [weeklyReport, setWeeklyReport] = React.useState(true);
  const [sendTime, setSendTime] = React.useState("morning");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (user?.user_metadata?.notifications) {
      const n = user.user_metadata.notifications;
      setDailySummary(n.daily_summary ?? false);
      setWeeklyReport(n.weekly_report ?? true);
      setSendTime(n.send_time ?? "morning");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({
      data: {
        notifications: { daily_summary: dailySummary, weekly_report: weeklyReport, send_time: sendTime },
      },
    });
    setSaving(false);
    window.alert("Notification settings saved!");
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Notification Settings</h1>
          <p className="text-sm text-zinc-400">Configure how and when you receive updates</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="text-lg text-zinc-100">Email Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Daily Summary</p>
                  <p className="text-sm text-zinc-400">Receive a daily summary of your trading performance</p>
                </div>
                <Switch checked={dailySummary} onCheckedChange={setDailySummary} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Weekly Report</p>
                  <p className="text-sm text-zinc-400">Get a weekly overview of your performance and statistics</p>
                </div>
                <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-100">Preferred Send Time</p>
                  <p className="text-sm text-zinc-400">Choose when to receive your notifications</p>
                </div>
                <Select value={sendTime} onValueChange={setSendTime}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8:00 AM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12:00 PM)</SelectItem>
                    <SelectItem value="evening">Evening (6:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
