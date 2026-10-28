import { auditLogs } from "../db/schema";
import type { Transaction } from "./db";

export interface WriteAuditParams {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
}

/**
 * Writes an append-only audit log row within the caller's active database transaction.
 * 
 * FRS §13 & Non-negotiable Rule #5:
 * Must be executed in the SAME transaction as the change it records to guarantee atomicity.
 * The audit_logs table is guarded by a PostgreSQL trigger preventing UPDATE or DELETE.
 */
export async function writeAudit(
  tx: Transaction,
  params: WriteAuditParams
): Promise<void> {
  await tx.insert(auditLogs).values({
    actorId: params.actorId ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    oldValue: params.oldValue !== undefined ? params.oldValue : null,
    newValue: params.newValue !== undefined ? params.newValue : null,
    reason: params.reason ?? null,
    metadata: params.metadata !== undefined ? params.metadata : null,
    ipAddress: params.ipAddress ?? null,
  });
}

