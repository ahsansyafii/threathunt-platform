"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { User } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  AlertTriangle,
  Network,
  Shield,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User as UserIcon,
  Brain,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Dashboard from "@/components/pages/dashboard";
import ThreatsPage from "@/components/pages/threats";
import NetworkPage from "@/components/pages/network";
import DetectionPage from "@/components/pages/detection";
import ReportsPage from "@/components/pages/reports";
import SettingsPage from "@/components/pages/settings";
import MLPredictionPage from "@/components/pages/ml-prediction";

type Page = "dashboard" | "threats" | "network" | "detection" | "ml-prediction" | "reports" | "settings";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "threats", label: "Threats", icon: AlertTriangle },
  { id: "network", label: "Network", icon: Network },
  { id: "detection", label: "Detection", icon: Shield },
  { id: "ml-prediction", label: "ML Prediction", icon: Brain },
  { id: "reports", label: "Reports", icon: FileText },
] as const;

// All pages including settings for topbar title lookup
const allPages = [
  ...navItems,
  { id: "settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ user }: { user: User }) {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [notifications] = useState([
    { id: 1, text: "Critical DDoS alert detected by Suricata", time: "2 min ago" },
    { id: 2, text: "Wazuh: Brute Force SSH attempt blocked", time: "8 min ago" },
    { id: 3, text: "ML Engine: High-confidence malware prediction", time: "15 min ago" },
  ]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "threats":
        return <ThreatsPage />;
      case "network":
        return <NetworkPage />;
      case "detection":
        return <DetectionPage />;
      case "ml-prediction":
        return <MLPredictionPage />;
      case "reports":
        return <ReportsPage />;
      case "settings":
        return <SettingsPage user={user} />;
      default:
        return <Dashboard />;
    }
  };

  const currentPageInfo = allPages.find((item) => item.id === currentPage);

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-slate-900 border-r border-slate-700 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-slate-700">
          <div className={`flex items-center gap-3 ${!sidebarOpen && "hidden"}`}>
            <div className="p-1.5 bg-red-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-sm leading-none block">ThreatHunt</span>
              <span className="text-xs text-slate-500 leading-none">Wazuh · Suricata · ML</span>
            </div>
          </div>
          {!sidebarOpen && (
            <div className="w-full flex justify-center">
              <div className="p-1.5 bg-red-600 rounded-lg">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white ${!sidebarOpen && "hidden"}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Collapse toggle when closed */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mx-auto mt-2 p-1 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Source badges */}
        {sidebarOpen && (
          <div className="px-4 py-3 space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-xs text-blue-400 font-medium">Suricata IDS Active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
              <span className="text-xs text-orange-400 font-medium">Wazuh SIEM Active</span>
            </div>
          </div>
        )}

        <nav className="flex-1 px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id as Page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? item.id === "ml-prediction"
                      ? "bg-violet-700 text-white shadow-lg shadow-violet-600/20"
                      : "bg-red-600 text-white shadow-lg shadow-red-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`${!sidebarOpen && "hidden"} text-sm`}>{item.label}</span>
                {item.id === "ml-prediction" && sidebarOpen && (
                  <span className="ml-auto text-xs bg-violet-500/30 text-violet-300 px-1.5 py-0.5 rounded-full">AI</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700 space-y-1">
          <button
            onClick={() => setCurrentPage("settings")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
              currentPage === "settings"
                ? "bg-red-600 text-white shadow-lg shadow-red-600/20"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
            title={!sidebarOpen ? "Settings" : undefined}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <span className={`${!sidebarOpen && "hidden"} text-sm`}>Settings</span>
          </button>

          <button
            onClick={() => setShowLogoutDialog(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-red-500 rounded-lg transition-all duration-200"
            title={!sidebarOpen ? "Logout" : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={`${!sidebarOpen && "hidden"} text-sm`}>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-slate-900 border-b border-slate-700 px-6 py-3 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              {currentPageInfo?.icon && (
                <currentPageInfo.icon className="w-5 h-5 text-slate-400" />
              )}
              {currentPageInfo?.label || "Dashboard"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Predictive Threat Hunting Platform — Wazuh &amp; Suricata
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* System Status */}
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/50 rounded-full border border-blue-700/50">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-xs text-blue-300 font-medium">Suricata</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-950/50 rounded-full border border-orange-700/50">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                <span className="text-xs text-orange-300 font-medium">Wazuh</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-950/50 rounded-full border border-violet-700/50">
                <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
                <span className="text-xs text-violet-300 font-medium">ML Engine</span>
              </div>
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 hover:bg-slate-800 rounded-lg transition-all duration-200">
                  <Bell className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-700">
                <div className="px-4 py-2 border-b border-slate-700">
                  <p className="font-semibold text-white text-sm">Notifications</p>
                </div>
                {notifications.map((notif) => (
                  <DropdownMenuItem key={notif.id} className="flex flex-col gap-1 cursor-pointer hover:bg-slate-800 py-3">
                    <p className="text-sm text-white">{notif.text}</p>
                    <p className="text-xs text-slate-500">{notif.time}</p>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 hover:bg-slate-800 rounded-lg transition-all duration-200">
                  <UserIcon className="w-5 h-5 text-slate-400 hover:text-white transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
                <DropdownMenuItem className="cursor-pointer hover:bg-slate-800 gap-2 flex-col items-start">
                  <span className="text-xs text-slate-400">Logged in as</span>
                  <span className="text-sm font-medium text-white">{user.email}</span>
                  <span className="text-xs text-violet-400 capitalize">{user.role}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-slate-800 text-slate-300"
                  onClick={() => setCurrentPage("settings")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer hover:bg-red-900/30 text-red-400"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{renderPage()}</div>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogTitle className="text-white">Sign Out?</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            Are you sure you want to sign out? You'll need to log in again to access the platform.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-slate-700 text-slate-400 hover:bg-slate-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sign Out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
