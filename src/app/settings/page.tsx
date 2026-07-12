"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { User, Shield, Bell, Palette, Save } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/providers/theme-provider";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [passwordSaving, setPasswordSaving] = React.useState(false);
  const [profileMessage, setProfileMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [currency, setCurrency] = React.useState("USD");
  const [timezone, setTimezone] = React.useState("UTC");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  React.useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setFullName(user.user_metadata?.full_name || "");
        setCurrency(user.user_metadata?.currency || "USD");
        setTimezone(user.user_metadata?.timezone || "UTC");
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    setProfileMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, currency, timezone },
    });
    if (error) {
      setProfileMessage({ type: "error", text: error.message });
    } else {
      setProfileMessage({ type: "success", text: "Profile updated successfully." });
    }
    setSaving(false);
  };

  const handleUpdatePassword = async () => {
    setPasswordSaving(true);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      setPasswordSaving(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      setPasswordSaving(false);
      return;
    }

    if (!currentPassword) {
      setPasswordMessage({ type: "error", text: "Current password is required." });
      setPasswordSaving(false);
      return;
    }

    const supabase = createClient();

    // Verify current password by attempting re-authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) {
      setPasswordMessage({ type: "error", text: "Unable to verify user." });
      setPasswordSaving(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordMessage({ type: "error", text: "Current password is incorrect." });
      setPasswordSaving(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMessage({ type: "error", text: error.message });
    } else {
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Settings</h1>
          <p className="text-sm text-zinc-400">
            Manage your account preferences
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="bg-zinc-800/50">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Palette className="h-4 w-4" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="text-lg text-zinc-100">
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {loading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-20 w-20 rounded-full bg-zinc-800" />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Skeleton className="h-10 rounded bg-zinc-800" />
                        <Skeleton className="h-10 rounded bg-zinc-800" />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Skeleton className="h-10 rounded bg-zinc-800" />
                        <Skeleton className="h-10 rounded bg-zinc-800" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src="" alt="Profile" />
                          <AvatarFallback className="bg-zinc-700 text-lg">
                            {initials || "TV"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Button variant="outline" size="sm">
                            Change Avatar
                          </Button>
                          <p className="mt-2 text-xs text-zinc-500">
                            JPG, PNG or GIF. Max size 2MB.
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Full Name</Label>
                          <Input
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Email</Label>
                          <Input value={email} type="email" disabled />
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Currency</Label>
                          <Select value={currency} onValueChange={setCurrency}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD - US Dollar</SelectItem>
                              <SelectItem value="EUR">EUR - Euro</SelectItem>
                              <SelectItem value="GBP">
                                GBP - British Pound
                              </SelectItem>
                              <SelectItem value="JPY">
                                JPY - Japanese Yen
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-zinc-300">Timezone</Label>
                          <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UTC">UTC</SelectItem>
                              <SelectItem value="EST">EST (UTC-5)</SelectItem>
                              <SelectItem value="CST">CST (UTC-6)</SelectItem>
                              <SelectItem value="PST">PST (UTC-8)</SelectItem>
                              <SelectItem value="GMT">GMT (UTC+0)</SelectItem>
                              <SelectItem value="CET">CET (UTC+1)</SelectItem>
                              <SelectItem value="JST">JST (UTC+9)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {profileMessage && (
                        <p
                          className={`text-sm ${
                            profileMessage.type === "success"
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {profileMessage.text}
                        </p>
                      )}

                      <div className="flex justify-end">
                        <Button className="gap-2" onClick={handleSaveProfile} disabled={saving}>
                          <Save className="h-4 w-4" />
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="text-lg text-zinc-100">
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Theme
                      </p>
                      <p className="text-sm text-zinc-400">
                        Choose your preferred color theme
                      </p>
                    </div>
                    <Select value={theme} onValueChange={(v) => setTheme(v as "dark" | "light" | "system")}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Compact View
                      </p>
                      <p className="text-sm text-zinc-400">
                        Show more data in tables
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Auto-save Trades
                      </p>
                      <p className="text-sm text-zinc-400">
                        Automatically save trades as you enter them
                      </p>
                    </div>
                    <Switch checked />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="text-lg text-zinc-100">
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Email Notifications
                      </p>
                      <p className="text-sm text-zinc-400">
                        Receive email updates about your trading
                      </p>
                    </div>
                    <Switch checked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Weekly Reports
                      </p>
                      <p className="text-sm text-zinc-400">
                        Get a weekly summary of your performance
                      </p>
                    </div>
                    <Switch checked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Loss Alerts
                      </p>
                      <p className="text-sm text-zinc-400">
                        Alert when daily loss exceeds threshold
                      </p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="text-lg text-zinc-100">
                    Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-zinc-300">New Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-zinc-300">Confirm New Password</Label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  {passwordMessage && (
                    <p
                      className={`text-sm ${
                        passwordMessage.type === "success"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {passwordMessage.text}
                    </p>
                  )}
                  <div className="flex justify-end">
                    <Button className="gap-2" onClick={handleUpdatePassword} disabled={passwordSaving}>
                      <Shield className="h-4 w-4" />
                      {passwordSaving ? "Updating..." : "Update Password"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
