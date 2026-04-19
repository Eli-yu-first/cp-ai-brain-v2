import { listDispatchReceiptsByBatch, listPersistedAuditLogs } from './server/db.ts';

const batchCode = process.argv[2] || 'CP-PK-240418-A1';

const receipts = await listDispatchReceiptsByBatch(batchCode);
const audits = await listPersistedAuditLogs();

const relatedAudits = audits.filter((item) =>
  item.entityId === batchCode || item.entityId.includes(batchCode) || item.entityType === 'DispatchPlan' || item.entityType === 'DispatchOrder',
);

console.log(
  JSON.stringify(
    {
      batchCode,
      receiptOrderCount: receipts.length,
      receiptSummary: receipts.map((item) => ({
        orderId: item.orderId,
        currentStatus: item.currentStatus,
        priority: item.priority,
        receiptCount: item.receipts.length,
        latestReceipt: item.receipts[0]
          ? {
              role: item.receipts[0].role,
              status: item.receipts[0].status,
              etaMinutes: item.receipts[0].etaMinutes,
              updatedAt: item.receipts[0].updatedAt,
            }
          : null,
      })),
      relatedAuditCount: relatedAudits.length,
      latestAudits: relatedAudits.slice(0, 5).map((item) => ({
        id: item.id,
        actionType: item.actionType,
        entityType: item.entityType,
        entityId: item.entityId,
        operatorName: item.operatorName,
        status: item.status,
        createdAt: item.createdAt,
      })),
    },
    null,
    2,
  ),
);
