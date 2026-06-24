"use client";

import { useEffect, useState } from "react";
import { supabase, User } from "@/lib/supabase-client";
import AuthPage from "@/components/auth-page";
import DashboardLayout from "@/components/dashboard-layout";

const DEMO_USER: User = {
  id: "demo-user",
  email: "demo@threathunt.io",
  username: "demo_analyst",
  role: "analyst",
  full_name: "Demo Analyst",
  avatar_url: null,
  created_at: new Date().toISOString(),
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data } = await supabase.from("users").select("*").eq("id", session.user.id).maybeSingle();
          setUser(data || { id: session.user.id, email: session.user.email, role: "viewer" });
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
          username: "",
          role: "viewer",
          full_name: null,
          avatar_url: null,
          created_at: new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleDemoLogin = () => {
    setUser(DEMO_USER);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-2">ThreatHunt</div>
          <div className="text-slate-400 text-sm">Predictive Threat Hunting Platform</div>
          <div className="text-slate-500 text-xs mt-1">Wazuh · Suricata · ML Engine</div>
        </div>
      </div>
    );
  }

  return user ? (
    <DashboardLayout user={user} />
  ) : (
    <AuthPage onDemoLogin={handleDemoLogin} />
  );
}
