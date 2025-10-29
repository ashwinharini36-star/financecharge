import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.product.findMany({
      where: { org_id: orgId },
      include: { prices: true },
      orderBy: { name: 'asc' },
    });
  }
}
