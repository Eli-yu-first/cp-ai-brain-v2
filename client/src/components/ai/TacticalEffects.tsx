import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function TacticalBackdrop({
  intensity = "normal",
}: {
  intensity?: "subtle" | "normal" | "strong";
}) {
  const opacity =
    intensity === "strong" ? "opacity-100" : intensity === "subtle" ? "opacity-55" : "opacity-75";
  return (
    <div className={cn("pointer-events-none fixed inset-0 z-[1] overflow-hidden", opacity)}>
      <style>{`
        @keyframes tactical-scan {
          0% { transform: translateY(-30%); opacity: .08; }
          42% { opacity: .32; }
          100% { transform: translateY(130%); opacity: .08; }
        }
        @keyframes tactical-drift {
          0% { transform: translate3d(-6%, -4%, 0) rotate(0deg); }
          50% { transform: translate3d(5%, 4%, 0) rotate(8deg); }
          100% { transform: translate3d(-6%, -4%, 0) rotate(0deg); }
        }
        @keyframes tactical-pulse {
          0%, 100% { opacity: .28; filter: blur(0px); }
          50% { opacity: .68; filter: blur(.3px); }
        }
      `}</style>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.035)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div
        className="absolute left-0 right-0 h-28 bg-gradient-to-b from-transparent via-cyan-300/12 to-transparent"
        style={{ animation: "tactical-scan 5.4s linear infinite" }}
      />
      <div
        className="absolute -left-24 top-20 h-[420px] w-[420px] rounded-full border border-cyan-300/10 bg-cyan-400/[0.035]"
        style={{ animation: "tactical-drift 13s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-10 right-14 h-48 w-48 rounded-full border border-blue-300/15"
        style={{ animation: "tactical-pulse 3.2s ease-in-out infinite" }}
      />
    </div>
  );
}

export function LiveSignal({
  label = "实时计算",
  active = true,
}: {
  label?: string;
  active?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-1 text-[11px]",
        active
          ? "border-emerald-400/25 bg-emerald-400/[0.09] text-emerald-200"
          : "border-slate-500/25 bg-slate-500/[0.08] text-slate-400"
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-emerald-300" : "bg-slate-500")}
        style={active ? { animation: "tactical-pulse 1.8s ease-in-out infinite" } : undefined}
      />
      {label}
    </span>
  );
}

export function useOperationLog(initial: string[] = []) {
  const [logs, setLogs] = useState(initial);

  const pushLog = (message: string) => {
    const stamp = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).format(new Date());
    setLogs(prev => [`${stamp} ${message}`, ...prev].slice(0, 8));
  };

  return { logs, pushLog };
}

export function useTick(ms = 1000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setTick(value => value + 1), ms);
    return () => window.clearInterval(timer);
  }, [ms]);
  return tick;
}
