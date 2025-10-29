import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    orgId: string,
    actorId: string | null,
    entityType: string,
    entityId: string,
    action: string,
    oldValues?: any,
    newValues?: any,
  ) {
    const diffJson = this.createDiff(oldValues, newValues);

    return this.prisma.auditLog.create({
      data: {
        org_id: orgId,
        actor_id: actorId,
        entity_type: entityType,
        entity_id: entityId,
        action,
        diff_json: diffJson,
      },
    });
  }

  private createDiff(oldValues: any, newValues: any) {
    if (!oldValues && !newValues) return null;
    
    return {
      old: oldValues,
      new: newValues,
      timestamp: new Date().toISOString(),
    };
  }

  async getEntityAuditLog(orgId: string, entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        org_id: orgId,
        entity_type: entityType,
        entity_id: entityId,
      },
      include: {
        actor: {
          select: { id: true, email: true, role: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
