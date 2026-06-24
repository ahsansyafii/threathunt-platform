"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { AlertCircle, Shield, ArrowLeft, CheckCircle, Zap, Brain } from "lucide-react";

type AuthMode = "login" | "signup" | "forgot-password" | "reset-sent";

export default function AuthPage({ onDemoLogin }: { onDemoLogin?: () => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
      } else if (mode === "signup") {
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
        });
        if (err) throw err;
      } else if (mode === "forgot-password") {
        const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (err) throw err;
        setMode("reset-sent");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl animate-pulse" />
      </div>

      <Card className="w-full max-w-md bg-slate-900 border-slate-700 relative z-10 overflow-hidden">
        <div className="p-8 relative z-10">
          {/* Logo & Platform Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-600 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-white text-xl">ThreatHunt</span>
            </div>
            <p className="text-xs text-slate-500 text-center">Predictive Threat Hunting Platform</p>
            {/* Source Badges */}
            <div className="flex gap-2 mt-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-950/60 border border-blue-700/50 rounded-full text-xs text-blue-300">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                Suricata IDS
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-950/60 border border-orange-700/50 rounded-full text-xs text-orange-300">
                <div className="w-1.5 h-1.5 bg-orange-400 rounded-full" />
                Wazuh SIEM
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-violet-950/60 border border-violet-700/50 rounded-full text-xs text-violet-300">
                <Brain className="w-3 h-3" />
                ML Engine
              </span>
            </div>
          </div>

          {/* Back button for forgot password / reset sent */}
          {(mode === "forgot-password" || mode === "reset-sent") && (
            <button
              onClick={() => setMode("login")}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          )}

          <h2 className="text-center text-slate-300 mb-6 text-lg font-semibold">
            {mode === "login" && "Security Operations Center"}
            {mode === "signup" && "Create Your Account"}
            {mode === "forgot-password" && "Reset Your Password"}
            {mode === "reset-sent" && "Check Your Email"}
          </h2>

          {mode === "reset-sent" ? (
            <div className="space-y-4">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <p className="text-center text-slate-300">
                We've sent a password reset link to <span className="font-semibold">{email}</span>
              </p>
              <p className="text-center text-slate-400 text-sm">
                Check your email and follow the link to reset your password. If you don't see it, check your spam folder.
              </p>
              <Button
                onClick={() => {
                  setMode("login");
                  setEmail("");
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white mt-6"
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 transition-all focus:border-red-600/50"
                  disabled={loading}
                />
              </div>

              {mode !== "forgot-password" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 transition-all focus:border-red-600/50"
                    disabled={loading}
                  />
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 transition-all focus:border-red-600/50"
                    disabled={loading}
                  />
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-950 border border-red-700 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium transition-all duration-200 active:scale-95"
              >
                {loading ? "Loading..." : mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
              </Button>

              {mode === "login" && onDemoLogin && (
                <Button
                  type="button"
                  onClick={onDemoLogin}
                  variant="outline"
                  className="w-full border-violet-700 text-violet-300 hover:bg-violet-900/30 hover:text-violet-200 gap-2 transition-all duration-200"
                >
                  <Zap className="w-4 h-4" />
                  Try Demo (No Login Required)
                </Button>
              )}
            </form>
          )}

          {mode !== "reset-sent" && (
            <div className="mt-6 text-center space-y-4">
              {mode === "login" && (
                <>
                  <button
                    onClick={() => setMode("forgot-password")}
                    className="block w-full text-slate-400 hover:text-red-500 text-sm transition-colors"
                    disabled={loading}
                  >
                    Forgot your password?
                  </button>
                  <div className="text-slate-400 text-sm">
                    Don't have an account?
                    <button
                      onClick={() => {
                        setMode("signup");
                        setError("");
                      }}
                      className="ml-2 text-red-500 hover:text-red-400 font-medium transition-colors"
                      disabled={loading}
                    >
                      Sign up
                    </button>
                  </div>
                </>
              )}

              {mode === "signup" && (
                <div className="text-slate-400 text-sm">
                  Already have an account?
                  <button
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                    className="ml-2 text-red-500 hover:text-red-400 font-medium transition-colors"
                    disabled={loading}
                  >
                    Sign in
                  </button>
                </div>
              )}

              {mode === "forgot-password" && (
                <div className="text-slate-400 text-sm">
                  Remember your password?
                  <button
                    onClick={() => {
                      setMode("login");
                      setError("");
                    }}
                    className="ml-2 text-red-500 hover:text-red-400 font-medium transition-colors"
                    disabled={loading}
                  >
                    Back to login
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
