import { TechPanel } from "@/components/platform/PlatformPrimitives";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Calculator,
  ChevronDown,
  ChevronUp,
  Factory,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Package,
  PiggyBank,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Warehouse,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MONTH_LABELS: Record<number, string> = {
  1: "1月", 2: "2月", 3: "3月", 4: "4月", 5: "5月", 6: "6月",
  7: "7月", 8: "8月", 9: "9月", 10: "10月", 11: "11月", 12: "12月",
};

const ROLE_CONFIG: Record<string, { icon: typeof Users; color: string; label: string }> = {
  purchasing: { icon: PiggyBank, color: "text-amber-400", label: "采购负责人" },
  production: { icon: Factory, color: "text-cyan-400", label: "生产负责人" },
  sales: { icon: TrendingUp, color: "text-emerald-400", label: "销售负责人" },
  warehouse: { icon: Warehouse, color: "text-violet-400", label: "仓储负责人" },
};

const PART_COLORS: Record<string, string> = {
  "白条": "#06b6d4", "五花肉": "#f59e0b", "前腿肉": "#10b981", "后腿肉": "#6366f1",
  "排骨": "#ef4444", "里脊": "#ec4899", "肘子": "#8b5cf6", "猪蹄": "#14b8a6",
  "猪头": "#f97316", "内脏": "#84cc16", "板油": "#a855f7", "肥膘": "#78716c",
};

function formatCurrency(val: number): string {
  if (Math.abs(val) >= 10000) return `${(val / 10000).toFixed(1)}万`;
  return val.toFixed(0);
}

function SummaryCard({ label, value, unit, icon: Icon, color }: {
  label: string; value: string; unit?: string; icon: typeof Target; color: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
      <Icon className={`h-5 w-5 ${color} mb-2`} />
      <p className="text-2xl font-bold text-white font-mono">{value}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{label}{unit ? ` (${unit})` : ""}</p>
    </div>
  );
}

function DataTable({ title, icon: Icon, headers, rows, maxH = 300 }: {
  title: string; icon: typeof LayoutDashboard; headers: string[];
  rows: React.ReactNode[][]; maxH?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayRows = expanded ? rows : rows.slice(0, 15);
  return (
    <TechPanel className="p-0 overflow-hidden rounded-[20px]">
      <div className="p-4 border-b border-white/[0.08] bg-slate-900/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Icon className="h-4 w-4 text-cyan-400" />
          {title}
          <Badge variant="secondary" className="text-[10px] bg-white/[0.06] text-slate-400">{rows.length} 条</Badge>
        </h3>
        {rows.length > 15 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded ? "收起" : `展开全部 (${rows.length})`}
          </button>
        )}
      </div>
      <div className="overflow-x-auto" style={{ maxHeight: maxH, overflowY: expanded ? "auto" : "hidden" }}>
        <table className="w-full text-left text-xs whitespace-nowrap text-slate-300">
          <thead className="bg-[#0b1426] sticky top-0 z-10 text-slate-400">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {displayRows.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5">{cell}</td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-slate-500">暂无数据</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </TechPanel>
  );
}

export default function OptimizationScheduling2Page() {
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"output" | "input" | "decision">("output");

  const { data: result, isLoading, refetch } = trpc.platform.optimizationScheduling2Simulate.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const handleRunOptimization = () => {
    setIsRunning(true);
    setTimeout(() => {
      refetch().then(() => setIsRunning(false));
    }, 1200);
  };

  const profitByMonth = useMemo(() => {
    if (!result?.output?.profitTable) return [];
    const map = new Map<number, { revenue: number; profit: number; pigCost: number; storageCost: number; transportCost: number }>();
    for (const p of result.output.profitTable) {
      const existing = map.get(p.month) ?? { revenue: 0, profit: 0, pigCost: 0, storageCost: 0, transportCost: 0 };
      existing.revenue += p.revenue;
      existing.profit += p.profit;
      existing.pigCost += p.pigCost;
      existing.storageCost += p.storageCost;
      existing.transportCost += p.transportCost;
      map.set(p.month, existing);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([month, data]) => ({ month: MONTH_LABELS[month] ?? `${month}月`, ...data }));
  }, [result]);

  const profitByPart = useMemo(() => {
    if (!result?.output?.profitTable) return [];
    const map = new Map<string, { profit: number; revenue: number; salesKg: number }>();
    for (const p of result.output.profitTable) {
      const existing = map.get(p.part) ?? { profit: 0, revenue: 0, salesKg: 0 };
      existing.profit += p.profit;
      existing.revenue += p.revenue;
      existing.salesKg += p.salesKg;
      map.set(p.part, existing);
    }
    return Array.from(map.entries())
      .sort(([, a], [, b]) => b.profit - a.profit)
      .map(([part, data]) => ({ part, ...data, fill: PART_COLORS[part] ?? "#64748b" }));
  }, [result]);

  const salesByChannel = useMemo(() => {
    if (!result?.output?.salesTable) return [];
    const map = new Map<string, number>();
    for (const s of result.output.salesTable) {
      map.set(s.customerType, (map.get(s.customerType) ?? 0) + s.orderQty * s.salesPrice);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value: Math.round(value) }));
  }, [result]);

  const summary = result?.output?.summary;

  return (
    <PlatformShell title="最优化调度2" eyebrow="Optimization Scheduling 2" pageId="optimization-scheduling2">
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
            <Target className="h-8 w-8 text-indigo-400" />
            {"最优化调度2"}
          </h1>
          <p className="text-slate-400 text-sm max-w-5xl leading-relaxed">
            基于出栏表、出品率表、屠宰厂能力表、分割能力表、仓库表、毛猪订单表、部位订单表、深加工需求表、运输费用表等输入参数，
            采用最优化求解器求解利润最大化目标，生成利润表、毛猪销售表、销售表、分割表等输出参数，
            并通过AI智能决策引擎生成具体决策建议，分配到采购、生产、销售、仓储四个负责人执行。
          </p>
        </div>

        <div className="flex gap-3 items-center">
          <Button
            onClick={handleRunOptimization}
            disabled={isRunning || isLoading}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all"
          >
            {isRunning ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin" />
                正在求解最优化方案...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                执行最优化求解
              </span>
            )}
          </Button>

          <div className="flex rounded-xl overflow-hidden border border-white/[0.08]">
            {(["output", "input", "decision"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-indigo-600/30 text-indigo-200 border-b-2 border-indigo-400"
                    : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                {tab === "output" ? "输出结果" : tab === "input" ? "输入参数" : "AI决策"}
              </button>
            ))}
          </div>
        </div>

        {summary && activeTab === "output" && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <SummaryCard icon={PiggyBank} label="总利润" value={formatCurrency(summary.totalProfit)} unit="元" color="text-emerald-400" />
                <SummaryCard icon={TrendingUp} label="总收入" value={formatCurrency(summary.totalRevenue)} unit="元" color="text-cyan-400" />
                <SummaryCard icon={Target} label="利润率" value={`${summary.profitMargin}%`} color="text-amber-400" />
                <SummaryCard icon={Factory} label="屠宰量" value={`${summary.totalSlaughterCount.toLocaleString()}`} unit="头" color="text-violet-400" />
                <SummaryCard icon={Package} label="销量" value={`${(summary.totalSalesKg / 1000).toFixed(0)}`} unit="吨" color="text-blue-400" />
                <SummaryCard icon={Zap} label="产能利用率" value={`${summary.capacityUtilization}%`} color="text-orange-400" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4 text-cyan-400" />
                    月度利润与收入趋势
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={profitByMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v: number) => formatCurrency(v)} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="revenue" name="收入" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="profit" name="利润" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                      <Line type="monotone" dataKey="pigCost" name="毛猪成本" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </TechPanel>

                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4 text-amber-400" />
                    部位利润排名
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={profitByPart} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v: number) => formatCurrency(v)} />
                      <YAxis dataKey="part" type="category" tick={{ fill: "#cbd5e1", fontSize: 11 }} width={60} />
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Bar dataKey="profit" name="利润" radius={[0, 4, 4, 0]}>
                        {profitByPart.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </TechPanel>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <TechPanel className="p-6 rounded-[20px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-400" />
                    渠道收入分布
                  </h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={salesByChannel}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {salesByChannel.map((_, index) => (
                          <Cell key={index} fill={["#06b6d4", "#f59e0b", "#10b981", "#6366f1", "#ef4444"][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </TechPanel>

                <div className="xl:col-span-2">
                  <DataTable
                    title="利润表"
                    icon={PiggyBank}
                    headers={["工厂ID", "月份", "部位", "销量(kg)", "单价", "收入", "毛猪成本", "仓储成本", "运输成本", "利润"]}
                    rows={(result?.output?.profitTable ?? []).map((p) => [
                      <span className="font-mono text-cyan-200/80">{p.factoryId}</span>,
                      <span>{MONTH_LABELS[p.month] ?? `${p.month}月`}</span>,
                      <span className="font-medium">{p.part}</span>,
                      <span className="font-mono text-right">{p.salesKg.toLocaleString()}</span>,
                      <span className="font-mono">¥{p.price.toFixed(1)}</span>,
                      <span className="font-mono text-slate-200">{formatCurrency(p.revenue)}</span>,
                      <span className="font-mono text-amber-300/80">{formatCurrency(p.pigCost)}</span>,
                      <span className="font-mono text-violet-300/80">{formatCurrency(p.storageCost)}</span>,
                      <span className="font-mono text-blue-300/80">{formatCurrency(p.transportCost)}</span>,
                      <span className={`font-mono font-bold ${p.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {formatCurrency(p.profit)}
                      </span>,
                    ])}
                    maxH={350}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DataTable
                  title="毛猪销售表"
                  icon={PiggyBank}
                  headers={["工厂ID", "月份", "销售量(头)", "所属省份"]}
                  rows={(result?.output?.pigSalesTable ?? []).map((p) => [
                    <span className="font-mono text-cyan-200/80">{p.factoryId}</span>,
                    <span>{MONTH_LABELS[p.month] ?? `${p.month}月`}</span>,
                    <span className="font-mono">{p.salesQty.toLocaleString()}</span>,
                    <span>{p.province}</span>,
                  ])}
                  maxH={250}
                />
                <DataTable
                  title="销售表"
                  icon={TrendingUp}
                  headers={["工厂ID", "月份", "部位", "客户类别", "订单量(kg)", "销售价格", "省份"]}
                  rows={(result?.output?.salesTable ?? []).map((s) => [
                    <span className="font-mono text-cyan-200/80">{s.factoryId}</span>,
                    <span>{MONTH_LABELS[s.month] ?? `${s.month}月`}</span>,
                    <span className="font-medium">{s.part}</span>,
                    <span><Badge variant="secondary" className="text-[10px] bg-white/[0.06]">{s.customerType}</Badge></span>,
                    <span className="font-mono">{s.orderQty.toLocaleString()}</span>,
                    <span className="font-mono">¥{s.salesPrice.toFixed(1)}</span>,
                    <span>{s.province}</span>,
                  ])}
                  maxH={250}
                />
              </div>

              <DataTable
                title="分割表"
                icon={Factory}
                headers={["工厂ID", "月份", "分割部位", "分割量(kg)", "冷冻量(kg)"]}
                rows={(result?.output?.splittingTable ?? []).map((s) => [
                  <span className="font-mono text-cyan-200/80">{s.factoryId}</span>,
                  <span>{MONTH_LABELS[s.month] ?? `${s.month}月`}</span>,
                  <span className="font-medium">{s.part}</span>,
                  <span className="font-mono">{s.splitKg.toLocaleString()}</span>,
                  <span className="font-mono text-blue-300/80">{s.freezeKg.toLocaleString()}</span>,
                ])}
                maxH={300}
              />
            </motion.div>
          </AnimatePresence>
        )}

        {result?.input && activeTab === "input" && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <DataTable
                title="出栏表"
                icon={PiggyBank}
                headers={["养殖场ID", "省份", "月份", "出栏量(头)", "均重(kg)", "毛猪价格(元/kg)"]}
                rows={(result.input.slaughterSchedule ?? []).map((r) => [
                  <span className="font-mono text-cyan-200/80">{r.farmId}</span>,
                  <span>{r.province}</span>,
                  <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                  <span className="font-mono">{r.count.toLocaleString()}</span>,
                  <span className="font-mono">{r.avgWeightKg}</span>,
                  <span className="font-mono text-amber-300">¥{r.livePigPrice.toFixed(2)}</span>,
                ])}
                maxH={300}
              />

              <DataTable
                title="出品率表"
                icon={Factory}
                headers={["分割父物料", "分割子物料", "产出率", "工艺"]}
                rows={(result.input.yieldRates ?? []).map((r) => [
                  <span className="font-medium">{r.parentMaterial}</span>,
                  <span className="font-medium text-cyan-200">{r.childMaterial}</span>,
                  <span className="font-mono">{(r.yieldRate * 100).toFixed(0)}%</span>,
                  <span>工艺{r.process}</span>,
                ])}
                maxH={200}
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DataTable
                  title="屠宰厂能力表"
                  icon={Factory}
                  headers={["屠宰厂ID", "省份", "月份", "屠宰上限(头)"]}
                  rows={(result.input.slaughterCapacity ?? []).map((r) => [
                    <span className="font-mono text-cyan-200/80">{r.factoryId}</span>,
                    <span>{r.province}</span>,
                    <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                    <span className="font-mono">{r.maxSlaughter.toLocaleString()}</span>,
                  ])}
                  maxH={250}
                />
                <DataTable
                  title="分割能力表"
                  icon={Factory}
                  headers={["工厂ID", "分割部位", "分割上限(kg)", "冷冻上限(kg)", "库容上限(kg)", "库存成本系数", "月份"]}
                  rows={(result.input.splitCapacity ?? []).map((r) => [
                    <span className="font-mono text-cyan-200/80">{r.factoryId}</span>,
                    <span className="font-medium">{r.part}</span>,
                    <span className="font-mono">{r.maxSplitKg.toLocaleString()}</span>,
                    <span className="font-mono text-blue-300/80">{r.maxFreezeKg.toLocaleString()}</span>,
                    <span className="font-mono">{r.maxStorageKg.toLocaleString()}</span>,
                    <span className="font-mono text-amber-300/80">{r.storageCostRate}</span>,
                    <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                  ])}
                  maxH={250}
                />
              </div>

              <DataTable
                title="仓库表"
                icon={Warehouse}
                headers={["仓库ID", "省份", "库容上限(kg)", "库存成本系数(元/kg/月)", "月份"]}
                rows={(result.input.warehouses ?? []).map((r) => [
                  <span className="font-mono text-cyan-200/80">{r.warehouseId}</span>,
                  <span>{r.province}</span>,
                  <span className="font-mono">{r.maxStorageKg.toLocaleString()}</span>,
                  <span className="font-mono text-amber-300/80">{r.storageCostRate.toFixed(2)}</span>,
                  <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                ])}
                maxH={250}
              />

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DataTable
                  title="毛猪订单表"
                  icon={PiggyBank}
                  headers={["工厂ID", "月份", "订单量(头)", "毛猪价格(元/kg)", "订单售达省份"]}
                  rows={(result.input.pigOrders ?? []).map((r) => [
                    <span className="font-mono text-cyan-200/80">{r.factoryId}</span>,
                    <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                    <span className="font-mono">{r.orderQty.toLocaleString()}</span>,
                    <span className="font-mono text-amber-300">¥{r.livePigPrice.toFixed(2)}</span>,
                    <span>{r.destinationProvince}</span>,
                  ])}
                  maxH={250}
                />
                <DataTable
                  title="部位订单表"
                  icon={Package}
                  headers={["工厂ID", "部位", "月份", "客户类别", "订单量(kg)", "销售价格", "订单售达省份"]}
                  rows={(result.input.partOrders ?? []).map((r) => [
                    <span className="font-mono text-cyan-200/80">{r.factoryId}</span>,
                    <span className="font-medium">{r.part}</span>,
                    <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                    <span><Badge variant="secondary" className="text-[10px] bg-white/[0.06]">{r.customerType}</Badge></span>,
                    <span className="font-mono">{r.orderQty.toLocaleString()}</span>,
                    <span className="font-mono text-emerald-300">¥{r.salesPrice.toFixed(1)}</span>,
                    <span>{r.destinationProvince}</span>,
                  ])}
                  maxH={250}
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <DataTable
                  title="深加工需求表"
                  icon={Factory}
                  headers={["工厂ID", "部位", "月份", "工厂类别", "原料需求量(kg)", "销售价格", "订单售达省份"]}
                  rows={(result.input.deepProcessDemand ?? []).map((r) => [
                    <span className="font-mono text-cyan-200/80">{r.factoryId}</span>,
                    <span className="font-medium">{r.part}</span>,
                    <span>{MONTH_LABELS[r.month] ?? `${r.month}月`}</span>,
                    <span><Badge variant="secondary" className="text-[10px] bg-white/[0.06]">{r.factoryType}</Badge></span>,
                    <span className="font-mono">{r.rawMaterialDemand.toLocaleString()}</span>,
                    <span className="font-mono text-emerald-300">¥{r.salesPrice.toFixed(1)}</span>,
                    <span>{r.destinationProvince}</span>,
                  ])}
                  maxH={250}
                />
                <DataTable
                  title="运输费用表"
                  icon={Truck}
                  headers={["输出省份", "订单售达省份", "运输成本(元/kg/km)", "距离(km)"]}
                  rows={(result.input.transportCosts ?? []).map((r) => [
                    <span>{r.originProvince}</span>,
                    <span>{r.destinationProvince}</span>,
                    <span className="font-mono text-amber-300/80">{r.costPerKmPerKg.toFixed(4)}</span>,
                    <span className="font-mono">{r.distanceKm.toLocaleString()}</span>,
                  ])}
                  maxH={250}
                />
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {result?.decision && activeTab === "decision" && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <TechPanel className="p-6 rounded-[24px]">
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="h-6 w-6 text-indigo-400" />
                  <h2 className="text-lg font-bold text-slate-200">AI 智能决策总览</h2>
                </div>
                <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-100 leading-relaxed">
                  {result.decision.overview}
                </div>
              </TechPanel>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TechPanel className="p-6 rounded-[24px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-emerald-400" />
                    关键发现
                  </h3>
                  <ul className="space-y-2">
                    {result.decision.keyFindings.map((f, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </TechPanel>

                <TechPanel className="p-6 rounded-[24px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-red-400" />
                    风险预警
                  </h3>
                  {result.decision.riskWarnings.length > 0 ? (
                    <ul className="space-y-2">
                      {result.decision.riskWarnings.map((w, i) => (
                        <li key={i} className="flex gap-2 text-sm text-red-300 bg-red-500/10 p-3 rounded-lg">
                          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">当前无重大风险预警</p>
                  )}
                </TechPanel>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <TechPanel className="p-6 rounded-[24px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-400" />
                    瓶颈识别
                  </h3>
                  {result.decision.bottlenecks.length > 0 ? (
                    <ul className="space-y-2">
                      {result.decision.bottlenecks.map((b, i) => (
                        <li key={i} className="flex gap-2 text-sm text-amber-300 bg-amber-500/10 p-3 rounded-lg">
                          <Zap className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">未发现明显瓶颈</p>
                  )}
                </TechPanel>

                <TechPanel className="p-6 rounded-[24px]">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    利润优化建议
                  </h3>
                  <ul className="space-y-2">
                    {result.decision.profitOptimization.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm text-cyan-300">
                        <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </TechPanel>
              </div>

              <TechPanel className="p-6 rounded-[24px]">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-400" />
                  决策执行分配
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {Object.entries(ROLE_CONFIG).map(([role, config]) => {
                    const actions = result.decision.roleActions[role as keyof typeof result.decision.roleActions] ?? [];
                    const Icon = config.icon;
                    return (
                      <div key={role} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center gap-2 mb-3">
                          <Icon className={`h-5 w-5 ${config.color}`} />
                          <span className="text-sm font-semibold text-slate-200">{config.label}</span>
                          <Badge variant="secondary" className="text-[10px] bg-white/[0.06] text-slate-400 ml-auto">
                            {actions.length} 项
                          </Badge>
                        </div>
                        <ul className="space-y-2">
                          {actions.map((action, i) => (
                            <li key={i} className="text-xs text-slate-400 leading-relaxed flex gap-2">
                              <span className="shrink-0 mt-1 h-1 w-1 rounded-full bg-slate-500" />
                              {action}
                            </li>
                          ))}
                          {actions.length === 0 && (
                            <li className="text-xs text-slate-600">暂无任务</li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </TechPanel>

              <TechPanel className="p-6 rounded-[24px]">
                <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  综合建议
                </h3>
                <ul className="space-y-2">
                  {result.decision.recommendations.map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-300">
                      <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </TechPanel>
            </motion.div>
          </AnimatePresence>
        )}

        {isLoading && !result && (
          <div className="flex items-center justify-center py-20">
            <Sparkles className="h-6 w-6 text-indigo-400 animate-spin mr-3" />
            <span className="text-slate-400">正在加载最优化调度数据...</span>
          </div>
        )}
      </div>
    </PlatformShell>
  );
}
