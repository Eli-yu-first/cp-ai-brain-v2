export type MobileRole = "厂长" | "司机" | "仓储管理员";
export type MobileRoleStatus = "待确认" | "已接单" | "执行中" | "已完成" | "超时升级";

export type MobileRoleFeedback = {
  orderId: string;
  role: MobileRole;
  status: MobileRoleStatus;
  etaMinutes: number;
  note: string;
  priority: string;
};

export type MobileRoleAction = {
  label: string;
  status: "已接单" | "已完成" | "超时升级";
  tone: "neutral" | "success" | "danger";
};

export type MobileRoleViewModel = {
  tabLabel: string;
  modeTitle: string;
  modeEyebrow: string;
  summaryLabel: string;
  summaryValue: string;
  helperText: string;
  primaryMetricLabel: string;
  primaryMetricValue: string;
  secondaryMetricLabel: string;
  secondaryMetricValue: string;
  actions: MobileRoleAction[];
};

function formatCurrency(value: number) {
  return `¥${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function formatEta(language: string, minutes: number) {
  if (language === "en") {
    return `${minutes} min`;
  }
  return `${minutes} 分钟`;
}

export function getRoleStatusBadgeClass(status: MobileRoleStatus) {
  if (status === "超时升级") {
    return "border border-rose-400/20 bg-rose-400/10 text-rose-100";
  }
  if (status === "执行中") {
    return "border border-amber-400/20 bg-amber-400/10 text-amber-100";
  }
  return "border border-emerald-400/20 bg-emerald-400/10 text-emerald-100";
}

export function buildMobileRoleView(params: {
  language: string;
  role: MobileRole;
  feedback: MobileRoleFeedback;
  alertsCount: number;
  projectedPrice: number;
  incrementalProfit: number;
  workOrderCount: number;
}): MobileRoleViewModel {
  const { language, role, feedback, alertsCount, projectedPrice, incrementalProfit, workOrderCount } = params;
  const isEnglish = language === "en";

  if (role === "厂长") {
    return {
      tabLabel: isEnglish ? "Plant" : "厂长",
      modeTitle: isEnglish ? "Plant manager mode" : "厂长模式",
      modeEyebrow: isEnglish ? "Plant Control" : "厂长现场总控",
      summaryLabel: isEnglish ? "Alert overview" : "预警总览",
      summaryValue: isEnglish ? `${alertsCount} alerts / ${workOrderCount} orders` : `${alertsCount} 条预警 / ${workOrderCount} 张工单`,
      helperText: isEnglish
        ? "Review the highest-risk signal first, confirm the dispatch chain, and escalate immediately when execution drifts."
        : "优先查看最高风险预警，确认派单链路，并在执行偏离时立即升级处置。",
      primaryMetricLabel: isEnglish ? "Projected price" : "预测单价",
      primaryMetricValue: formatCurrency(projectedPrice),
      secondaryMetricLabel: isEnglish ? "Profit delta" : "利润偏差",
      secondaryMetricValue: formatCurrency(incrementalProfit),
      actions: [
        { label: isEnglish ? "Confirm work order" : "确认工单", status: "已接单", tone: "neutral" },
        { label: isEnglish ? "Escalate now" : "升级处置", status: "超时升级", tone: "danger" },
      ],
    };
  }

  if (role === "司机") {
    return {
      tabLabel: isEnglish ? "Driver" : "司机",
      modeTitle: isEnglish ? "Driver mode" : "司机模式",
      modeEyebrow: isEnglish ? "Route Dispatch" : "运输执行",
      summaryLabel: isEnglish ? "Delivery task" : "配送任务",
      summaryValue: isEnglish ? `ETA ${formatEta(language, feedback.etaMinutes)}` : `预计 ${formatEta(language, feedback.etaMinutes)} 到达`,
      helperText: isEnglish
        ? "Focus on route execution and receipt progress. Keep the order moving and close the signature as soon as delivery completes."
        : "聚焦路线执行与签收回执，先确认装车，再在送达后完成签收闭环。",
      primaryMetricLabel: isEnglish ? "Task status" : "任务状态",
      primaryMetricValue: feedback.status,
      secondaryMetricLabel: isEnglish ? "Work order" : "工单编号",
      secondaryMetricValue: feedback.orderId,
      actions: [
        { label: isEnglish ? "Confirm loading" : "确认装车", status: "已接单", tone: "neutral" },
        { label: isEnglish ? "Confirm delivery" : "签收完成", status: "已完成", tone: "success" },
        { label: isEnglish ? "Delay escalation" : "延误升级", status: "超时升级", tone: "danger" },
      ],
    };
  }

  return {
    tabLabel: isEnglish ? "Warehouse" : "仓储",
    modeTitle: isEnglish ? "Warehouse mode" : "仓储模式",
    modeEyebrow: isEnglish ? "Storage Receipt" : "仓储回执",
    summaryLabel: isEnglish ? "Inbound progress" : "入库进度",
    summaryValue: isEnglish ? `ETA ${formatEta(language, feedback.etaMinutes)}` : `入库 ETA ${formatEta(language, feedback.etaMinutes)}`,
    helperText: isEnglish
      ? "Track inbound completion, update storage status, and submit receipt confirmation once the pallet move is closed."
      : "跟进入库完成度，更新仓储状态，并在托盘回库闭环后提交回执确认。",
    primaryMetricLabel: isEnglish ? "Priority" : "优先级",
    primaryMetricValue: feedback.priority,
    secondaryMetricLabel: isEnglish ? "Receipt note" : "回执说明",
    secondaryMetricValue: feedback.note,
    actions: [
      { label: isEnglish ? "Confirm inbound" : "确认入库", status: "已接单", tone: "neutral" },
      { label: isEnglish ? "Submit receipt" : "回执完成", status: "已完成", tone: "success" },
      { label: isEnglish ? "Escalate delay" : "积压升级", status: "超时升级", tone: "danger" },
    ],
  };
}
