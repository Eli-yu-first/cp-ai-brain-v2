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
    <span className="font-mono tracking-[-0.03em]">
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
    <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
      <div className="max-w-3xl">
        <div className="eyebrow-chip">
          <Sparkles className="h-3.5 w-3.5" />
          <span>{eyebrow}</span>
        </div>
        <h3 className="mt-5 text-3xl font-semibold leading-tight text-white md:text-4xl">{title}</h3>
      </div>
      <div className="flex w-full max-w-2xl flex-col gap-4 xl:items-end">
        <p className="text-sm leading-7 text-slate-400 md:text-[15px]">{description}</p>
        {aside}
      </div>
    </div>
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
      <Card className="metric-orb glass-line h-full rounded-[30px] border-white/8 text-card-foreground">
        <CardContent className="relative h-full p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">{label}</p>
              <div className="mt-5 flex items-end gap-3">
                <div className="text-3xl font-semibold text-white md:text-[2.4rem]">
                  <NumberTicker value={value} decimals={unit === "%" ? 1 : 0} suffix={unit === "%" ? "%" : ""} />
                </div>
                {unit !== "%" ? <span className="pb-1 text-sm font-medium text-slate-400">{unit}</span> : null}
              </div>
            </div>
            <Badge
              className={cn(
                "rounded-full border px-3 py-1.5 text-[11px] font-medium tracking-[0.18em] uppercase",
                positive
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200"
                  : "border-rose-400/25 bg-rose-400/10 text-rose-200",
              )}
            >
              {positive ? <ArrowUpRight className="mr-1 h-3.5 w-3.5" /> : <ArrowDownRight className="mr-1 h-3.5 w-3.5" />}
              {positive ? "+" : ""}
              {delta}%
            </Badge>
          </div>
          <div className="mt-7 flex items-start justify-between gap-4">
            <p className="max-w-[18rem] text-sm leading-6 text-slate-400">{description}</p>
            <div className="hidden h-18 w-18 rounded-full bg-[radial-gradient(circle,_rgba(72,198,255,0.35),_transparent_64%)] blur-xl md:block" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function GlassPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("panel-premium glass-line rounded-[34px] p-5 md:p-6", className)}>{children}</div>;
}

export function TickerTape({
  items,
}: {
  items: Array<{ code: string; name: string; price: number; changeRate: number }>;
}) {
  const tapeItems = useMemo(() => [...items, ...items], [items]);

  return (
    <div className="glass-line relative overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02)),linear-gradient(90deg,rgba(7,14,26,0.95),rgba(10,18,30,0.9))] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_16px_50px_rgba(0,0,0,0.28)]">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-[linear-gradient(90deg,#07101d,transparent)]" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-[linear-gradient(270deg,#07101d,transparent)]" />
      <motion.div
        className="flex min-w-max gap-3 px-2"
        animate={{ x: [0, -1040] }}
        transition={{ repeat: Infinity, ease: "linear", duration: 26 }}
      >
        {tapeItems.map((item, index) => (
          <div
            key={`${item.code}-${index}`}
            className="flex min-w-[240px] items-center gap-4 rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015)),rgba(8,14,24,0.92)] px-4 py-3.5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/15 bg-cyan-400/10 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-100">
              {item.code.slice(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{item.name}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.code}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="font-mono text-lg font-semibold text-white">¥{item.price.toFixed(2)}</p>
              <p className={cn("mt-1 text-xs font-medium", item.changeRate >= 0 ? "text-emerald-300" : "text-rose-300")}>
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
