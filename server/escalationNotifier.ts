import { notifyOwner } from "./_core/notification";
import { ENV } from "./_core/env";
import { recordNotificationDelivery } from "./db";
import type { AiAlertItem, DispatchWorkOrder } from "./aiDecision";

export type EscalationNotificationInput = {
  batchCode: string;
  overview: string;
  alerts: AiAlertItem[];
  workOrders: DispatchWorkOrder[];
};

export type EscalationNotificationResult = {
  wecom: "sent" | "failed" | "skipped";
  sms: "sent" | "failed" | "skipped";
  owner: "sent" | "failed" | "skipped";
};

function buildMessage(input: EscalationNotificationInput) {
  const redAlerts = input.alerts.filter(item => item.status === "red");
  const alertSummary = redAlerts
    .map(item => `${item.title}（负责人：${item.actionOwner}，预计损失：¥${item.estimatedLoss.toLocaleString()}）`)
    .join("；");
  const workOrderSummary = input.workOrders
    .map(item => `${item.factory}/${item.orderId}/${item.priority}`)
    .join("，");

  const title = `CP AI Brain 告警升级：${input.batchCode}`;
  const content = [
    `批次：${input.batchCode}`,
    `概览：${input.overview}`,
    `红色预警：${alertSummary || "无"}`,
    `派单：${workOrderSummary || "无"}`,
  ].join("\n");

  return { title, content };
}

async function sendWecom(title: string, content: string, alertId?: string, orderId?: string) {
  if (!ENV.wecomBotWebhookUrl) {
    await recordNotificationDelivery({
      channel: "wecom",
      relatedAlertId: alertId,
      relatedOrderId: orderId,
      targetLabel: "wecom:webhook",
      payloadSummary: `${title}\n${content}`,
      deliveryStatus: "skipped",
      errorMessage: "WECOM_BOT_WEBHOOK_URL 未配置",
    });
    return "skipped" as const;
  }

  try {
    const mentionedMobileList = ENV.wecomMentionedMobiles
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);

    const response = await fetch(ENV.wecomBotWebhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        msgtype: "markdown",
        markdown: {
          content: `### ${title}\n${content.replace(/\n/g, "\n> ")}`,
        },
        mentioned_mobile_list: mentionedMobileList,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      await recordNotificationDelivery({
        channel: "wecom",
        relatedAlertId: alertId,
        relatedOrderId: orderId,
        targetLabel: "wecom:webhook",
        payloadSummary: `${title}\n${content}`,
        deliveryStatus: "failed",
        errorMessage: detail || `${response.status} ${response.statusText}`,
      });
      return "failed" as const;
    }

    await recordNotificationDelivery({
      channel: "wecom",
      relatedAlertId: alertId,
      relatedOrderId: orderId,
      targetLabel: "wecom:webhook",
      payloadSummary: `${title}\n${content}`,
      deliveryStatus: "sent",
      sentAt: new Date(),
    });
    return "sent" as const;
  } catch (error) {
    await recordNotificationDelivery({
      channel: "wecom",
      relatedAlertId: alertId,
      relatedOrderId: orderId,
      targetLabel: "wecom:webhook",
      payloadSummary: `${title}\n${content}`,
      deliveryStatus: "failed",
      errorMessage: error instanceof Error ? error.message : "未知错误",
    });
    return "failed" as const;
  }
}

async function sendSms(title: string, content: string, alertId?: string, orderId?: string) {
  if (!ENV.smsApiUrl || !ENV.smsApiKey || !ENV.smsTargets) {
    await recordNotificationDelivery({
      channel: "sms",
      relatedAlertId: alertId,
      relatedOrderId: orderId,
      targetLabel: ENV.smsTargets || "sms:targets",
      payloadSummary: `${title}\n${content}`,
      deliveryStatus: "skipped",
      errorMessage: "SMS_API_URL / SMS_API_KEY / SMS_TARGETS 未完整配置",
    });
    return "skipped" as const;
  }

  try {
    const response = await fetch(ENV.smsApiUrl, {
      method: "POST",
      headers: {
        authorization: `Bearer ${ENV.smsApiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        targets: ENV.smsTargets
          .split(",")
          .map(item => item.trim())
          .filter(Boolean),
        title,
        message: content,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      await recordNotificationDelivery({
        channel: "sms",
        relatedAlertId: alertId,
        relatedOrderId: orderId,
        targetLabel: ENV.smsTargets,
        payloadSummary: `${title}\n${content}`,
        deliveryStatus: "failed",
        errorMessage: detail || `${response.status} ${response.statusText}`,
      });
      return "failed" as const;
    }

    await recordNotificationDelivery({
      channel: "sms",
      relatedAlertId: alertId,
      relatedOrderId: orderId,
      targetLabel: ENV.smsTargets,
      payloadSummary: `${title}\n${content}`,
      deliveryStatus: "sent",
      sentAt: new Date(),
    });
    return "sent" as const;
  } catch (error) {
    await recordNotificationDelivery({
      channel: "sms",
      relatedAlertId: alertId,
      relatedOrderId: orderId,
      targetLabel: ENV.smsTargets || "sms:targets",
      payloadSummary: `${title}\n${content}`,
      deliveryStatus: "failed",
      errorMessage: error instanceof Error ? error.message : "未知错误",
    });
    return "failed" as const;
  }
}

async function sendOwner(title: string, content: string, alertId?: string, orderId?: string) {
  try {
    const success = await notifyOwner({ title, content });
    await recordNotificationDelivery({
      channel: "owner",
      relatedAlertId: alertId,
      relatedOrderId: orderId,
      targetLabel: "owner",
      payloadSummary: `${title}\n${content}`,
      deliveryStatus: success ? "sent" : "failed",
      errorMessage: success ? undefined : "notifyOwner 返回失败",
      sentAt: success ? new Date() : undefined,
    });
    return success ? ("sent" as const) : ("failed" as const);
  } catch (error) {
    await recordNotificationDelivery({
      channel: "owner",
      relatedAlertId: alertId,
      relatedOrderId: orderId,
      targetLabel: "owner",
      payloadSummary: `${title}\n${content}`,
      deliveryStatus: "failed",
      errorMessage: error instanceof Error ? error.message : "未知错误",
    });
    return "failed" as const;
  }
}

export async function sendEscalationNotifications(
  input: EscalationNotificationInput,
): Promise<EscalationNotificationResult> {
  const { title, content } = buildMessage(input);
  const primaryAlert = input.alerts.find(item => item.status === "red")?.alertId;
  const primaryOrder = input.workOrders[0]?.orderId;

  const [wecom, sms, owner] = await Promise.all([
    sendWecom(title, content, primaryAlert, primaryOrder),
    sendSms(title, content, primaryAlert, primaryOrder),
    sendOwner(title, content, primaryAlert, primaryOrder),
  ]);

  return { wecom, sms, owner };
}
