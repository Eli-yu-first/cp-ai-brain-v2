import { trpc } from "@/lib/trpc";
import { TechPanel } from "@/components/platform/PlatformPrimitives";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Target, LayoutDashboard, Search, Sparkles, Navigation2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function GlobalOptimizationPage() {
  const { t } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);

  // tRPC data fetch
  const { data: simulation, isLoading, refetch } = trpc.platform.globalOptimizationSimulate.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const handleRunOptimization = () => {
    setIsRunning(true);
    setTimeout(() => {
      refetch().then(() => setIsRunning(false));
    }, 1500); // UI visual delay for complex calculation
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Title Area */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
          <Target className="h-8 w-8 text-indigo-400" />
          全链最优化调度 / Global Optimization
        </h1>
        <p className="text-slate-400 text-sm max-w-4xl">
          打破简单的线性定产思维。系统导入【农场出栏】、【工厂处理能力】、【产线转化率(BOM)】与【终端真实订单】等十余张约束表格，
          采用先进的多目标混合规划与反向拉动贪心算法，自动为您推演出全局综合利用率最高、利润绝对值极值化的最佳资源分配图。
        </p>
      </div>

      <div className="flex gap-4">
        <Button 
          onClick={handleRunOptimization} 
          disabled={isRunning || isLoading}
          size="lg"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-all"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
               <Sparkles className="h-4 w-4 animate-spin" />
               正在解析拉动式排产...
            </span>
          ) : (
            <span className="flex items-center gap-2">
               <Calculator className="h-4 w-4" />
               执行最具性价比最优排产运算
            </span>
          )}
        </Button>
      </div>

      {simulation && !isRunning && (
         <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            
            {/* Left side: AI Agent Actions */}
            <div className="space-y-6">
               <TechPanel className="p-6 rounded-[24px]">
                 <div className="flex items-center gap-2 mb-4">
                   <Sparkles className="h-5 w-5 text-indigo-400" />
                   <h2 className="text-lg font-bold text-slate-200">AI 运筹大语言模型解析</h2>
                 </div>
                 
                 <Alert className="bg-indigo-950/40 border-indigo-500/30 text-indigo-200 mb-6 rounded-xl">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    <AlertTitle>运筹洞察总结 (Insight)</AlertTitle>
                    <AlertDescription className="mt-2 text-indigo-100/90 leading-relaxed font-medium">
                      {simulation.agentDraft.insight}
                    </AlertDescription>
                 </Alert>

                 <h3 className="text-sm font-semibold text-slate-400 mb-3 px-1 uppercase tracking-wider">智能协同工单派发路线</h3>
                 <div className="space-y-3">
                   <AnimatePresence>
                      {simulation.agentDraft.decision.map((task, idx) => (
                         <motion.div 
                           key={idx}
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ delay: idx * 0.15 }}
                           className={`p-4 rounded-xl border ${task.isHighPriority ? 'bg-orange-500/10 border-orange-500/30' : 'bg-slate-800/40 border-slate-700/50'}`}
                         >
                            <div className="flex justify-between items-center mb-2">
                               <div className="flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${task.isHighPriority ? 'bg-orange-500 text-white shadow-[0_0_8px_rgba(249,115,22,0.8)]' : 'bg-slate-700 text-slate-300'}`}>
                                     {task.target}
                                  </span>
                                  <span className="text-sm font-semibold text-slate-200">{task.role}</span>
                               </div>
                               {task.isHighPriority && <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-ping"></span>}
                            </div>
                            <p className="text-xs text-slate-400 font-mono leading-relaxed">{task.action}</p>
                         </motion.div>
                      ))}
                   </AnimatePresence>
                 </div>
               </TechPanel>

               <TechPanel className="p-6 rounded-[24px] bg-emerald-950/20 border-emerald-500/20">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3">多目标综合利润计分卡</h3>
                  <div className="flex flex-col items-center justify-center py-6">
                     <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">全局预期净利润 (剔除折旧、人工、物流后)</p>
                     <p className="text-5xl font-mono tracking-tighter text-emerald-300 shadow-emerald-500/20 drop-shadow-md">
                        <span className="text-2xl mr-2 text-emerald-500/50">¥</span>
                        {simulation.results.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                     </p>
                  </div>
               </TechPanel>
            </div>

            {/* Right side: Detail Output Tables */}
            <div className="space-y-6">
                <TechPanel className="p-0 overflow-hidden rounded-[24px] border border-white/[0.08]">
                   <div className="p-4 border-b border-white/[0.08] bg-slate-900/50">
                      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                         <LayoutDashboard className="h-4 w-4 text-cyan-400" />
                         利润表 (核心财务分配明细)
                      </h3>
                   </div>
                   <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                     <table className="w-full text-left text-xs whitespace-nowrap text-slate-300">
                        <thead className="bg-[#0b1426] sticky top-0 z-10 text-slate-400 backdrop-blur-md">
                           <tr>
                             <th className="px-4 py-3 font-medium">工厂ID</th>
                             <th className="px-4 py-3 font-medium">目标省份</th>
                             <th className="px-4 py-3 font-medium">部位</th>
                             <th className="px-4 py-3 font-medium text-right">销量(kg)</th>
                             <th className="px-4 py-3 font-medium text-right">单价</th>
                             <th className="px-4 py-3 font-medium text-right">收入</th>
                             <th className="px-4 py-3 font-medium text-right">净利润</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.04]">
                           {simulation.results.profitSheet.map((row, i) => (
                             <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                               <td className="px-4 py-2.5 font-mono text-cyan-200/80">{row.factoryId}</td>
                               <td className="px-4 py-2.5">{row.destProvince}</td>
                               <td className="px-4 py-2.5">{row.part}</td>
                               <td className="px-4 py-2.5 text-right font-mono">{row.salesQty.toLocaleString()}</td>
                               <td className="px-4 py-2.5 text-right font-mono">{row.price.toFixed(2)}</td>
                               <td className="px-4 py-2.5 text-right font-mono text-slate-200">{row.salesRevenue.toLocaleString()}</td>
                               <td className="px-4 py-2.5 text-right font-mono text-emerald-400 font-bold">{row.profit.toLocaleString()}</td>
                             </tr>
                           ))}
                           {simulation.results.profitSheet.length === 0 && (
                             <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">空 (暂无成功排产分配)</td></tr>
                           )}
                        </tbody>
                     </table>
                   </div>
                </TechPanel>

                <div className="grid grid-cols-2 gap-6">
                   <TechPanel className="p-0 overflow-hidden rounded-[24px]">
                       <div className="p-4 border-b border-white/[0.08] bg-slate-900/50">
                          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                             <Search className="h-4 w-4 text-orange-400" />
                             发现的短板 (瓶颈) 记录
                          </h3>
                       </div>
                       <ul className="divide-y divide-white/[0.04] p-2 max-h-[200px] overflow-y-auto">
                          {simulation.results.bottlenecks.map((bn, i) => (
                             <li key={i} className="p-3">
                                <div className="text-xs flex justify-between text-slate-400">
                                   <span>{bn.factoryId}</span>
                                   <span>第 {bn.month} 月</span>
                                </div>
                                <div className="mt-1 flex items-center gap-2">
                                   <span className="text-sm text-red-400 font-medium">{bn.type}</span>
                                   <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded">Utilized 100%</span>
                                </div>
                             </li>
                          ))}
                          {simulation.results.bottlenecks.length === 0 && (
                             <div className="p-4 text-center text-slate-500 text-xs">无容量瓶颈</div>
                          )}
                       </ul>
                   </TechPanel>

                   <TechPanel className="p-0 overflow-hidden rounded-[24px]">
                       <div className="p-4 border-b border-white/[0.08] bg-slate-900/50">
                          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                             <Navigation2 className="h-4 w-4 text-blue-400" />
                             销售工单表 (白条/部件)
                          </h3>
                       </div>
                       <ul className="divide-y divide-white/[0.04] p-2 max-h-[200px] overflow-y-auto text-xs">
                          {simulation.results.salesSheet.map((s, i) => (
                             <li key={i} className="p-3 hover:bg-white/[0.02]">
                                <div className="flex justify-between text-slate-300 font-medium">
                                   <span>{s.customerType} [{s.destProvince}]</span>
                                   <span className="text-cyan-300 font-mono">{s.orderQty.toLocaleString()} kg</span>
                                </div>
                                <div className="text-slate-500 mt-1 flex justify-between">
                                  <span>{s.part} (供: {s.factoryId})</span>
                                  <span>¥{s.price}/kg</span>
                                </div>
                             </li>
                          ))}
                          {simulation.results.salesSheet.length === 0 && (
                             <div className="p-4 text-center text-slate-500 text-xs">无部件销售</div>
                          )}
                       </ul>
                   </TechPanel>
                </div>

            </div>

         </div>
      )}
    </div>
  );
}
