import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Timeframe = "day" | "week" | "month" | "quarter" | "halfYear" | "year";

export function TimeframeToggle({
  value,
  onChange,
}: {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}) {
  const { language } = useLanguage();

  const labels = {
    zh: {
      day: "日",
      week: "周",
      month: "月",
      quarter: "季",
      halfYear: "半年",
      year: "年",
    },
    en: {
      day: "1D",
      week: "1W",
      month: "1M",
      quarter: "1Q",
      halfYear: "6M",
      year: "1Y",
    },
    ja: {
      day: "日",
      week: "週",
      month: "月",
      quarter: "四半期",
      halfYear: "半年",
      year: "年",
    },
    th: {
      day: "วัน",
      week: "สัปดาห์",
      month: "เดือน",
      quarter: "ไตรมาส",
      halfYear: "6 เดือน",
      year: "ปี",
    },
  }[language];

  const options: Array<{ value: Timeframe; label: string }> = [
    { value: "day", label: labels.day },
    { value: "week", label: labels.week },
    { value: "month", label: labels.month },
    { value: "quarter", label: labels.quarter },
    { value: "halfYear", label: labels.halfYear },
    { value: "year", label: labels.year },
  ];

  return (
    <div className="glass-line inline-flex flex-wrap gap-2 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.015)),rgba(7,12,22,0.9)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_12px_35px_rgba(0,0,0,0.22)]">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-[16px] px-4 py-2.5 text-sm font-medium transition-all duration-300",
            value === option.value
              ? "bg-[linear-gradient(135deg,rgba(92,205,255,0.18),rgba(129,156,255,0.12))] text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_0_1px_rgba(56,189,248,0.22)]"
              : "text-slate-400 hover:bg-white/[0.05] hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
