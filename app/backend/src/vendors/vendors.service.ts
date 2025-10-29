import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VendorsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.vendor.findMany({
      where: { org_id: orgId },
      orderBy: { created_at: 'desc' },
    });
  }
}
