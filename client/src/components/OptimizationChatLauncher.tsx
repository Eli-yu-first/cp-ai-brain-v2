import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type {
  GlobalOptimizationAppliedParameter,
  GlobalOptimizationChatSuggestion,
  GlobalOptimizationSensitivityResult,
} from "@shared/globalOptimization";
import { Bot, MessageCircle, Sparkles } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "wouter";

type ChatResponsePayload = {
  userMessage: string;
  assistantMessage: string;
  suggestion: GlobalOptimizationChatSuggestion;
  appliedParameters: GlobalOptimizationAppliedParameter[];
  sensitivity: GlobalOptimizationSensitivityResult;
};

type OptimizationChatController = {
  isLoading: boolean;
  onSendMessage: (content: string) => Promise<ChatResponsePayload>;
};

type OptimizationChatContextValue = {
  controller: OptimizationChatController | null;
  setController: (controller: OptimizationChatController | null) => void;
};

const OptimizationChatContext = createContext<OptimizationChatContextValue>({
  controller: null,
  setController: () => undefined,
});

export function OptimizationChatProvider({ children }: { children: ReactNode }) {
  const [controller, setController] = useState<OptimizationChatController | null>(null);
  const value = useMemo(() => ({ controller, setController }), [controller]);
  return (
    <OptimizationChatContext.Provider value={value}>
      {children}
    </OptimizationChatContext.Provider>
  );
}

export function useOptimizationChat() {
  return useContext(OptimizationChatContext);
}

export function OptimizationChatLauncher() {
  const [location] = useLocation();
  const { controller } = useOptimizationChat();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "我是全链最优化调度智能助手。你可以直接告诉我业务目标，我会把自然语言转成结构化调参并自动预测。",
    },
  ]);
  const [latestPayload, setLatestPayload] = useState<ChatResponsePayload | null>(null);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!controller) return;
    setMessages((prev) => [...prev, { role: "user", content }]);
    const payload = await controller.onSendMessage(content);
    setMessages((prev) => [...prev, { role: "assistant", content: payload.assistantMessage }]);
    setLatestPayload(payload);
  }, [controller]);

  if (location !== "/global-optimization") return null;

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-indigo-600 text-white shadow-[0_0_30px_rgba(99,102,241,0.45)] hover:bg-indigo-500"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] border-white/[0.08] bg-[#091120] text-slate-100 p-0">
          <SheetHeader className="border-b border-white/[0.08] bg-slate-950/60">
            <SheetTitle className="flex items-center gap-2 text-slate-100">
              <Bot className="h-4 w-4 text-indigo-300" />
              智能决策助手
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              聊天内容会自动转成结构化 prompt，并联动输入参数与算法预测。
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 p-4 pt-0 overflow-hidden flex flex-col gap-4">
            <AIChatBox
              messages={messages}
              onSendMessage={(content) => {
                void handleSendMessage(content);
              }}
              isLoading={controller?.isLoading}
              height="100%"
              className="flex-1 border-white/[0.08] bg-slate-950/30"
              placeholder="例如：提高华东订单价格，并把河南屠宰产能下调10%"
              suggestedPrompts={[
                "提高华东高价部位售价，并看看利润变化",
                "降低运输成本 10%，重新预测瓶颈",
                "仓储压力太大，给我一个更保守的调参方案",
              ]}
            />
            {latestPayload && (
              <div className="rounded-2xl border border-white/[0.08] bg-slate-900/70 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                  <Sparkles className="h-4 w-4 text-indigo-300" />
                  本轮结构化建议
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{latestPayload.suggestion.structuredPrompt}</p>
                <div className="flex flex-wrap gap-2">
                  {latestPayload.suggestion.decisionFocus.map((item) => (
                    <Badge key={item} variant="secondary" className="bg-indigo-500/15 text-indigo-200 border-indigo-500/20">
                      {item}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <div className="text-slate-500">已应用参数</div>
                    <div className="mt-1 text-emerald-300 font-medium">{latestPayload.appliedParameters.length} 项</div>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <div className="text-slate-500">利润变化</div>
                    <div className={`mt-1 font-medium ${latestPayload.sensitivity.totalProfitDelta >= 0 ? "text-emerald-300" : "text-red-400"}`}>
                      {latestPayload.sensitivity.totalProfitDelta >= 0 ? "+" : ""}{latestPayload.sensitivity.totalProfitDelta.toFixed(0)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
