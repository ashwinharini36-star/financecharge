import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    
    // Add middleware for tenant isolation
    this.$use(async (params, next) => {
      // Skip tenant isolation for certain models
      const skipTenantModels = ['Organization', 'User'];
      
      if (!skipTenantModels.includes(params.model)) {
        // Ensure org_id is always included in where clause
        if (params.action === 'findMany' || params.action === 'findFirst') {
          if (!params.args.where?.org_id) {
            throw new Error('org_id is required for tenant isolation');
          }
        }
        
        if (params.action === 'create' || params.action === 'createMany') {
          if (!params.args.data?.org_id) {
            throw new Error('org_id is required for tenant isolation');
          }
        }
        
        if (params.action === 'update' || params.action === 'updateMany' || params.action === 'delete' || params.action === 'deleteMany') {
          if (!params.args.where?.org_id) {
            throw new Error('org_id is required for tenant isolation');
          }
        }
      }
      
      return next(params);
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
