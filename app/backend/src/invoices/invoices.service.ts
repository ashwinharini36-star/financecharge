import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InvoicesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(orgId: string, kind?: string, status?: string) {
    const where: any = { org_id: orgId };
    if (kind) where.kind = kind;
    if (status) where.status = status;

    return this.prisma.invoice.findMany({
      where,
      include: {
        customer: true,
        vendor: true,
        lines: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(orgId: string, id: string) {
    return this.prisma.invoice.findFirst({
      where: { id, org_id: orgId },
      include: {
        customer: true,
        vendor: true,
        lines: true,
        payment_applications: {
          include: { payment: true },
        },
      },
    });
  }

  async send(orgId: string, userId: string, id: string) {
    const invoice = await this.findOne(orgId, id);
    
    if (!invoice || invoice.kind !== 'AR') {
      throw new Error('Invoice not found or not an AR invoice');
    }

    // Generate payment links
    const paymentLinks = {
      upi: `upi://pay?pa=merchant@upi&pn=Demo Corp&am=${invoice.total / 100}&cu=INR&tn=Invoice ${invoice.id}`,
      pg: `https://checkout.stripe.com/pay/invoice_${invoice.id}`,
      bank: `NEFT: Account 123456789, IFSC: DEMO0001, Ref: INV-${invoice.id}`,
    };

    // Update invoice status
    const updatedInvoice = await this.prisma.invoice.update({
      where: { id, org_id: orgId },
      data: { status: 'issued' },
    });

    await this.auditService.log(orgId, userId, 'Invoice', id, 'SEND', invoice, updatedInvoice);
    
    this.eventEmitter.emit('invoice.sent', { 
      invoiceId: id, 
      orgId, 
      paymentLinks 
    });

    return { invoice: updatedInvoice, paymentLinks };
  }
}
