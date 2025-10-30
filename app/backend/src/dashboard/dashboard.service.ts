import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getCashPulse(orgId: string) {
    // Total AR (outstanding receivables)
    const totalAR = await this.prisma.invoice.aggregate({
      where: {
        org_id: orgId,
        kind: 'AR',
        status: { in: ['issued', 'partially_paid'] },
      },
      _sum: { total: true },
    });

    // Overdue AR
    const overdueAR = await this.prisma.invoice.aggregate({
      where: {
        org_id: orgId,
        kind: 'AR',
        status: { in: ['issued', 'partially_paid'] },
        due_date: { lt: new Date() },
      },
      _sum: { total: true },
    });

    // AP due in 7 days
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    
    const apDue7d = await this.prisma.invoice.aggregate({
      where: {
        org_id: orgId,
        kind: 'AP',
        status: { in: ['issued'] },
        due_date: { lte: sevenDaysFromNow },
      },
      _sum: { total: true },
    });

    // Cash position (simplified - total payments in minus payments out)
    const paymentsIn = await this.prisma.payment.aggregate({
      where: { org_id: orgId, direction: 'in' },
      _sum: { amount: true },
    });

    const paymentsOut = await this.prisma.payment.aggregate({
      where: { org_id: orgId, direction: 'out' },
      _sum: { amount: true },
    });

    const cashPosition = (paymentsIn._sum.amount || 0) - (paymentsOut._sum.amount || 0);

    // Daily net cash for last 30 days (mock data for now)
    const dailyNetCash = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        amount: Math.floor(Math.random() * 100000) - 50000, // Random between -50k to +50k
      };
    });

    return {
      total_ar: totalAR._sum.total || 0,
      overdue_ar: overdueAR._sum.total || 0,
      ap_due_7d: apDue7d._sum.total || 0,
      cash_position: cashPosition,
      daily_net_cash: dailyNetCash,
    };
  }
}
