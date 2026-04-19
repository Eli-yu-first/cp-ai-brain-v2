import { TechPanel, SectionHeader } from "@/components/platform/PlatformPrimitives";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";
import {
  BrainCircuit,
  Map as MapIcon,
  Route,
  Target,
  Truck,
  TrendingUp,
  Settings2,
  ListOrdered,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ComposableMap, Geographies, Geography, Marker, Line as MapLine } from "react-simple-maps";
import chinaGeo from "@/data/china-geo.json";

const geoUrl = chinaGeo;

function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1628]/95 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300/80">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-6 text-[12px]">
          <span className="text-slate-400">单公斤净利</span>
          <span className="font-mono font-semibold text-emerald-400">+{Number(payload[0].value).toFixed(2)} 元/kg</span>
        </div>
      </div>
    </div>
  );
}

export default function SpatialArbitragePage() {
  const { t } = useLanguage();
  const [transportCost, setTransportCost] = useState(0.8);
  const [minProfit, setMinProfit] = useState(1.0);
  const [batchSize, setBatchSize] = useState(500);
  const [originFilter, setOriginFilter] = useState("all");
  const [partCode, setPartCode] = useState("carcass");

  const { data: simulation, isLoading: mapLoading } = trpc.platform.spatialArbitrageSimulate.useQuery(
    { transportCostPerKmPerTon: transportCost, minProfitThreshold: minProfit, batchSizeTon: batchSize, originFilter, partCode },
    { placeholderData: (prev: any) => prev }
  );

  const { mutate: runAiDispatch, data: aiTasks, isPending: aiPending } = trpc.platform.spatialAiDispatch.useMutation();

  useEffect(() => {
    if (simulation && simulation.routes.length > 0) {
      const handler = setTimeout(() => {
        runAiDispatch({ routes: simulation.routes });
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [simulation, runAiDispatch]);

  const mapCenter: [number, number] = [104.195, 35.861]; // Longitude, Latitude for Central China

  return (
    <PlatformShell title={t("spatialArbitrage.pageTitle")} eyebrow="Spatial Arbitrage" pageId="spatial-arbitrage">
      <SectionHeader
        eyebrow="AI Geography Routing"
        title={t("spatialArbitrage.pageTitle")}
        description={t("spatialArbitrage.pageDesc")}
        aside={
          <div className="flex items-center gap-2">
            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
              <Sparkles className="mr-1 h-3 w-3" /> Live Data Integrated
            </Badge>
          </div>
        }
      />

      {/* Top Value Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {[
          { label: t("spatialArbitrage.statTotal"), value: `${simulation?.totalOpportunities ?? 0} 条`, desc: "扫描全国动态路网" },
          { label: t("spatialArbitrage.statBest"), value: `+${simulation?.bestRouteProfit.toFixed(2) ?? "0.00"} 元/kg`, desc: simulation?.bestRouteName ?? "-" },
          { label: t("spatialArbitrage.statTop5"), value: `${simulation?.top5TotalProfit ?? 0} 万元`, desc: `基于 ${batchSize} 吨/批次` },
          { label: t("spatialArbitrage.statAvg"), value: `${simulation?.averageSpread.toFixed(2) ?? "0.00"} 元/kg`, desc: "有效路由价差均值" }
        ].map((stat, i) => (
          <TechPanel key={i} className="p-4 rounded-[20px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 mb-2">{stat.label}</p>
            <p className="font-mono text-2xl font-bold text-white tracking-tight">{stat.value}</p>
            <p className="text-[12px] text-slate-400 mt-2">{stat.desc}</p>
          </TechPanel>
        ))}
      </div>

      {/* AI Overview Banner */}
      <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.05] p-3 shadow-[0_0_20px_rgba(16,185,129,0.05)] backdrop-blur flex gap-3 items-center">
         <span className="relative flex h-2.5 w-2.5 ml-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
         </span>
         <p className="text-sm font-medium text-emerald-100">
           {simulation?.aiDecisionOverview ?? "正在加载区域数据与测算路由..."}
         </p>
      </div>

      {/* Main Middle Row (Sliders + Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        
        {/* Left Control Panel */}
        <div className="lg:col-span-4 space-y-6">
          <TechPanel className="p-6 rounded-[24px]">
             <h4 className="text-sm font-semibold tracking-wide text-white mb-6 flex items-center gap-2">
                 <Settings2 className="h-4 w-4 text-cyan-400" />
                 {t("spatialArbitrage.paramsGroup")}
             </h4>
             <div className="space-y-8">
                {/* param 1 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] text-slate-400 font-medium flex items-center gap-2">
                       <Truck className="h-4 w-4 text-slate-500" /> {t("spatialArbitrage.tfTransport")}
                    </label>
                    <span className="font-mono text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded text-xs">{transportCost.toFixed(2)}</span>
                  </div>
                  <Slider min={0.2} max={2.0} step={0.1} value={[transportCost]} onValueChange={v => setTransportCost(v[0]!)} />
                </div>
                {/* param 2 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] text-slate-400 font-medium flex items-center gap-2">
                       <Target className="h-4 w-4 text-slate-500" /> {t("spatialArbitrage.tfMinProfit")}
                    </label>
                    <span className="font-mono text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded text-xs">{minProfit.toFixed(1)}</span>
                  </div>
                  <Slider min={0.1} max={5.0} step={0.1} value={[minProfit]} onValueChange={v => setMinProfit(v[0]!)} />
                </div>
                {/* param 3 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[13px] text-slate-400 font-medium flex items-center gap-2">
                       <Route className="h-4 w-4 text-slate-500" /> {t("spatialArbitrage.tfBatchSize")}
                    </label>
                    <span className="font-mono text-slate-300 font-bold bg-white/10 px-2 py-0.5 rounded text-xs">{batchSize}</span>
                  </div>
                  <Slider min={100} max={2000} step={100} value={[batchSize]} onValueChange={v => setBatchSize(v[0]!)} />
                </div>
                
                {/* dropdowns */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[13px] text-slate-400 font-medium">经营部位选择</label>
                    <Select value={partCode} onValueChange={setPartCode}>
                       <SelectTrigger className="w-full bg-[#081020] border-white/10 text-white shadow-none focus:ring-1 focus:ring-cyan-500/50 rounded-xl transition-all hover:bg-white/5">
                          <SelectValue placeholder="选择部位" />
                       </SelectTrigger>
                       <SelectContent className="bg-[#081020] border-white/10 text-white rounded-xl shadow-2xl backdrop-blur-xl">
                          <SelectItem value="whole_hog" className="hover:bg-white/10 rounded-lg cursor-pointer">活体毛猪</SelectItem>
                          <SelectItem value="carcass" className="hover:bg-white/10 rounded-lg cursor-pointer">核心白条</SelectItem>
                          <SelectItem value="frozen_stock" className="hover:bg-white/10 rounded-lg cursor-pointer">冷冻库存</SelectItem>
                          <SelectItem value="pork_belly" className="hover:bg-white/10 rounded-lg cursor-pointer">精选五花肉</SelectItem>
                          <SelectItem value="ribs" className="hover:bg-white/10 rounded-lg cursor-pointer">肋排</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                <div className="space-y-3">
                  <label className="text-[13px] text-slate-400 font-medium">产地选择</label>
                  <Select value={originFilter} onValueChange={setOriginFilter}>
                     <SelectTrigger className="w-full bg-[#081020] border-white/10 text-white shadow-none focus:ring-1 focus:ring-cyan-500/50 rounded-xl transition-all hover:bg-white/5">
                        <SelectValue placeholder="全部产地" />
                     </SelectTrigger>
                     <SelectContent className="bg-[#081020] border-white/10 text-white rounded-xl shadow-2xl backdrop-blur-xl">
                        <SelectItem value="all" className="hover:bg-white/10 rounded-lg cursor-pointer">全部产地</SelectItem>
                        <SelectItem value="origin_gx" className="hover:bg-white/10 rounded-lg cursor-pointer">广西重点区</SelectItem>
                        <SelectItem value="origin_hn" className="hover:bg-white/10 rounded-lg cursor-pointer">湖南核心区</SelectItem>
                        <SelectItem value="origin_sc" className="hover:bg-white/10 rounded-lg cursor-pointer">四川盆地</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="mt-8 pt-6 border-t border-white/5 flex gap-4 text-[12px] flex-wrap justify-between items-center text-slate-400">
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span> 优质产地</div>
               <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span> 高价目标</div>
               <div className="flex items-center gap-1.5 border-t-2 border-dashed border-amber-500/80 w-6"></div> <span>套利连线</span>
             </div>
             </div>
          </TechPanel>
        </div>

        {/* Map Visualization */}
        <div className="lg:col-span-8 flex flex-col min-h-[460px]">
          <TechPanel className="flex-1 p-6 relative rounded-[24px] flex flex-col overflow-hidden">
            <h4 className="text-sm font-semibold tracking-wide text-white mb-2 z-10 flex items-center gap-2">
                 <MapIcon className="h-4 w-4 text-emerald-400" />
                 {t("spatialArbitrage.mapTitle")}
             </h4>
             <div className="absolute inset-0 pt-16 pb-4 px-4 overflow-hidden pointer-events-none opacity-80">
               {typeof window !== "undefined" && (
                 <ComposableMap
                   projection="geoOrthographic"
                   projectionConfig={{
                     scale: 680,
                     rotate: [-104, -36, 0]
                   }}
                   width={800}
                   height={480}
                   style={{ width: "100%", height: "100%" }}
                 >
                   <Geographies geography={geoUrl}>
                     {({ geographies }: any) =>
                       geographies.map((geo: any) => {
                         const originColor = "rgba(16,185,129,0.18)";
                         const destColor = "rgba(244,63,94,0.18)";
                         const isOrigin = simulation?.nodes.some(n => n.name === geo.properties?.name && n.type === 'origin');
                         const isDest = simulation?.nodes.some(n => n.name === geo.properties?.name && n.type === 'destination');
                         
                         return (
                           <Geography
                             key={geo.rsmKey}
                             geography={geo}
                             fill={isOrigin ? originColor : isDest ? destColor : "rgba(15,23,42,0.6)"}
                             stroke="rgba(56,189,248,0.25)"
                             strokeWidth={0.8}
                             className="transition-colors duration-500"
                             style={{
                               default: { outline: "none" },
                               hover: { outline: "none", fill: "rgba(56,189,248,0.2)" },
                               pressed: { outline: "none" },
                             }}
                           />
                         );
                       })
                     }
                   </Geographies>

                   {/* Lines for routes */}
                   {simulation?.routes.slice(0, 10).map((route, i) => {
                     // Opacity decays for lower ranking routes
                     const opacity = Math.max(0.2, 1 - i * 0.15); 
                     const isTop = i < 3;
                     return (
                        <MapLine
                          key={`route-${i}`}
                          from={route.originCoords}
                          to={route.destCoords}
                          stroke="#fbbf24"
                          strokeWidth={isTop ? 2.5 : 1}
                          strokeDasharray={isTop ? "4 4" : "2 4"}
                          strokeLinecap="round"
                          style={{ fill: "none", opacity }}
                        />
                     );
                   })}

                   {/* Bubbles for Nodes */}
                   {simulation?.nodes.map((node) => {
                     const isOr = node.type === "origin";
                     const isFiltered = originFilter !== "all" && isOr && node.id !== originFilter && !node.name.includes(originFilter);
                     if (isFiltered) return null;
                     
                     // Dynamic radius roughly by visual scale
                     const radius = isOr ? 8 : 6;
                     return (
                       <Marker key={node.id} coordinates={[node.lng, node.lat]}>
                         <circle
                           r={radius}
                           fill={isOr ? "#10b981" : "#f43f5e"} // emerald / rose
                           fillOpacity={0.8}
                           stroke="#0f172a"
                           strokeWidth={1.5}
                         />
                         <text
                           textAnchor="middle"
                           y={radius + 12}
                           style={{ fontFamily: "sans-serif", fill: "#94a3b8", fontSize: 10, fontWeight: 600 }}
                         >
                           {node.name}
                         </text>
                         <text
                           textAnchor="middle"
                           y={radius + 24}
                           style={{ fontFamily: "monospace", fill: "#fff", fontSize: 9, opacity: 0.6 }}
                         >
                           {node.basePrice.toFixed(1)}
                         </text>
                       </Marker>
                     );
                   })}
                 </ComposableMap>
               )}
             </div>
          </TechPanel>
        </div>
      </div>

      {/* Tables and Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
         <TechPanel className="lg:col-span-7 rounded-[24px] p-6 overflow-hidden">
            <h4 className="text-sm font-semibold tracking-wide text-white mb-6 flex items-center gap-2">
                 <ListOrdered className="h-4 w-4 text-cyan-400" />
                 {t("spatialArbitrage.routeTitle")}
             </h4>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-white/10 text-slate-400 uppercase text-[11px] tracking-wider">
                       <th className="pb-3 px-2 font-medium">产地</th>
                       <th className="pb-3 px-2 font-medium">目的地</th>
                       <th className="pb-3 px-2 font-medium">产地价(元/kg)</th>
                       <th className="pb-3 px-2 font-medium">目的地价(元/kg)</th>
                       <th className="pb-3 px-2 font-medium text-right">运距(km)</th>
                       <th className="pb-3 px-2 font-medium text-right">运费成本(元/kg)</th>
                       <th className="pb-3 px-2 font-medium text-right text-emerald-400">单线净利(元/kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation?.routes.slice(0, 7).map((r, i) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="py-3 px-2 font-medium text-white">{r.originName}</td>
                        <td className="py-3 px-2 font-medium text-white">{r.destName}</td>
                        <td className="py-3 px-2 text-slate-300 font-mono">{r.originPrice.toFixed(2)}</td>
                        <td className="py-3 px-2 text-slate-300 font-mono">{r.destPrice.toFixed(2)}</td>
                        <td className="py-3 px-2 text-slate-400 font-mono text-right">{r.distanceKm}</td>
                        <td className="py-3 px-2 text-slate-400 font-mono text-right">{r.transportCost.toFixed(2)}</td>
                        <td className="py-3 px-2 font-mono font-bold text-emerald-400 text-right">+{r.netProfit.toFixed(2)}</td>
                      </tr>
                    ))}
                    {(!simulation?.routes || simulation.routes.length === 0) && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">无符合阈值要求的跨区套利网络</td>
                      </tr>
                    )}
                  </tbody>
               </table>
            </div>
         </TechPanel>
         
         <TechPanel className="lg:col-span-5 rounded-[24px] p-6 flex flex-col min-h-[300px]">
            <h4 className="text-sm font-semibold tracking-wide text-white mb-6">套利单线净利比较</h4>
            <div className="flex-1 w-full min-h-0 relative -ml-4">
               {simulation?.routes && simulation.routes.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={simulation.routes.slice(0, 6)} margin={{ top: 10, right: 0, left: 0, bottom: 20 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                     <XAxis 
                       dataKey={(r) => `${r.originName}→${r.destName}`}
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: "#64748b", fontSize: 10 }} 
                       dy={10}
                     />
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace" }} 
                       width={40}
                     />
                     <RechartsTooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<CustomBarTooltip />} />
                     <Bar dataKey="netProfit" radius={[4, 4, 0, 0]} maxBarSize={40}>
                       {simulation.routes.slice(0, 6).map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#059669"} fillOpacity={index === 0 ? 1 : 0.6} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="flex items-center justify-center h-full text-slate-500 text-sm">暂无正收益数据</div>
               )}
            </div>
         </TechPanel>
      </div>

      {/* AI Strategy Report Block */}
      {simulation?.aiStrategyReport && (
        <TechPanel className="mb-8 rounded-[24px] p-6 lg:p-8 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.05),transparent_50%))]">
          <div className="flex items-center gap-3 mb-6">
             <div className="h-10 w-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
               <BrainCircuit className="h-5 w-5 text-cyan-400" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-white tracking-wide">AI 时空维调拨策略深度解析</h3>
               <p className="text-[12px] text-slate-400">结合价格极差、物流磨耗与热力网生成的行动方案</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4 lg:col-span-1">
               <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-2"><Target className="w-8 h-8 text-white/[0.03]" /></div>
                 <h4 className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-3 flex items-center gap-2"><Target className="w-3.5 h-3.5" />核心推荐路径</h4>
                 <div className="space-y-2 relative z-10">
                   {simulation.aiStrategyReport.corePathways.length > 0 ? simulation.aiStrategyReport.corePathways.map((path: string, idx: number) => (
                     <div key={idx} className="text-sm font-semibold text-emerald-400 border-l-2 border-emerald-500/40 pl-3 py-1 bg-emerald-500/[0.03]">
                       {path}
                     </div>
                   )) : <div className="text-sm text-slate-500">（无有效路径满足利润阈值）</div>}
                 </div>
               </div>
               <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex justify-between items-center group overflow-hidden relative">
                 <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:opacity-20 transition-opacity"><TrendingUp className="w-16 h-16 text-rose-500" /></div>
                 <div className="relative z-10">
                   <h4 className="text-[11px] uppercase tracking-[0.2em] text-rose-400/80 mb-1">本期操作期望净收益</h4>
                   <p className="text-2xl font-bold font-mono text-rose-300 drop-shadow-[0_0_10px_rgba(244,63,94,0.4)]">{simulation.aiStrategyReport.estimatedReturn}</p>
                 </div>
               </div>
            </div>
            
            <div className="space-y-4 lg:col-span-2">
               <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 h-full relative">
                 <h4 className="text-[11px] uppercase tracking-[0.2em] text-cyan-500 mb-4 flex items-center gap-2"><MapIcon className="w-3.5 h-3.5" />行情全景诊断纪要</h4>
                 <p className="text-sm text-slate-300 leading-relaxed mb-4">
                   {simulation.aiStrategyReport.marketAnalysis}
                 </p>
                 <div className="h-[1px] w-full bg-white/5 my-4"></div>
                 <p className="text-sm text-slate-300 leading-relaxed mb-4">
                   {simulation.aiStrategyReport.profitPrediction}
                 </p>
                 <div className="mt-4 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-medium shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-start gap-2">
                   <span className="shrink-0 text-xl">🎯</span> <span><strong className="text-emerald-200">执行建议：</strong>{simulation.aiStrategyReport.recommendedAction}</span>
                 </div>
               </div>
            </div>
          </div>
        </TechPanel>
      )}

      {/* AI Role Tasks */}
      <div className="mb-10">
         <h4 className="text-sm font-semibold tracking-wide text-white mb-4 flex items-center gap-2 px-2">
             <BrainCircuit className="h-5 w-5 text-violet-400" />
             {t("spatialArbitrage.tasksTitle")}
         </h4>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Purchasing */}
             <TechPanel className="p-5 rounded-[20px] bg-[linear-gradient(to_bottom,rgba(6,14,30,0.8),rgba(10,25,50,0.9))] border-t-cyan-500/30">
               <div className="flex items-center gap-3 mb-4">
                 <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-bold border border-cyan-500/20">采</div>
                 <div>
                   <p className="text-sm font-bold text-white">采购经理</p>
                   <p className="text-[10px] uppercase tracking-wider text-slate-500">供应链负责人</p>
                 </div>
               </div>
               <div className="space-y-3">
                 {aiPending && !aiTasks ? <PulseLines /> : aiTasks?.purchasing.map((t, i) => (
                   <p key={i} className="text-[12px] text-slate-300 flex items-start gap-2">
                     <span className="text-cyan-500 shrink-0">→</span> {t}
                   </p>
                 ))}
               </div>
             </TechPanel>

             {/* Logistics */}
             <TechPanel className="p-5 rounded-[20px] bg-[linear-gradient(to_bottom,rgba(6,14,30,0.8),rgba(10,35,30,0.9))] border-t-emerald-500/30">
               <div className="flex items-center gap-3 mb-4">
                 <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/20">调</div>
                 <div>
                   <p className="text-sm font-bold text-white">物流调度</p>
                   <p className="text-[10px] uppercase tracking-wider text-slate-500">运输网络管理</p>
                 </div>
               </div>
               <div className="space-y-3">
                 {aiPending && !aiTasks ? <PulseLines /> : aiTasks?.logistics.map((t, i) => (
                   <p key={i} className="text-[12px] text-slate-300 flex items-start gap-2">
                     <span className="text-emerald-500 shrink-0">→</span> {t}
                   </p>
                 ))}
               </div>
             </TechPanel>

             {/* Sales */}
             <TechPanel className="p-5 rounded-[20px] bg-[linear-gradient(to_bottom,rgba(6,14,30,0.8),rgba(40,25,10,0.9))] border-t-amber-500/30">
               <div className="flex items-center gap-3 mb-4">
                 <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold border border-amber-500/20">销</div>
                 <div>
                   <p className="text-sm font-bold text-white">销售团队</p>
                   <p className="text-[10px] uppercase tracking-wider text-slate-500">目的地市场开拓</p>
                 </div>
               </div>
               <div className="space-y-3">
                 {aiPending && !aiTasks ? <PulseLines /> : aiTasks?.sales.map((t, i) => (
                   <p key={i} className="text-[12px] text-slate-300 flex items-start gap-2">
                     <span className="text-amber-500 shrink-0">→</span> {t}
                   </p>
                 ))}
               </div>
             </TechPanel>

             {/* Risk */}
             <TechPanel className="p-5 rounded-[20px] bg-[linear-gradient(to_bottom,rgba(6,14,30,0.8),rgba(40,10,20,0.9))] border-t-rose-500/30">
               <div className="flex items-center gap-3 mb-4">
                 <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 font-bold border border-rose-500/20">控</div>
                 <div>
                   <p className="text-sm font-bold text-white">风控&数据</p>
                   <p className="text-[10px] uppercase tracking-wider text-slate-500">AI支持中心</p>
                 </div>
               </div>
               <div className="space-y-3">
                 {aiPending && !aiTasks ? <PulseLines /> : aiTasks?.risk.map((t, i) => (
                   <p key={i} className="text-[12px] text-slate-300 flex items-start gap-2">
                     <span className="text-rose-500 shrink-0">→</span> {t}
                   </p>
                 ))}
               </div>
             </TechPanel>
         </div>
      </div>
    </PlatformShell>
  );
}

function PulseLines() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-2 w-3/4 bg-white/10 rounded-full"></div>
      <div className="h-2 w-full bg-white/10 rounded-full"></div>
      <div className="h-2 w-5/6 bg-white/10 rounded-full"></div>
    </div>
  );
}
