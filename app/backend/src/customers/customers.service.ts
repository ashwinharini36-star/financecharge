import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(orgId: string, userId: string, createCustomerDto: CreateCustomerDto) {
    const customer = await this.prisma.customer.create({
      data: {
        org_id: orgId,
        ...createCustomerDto,
      },
    });

    await this.auditService.log(orgId, userId, 'Customer', customer.id, 'CREATE', null, customer);
    return customer;
  }

  async findAll(orgId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where: { org_id: orgId },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.customer.count({ where: { org_id: orgId } }),
    ]);

    return { data: customers, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    return this.prisma.customer.findFirst({
      where: { id, org_id: orgId },
    });
  }
}
