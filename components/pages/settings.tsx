"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { User } from "@/lib/supabase-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function SettingsPage({ user }: { user: User }) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState("+62-812-3456-7890");
  const [department, setDepartment] = useState("Security Operations");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFaEnabled, setTwoFaEnabled] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [notifications, setNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        throw new Error("Please fill in all password fields");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match");
      }

      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      setMessage({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">Manage account, security, and system settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-900 border-b border-slate-700 p-0 h-auto rounded-none">
          <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500">
            System
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="bg-slate-900 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Profile Information</h2>
            <p className="text-slate-400 mb-6">Update your account details</p>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Full Name
                  </label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Admin User"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-slate-800 border-slate-700 text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Department
                  </label>
                  <Input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Security Operations"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+62-812-3456-7890"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {message && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    message.type === "success"
                      ? "bg-green-950 border-green-700 text-green-200"
                      : "bg-red-950 border-red-700 text-red-200"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Change Password */}
          <Card className="bg-slate-900 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              {message && (
                <div
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    message.type === "success"
                      ? "bg-green-950 border-green-700 text-green-200"
                      : "bg-red-950 border-red-700 text-red-200"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? "Updating..." : "Change Password"}
              </Button>
            </form>
          </Card>

          {/* Two-Factor Authentication */}
          <Card className="bg-slate-900 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Two-Factor Authentication</h2>
            <p className="text-slate-400 mb-6">Add an extra layer of security to your account</p>

            <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div>
                <p className="font-medium text-white">Two-Factor Authentication</p>
                <p className="text-sm text-slate-400 mt-1">
                  {twoFaEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
              <Switch
                checked={twoFaEnabled}
                onCheckedChange={setTwoFaEnabled}
              />
            </div>
          </Card>

          {/* Session Management */}
          <Card className="bg-slate-900 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Session Management</h2>
            <p className="text-slate-400 mb-6">Manage your session timeout settings</p>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Session Timeout (minutes)
              </label>
              <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                  <SelectItem value="120">120 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-slate-900 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">Notification Settings</h2>
            <p className="text-slate-400 mb-6">Configure how you receive alerts and notifications</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                <div>
                  <p className="font-medium text-white">Push Notifications</p>
                  <p className="text-sm text-slate-400">
                    Receive real-time alerts for threats
                  </p>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={setNotifications}
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                <div>
                  <p className="font-medium text-white">Email Alerts</p>
                  <p className="text-sm text-slate-400">
                    Receive email notifications
                  </p>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
                <div>
                  <p className="font-medium text-white">Critical Alerts Only</p>
                  <p className="text-sm text-slate-400">
                    Only notify for critical severity events
                  </p>
                </div>
                <Switch
                  checked={criticalOnly}
                  onCheckedChange={setCriticalOnly}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card className="bg-slate-900 border-slate-700 p-6">
            <h2 className="text-xl font-bold text-white mb-6">System Information</h2>

            <div className="space-y-4">
              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Platform Version</span>
                  <span className="text-white font-mono font-semibold">v1.0.0</span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Last Security Update</span>
                  <span className="text-white font-mono">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Database Status</span>
                  <span className="inline-flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-semibold">Connected</span>
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">API Status</span>
                  <span className="inline-flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-400 font-semibold">Operational</span>
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
