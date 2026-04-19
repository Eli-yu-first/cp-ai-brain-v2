import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export function NumberTicker({
  value,
  suffix = "",
  decimals = 0,
}: {
  value: number;
  suffix?: string;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let frame = 0;
    const duration = 960;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className="num-display tracking-[-0.02em]">
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string;
  title: string;
  description: string;
  aside?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"
    >
      <div className="max-w-3xl">
        <div className="eyebrow-chip">
          <Sparkles className="h-3 w-3" />
          <span>{eyebrow}</span>
        </div>
        <h3 className="mt-4 text-2xl font-bold leading-tight tracking-tight text-white md:text-3xl lg:text-4xl">{title}</h3>
      </div>
      <div className="flex w-full max-w-2xl flex-col gap-4 xl:items-end">
        <p className="text-[13px] leading-7 text-slate-400/90 md:text-sm">{description}</p>
        {aside}
      </div>
    </motion.div>
  );
}

export function MetricCard({
  label,
  value,
  unit,
  delta,
  description,
  delay = 0,
}: {
  label: string;
  value: number;
  unit: string;
  delta: number;
  description: string;
  delay?: number;
}) {
  const positive = delta >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card className="metric-orb glass-line glow-border h-full rounded-[24px] border-white/[0.07] text-card-foreground">
        <CardContent className="relative h-full p-5 md:p-6">
          {/* Subtle top glow */}
          <div className="pointer-events-none absolute left-1/2 top-0 h-[1px] w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent" />

          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">{label}</p>
              <div className="mt-4 flex items-end gap-2.5">
                <div className="text-3xl font-bold text-white md:text-[2.2rem] animate-data-pulse">
                  <NumberTicker value={value} decimals={unit === "%" ? 1 : 0} suffix={unit === "%" ? "%" : ""} />
                </div>
                {unit !== "%" ? <span className="pb-1 text-[13px] font-medium text-slate-500">{unit}</span> : null}
              </div>
            </div>
            <Badge
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.15em] uppercase",
                positive
                  ? "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-300"
                  : "border-rose-400/20 bg-rose-400/[0.08] text-rose-300",
              )}
            >
              {positive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
              {positive ? "+" : ""}
              {delta}%
            </Badge>
          </div>
          <div className="mt-6 flex items-start justify-between gap-4">
            <p className="max-w-[18rem] text-[12.5px] leading-[1.7] text-slate-400/80">{description}</p>
            <div className="hidden h-14 w-14 rounded-full bg-[radial-gradient(circle,_rgba(56,152,255,0.25),_transparent_65%)] blur-xl md:block" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function TechPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div 
      className={cn("relative overflow-hidden bg-[linear-gradient(135deg,rgba(4,14,35,0.95),rgba(6,18,45,0.9))] border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.1)] p-5 md:p-6", className)}
      style={{
        clipPath: "polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 20px 100%, 0 calc(100% - 20px))"
      }}
    >
      {/* Decals & Grid */}
      <div className="absolute top-0 right-[20px] w-12 h-[2px] bg-cyan-400 font-mono text-[8px] flex items-center justify-end pr-1 text-cyan-900 border-l border-cyan-300">ACT</div>
      <div className="absolute bottom-[20px] left-0 w-[2px] h-12 bg-cyan-400" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-cyan-500/40" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export function TickerTape({
  items,
}: {
  items: Array<{ code: string; name: string; price: number; changeRate: number }>;
}) {
  const tapeItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="glass-line relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)),linear-gradient(90deg,rgba(6,14,30,0.96),rgba(8,16,32,0.92))] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_40px_rgba(0,4,15,0.35)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-[linear-gradient(90deg,rgba(6,14,30,0.98),transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-[linear-gradient(270deg,rgba(6,14,30,0.98),transparent)]" />
      <motion.div
        className="flex min-w-max gap-2.5 px-2"
        animate={{ x: [0, -1040] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 26 }}
      >
        {tapeItems.map((item, index) => (
          <div
            key={`${item.code}-${index}`}
            className="flex min-w-[230px] items-center gap-3.5 rounded-xl border border-white/[0.05] bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01)),rgba(6,14,28,0.94)] px-3.5 py-3 transition-all hover:border-white/[0.1]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.06] text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">
              {item.code.slice(0, 2)}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">{item.name}</p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600">{item.code}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="num-display text-base font-bold text-white">¥{item.price.toFixed(2)}</p>
              <p className={cn("mt-0.5 num-display text-[11px] font-semibold", item.changeRate >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {item.changeRate >= 0 ? "+" : ""}
                {item.changeRate.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
