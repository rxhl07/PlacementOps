import { prisma } from '../config/prisma';

export interface AuditLogInput {
    userId?: string;
    action: string;
    entity: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    reason?: string;
}

export class AuditService {
    static async log(input: AuditLogInput) {
        try {
            return await prisma.auditLog.create({
                data: {
                    userId: input.userId,
                    action: input.action,
                    entity: input.entity,
                    entityId: input.entityId,
                    oldValues: input.oldValues ? JSON.parse(JSON.stringify(input.oldValues)) : undefined,
                    newValues: input.newValues ? JSON.parse(JSON.stringify(input.newValues)) : undefined,
                    reason: input.reason,
                },
            });
        } catch (err) {
            console.error('[Audit Log Error]: Failed to write audit record', err);
        }
    }
}