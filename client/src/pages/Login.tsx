import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { LockKeyhole, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  // If already logged in, redirect to platform
  useEffect(() => {
    if (meQuery.data) {
      const redirectTo = sessionStorage.getItem("login_redirect") || "/tenants";
      sessionStorage.removeItem("login_redirect");
      setLocation(redirectTo);
    }
  }, [meQuery.data, setLocation]);

  const copy = {
    zh: {
      title: "CP-AI Brain V1.0",
      subtitle: "农牧全产业链量化与智能决策平台",
      label: "访问密码",
      placeholder: "请输入访问密码",
      submit: "进入平台",
      error: "密码错误，请重试",
      hint: "默认密码：cpbrain2024",
    },
    en: {
      title: "CP-AI Brain V1.0",
      subtitle: "Agri-Food Supply Chain AI Decision Platform",
      label: "Access Password",
      placeholder: "Enter access password",
      submit: "Enter Platform",
      error: "Incorrect password, please try again",
      hint: "Default password: cpbrain2024",
    },
  };

  const t = copy[language as keyof typeof copy] || copy.zh;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/local-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // If proxy strips Set-Cookie, store token in localStorage as fallback
        if (data.token) {
          localStorage.setItem("app_session_token", data.token);
        }
        // Refresh auth state and redirect
        await meQuery.refetch();
        const redirectTo = sessionStorage.getItem("login_redirect") || "/tenants";
        sessionStorage.removeItem("login_redirect");
        setLocation(redirectTo);
      } else {
        const data = await response.json();
        setError(data.error || t.error);
      }
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060e1c] flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(56,180,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(56,180,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow effects */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-cyan-500/[0.06] blur-3xl" />
        <div className="absolute top-1/2 -left-40 h-80 w-80 rounded-full bg-blue-500/[0.04] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300 shadow-[0_0_24px_rgba(56,180,255,0.12)]">
              <LockKeyhole className="h-6 w-6" />
            </div>
          </div>
          <div className="text-[11px] font-semibold tracking-[0.2em] text-cyan-400/70 uppercase mb-2">
            CP-AI BRAIN V1.0
          </div>
          <h1 className="text-xl font-bold text-white/90">
            {t.subtitle}
          </h1>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm shadow-[0_0_40px_rgba(0,0,0,0.4)]">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-slate-400 tracking-wide uppercase">
                {t.label}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t.placeholder}
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-slate-600 pr-10 focus:border-cyan-400/40 focus:ring-cyan-400/20"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-red-400/20 bg-red-400/[0.06] px-3 py-2 text-[12px] text-red-400"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 text-cyan-300 hover:text-cyan-200 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                t.submit
              )}
            </Button>
          </form>

          {/* Hint */}
          <div className="mt-4 rounded-lg border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-[11px] text-slate-500">
            {t.hint}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-600">
          Elegant Tech SaaS · 农牧产业集团智能运营系统
        </div>
      </motion.div>
    </div>
  );
}
