import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class QuotesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(orgId: string, userId: string, createQuoteDto: CreateQuoteDto) {
    // Calculate totals
    let subtotal = 0;
    let discountTotal = 0;

    for (const item of createQuoteDto.items) {
      const lineTotal = item.qty * item.unit_amount;
      const lineDiscount = lineTotal * (item.discount_percent / 100);
      subtotal += lineTotal;
      discountTotal += lineDiscount;
    }

    const tax = Math.round((subtotal - discountTotal) * 0.18); // 18% GST
    const total = subtotal - discountTotal + tax;

    const quote = await this.prisma.quote.create({
      data: {
        org_id: orgId,
        customer_id: createQuoteDto.customer_id,
        currency: createQuoteDto.currency,
        subtotal,
        tax,
        discount_total: discountTotal,
        total,
        items: {
          create: createQuoteDto.items,
        },
      },
      include: {
        items: {
          include: { product: true },
        },
        customer: true,
      },
    });

    await this.auditService.log(orgId, userId, 'Quote', quote.id, 'CREATE', null, quote);
    
    this.eventEmitter.emit('quote.created', { quoteId: quote.id, orgId });

    return quote;
  }

  async findAll(orgId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [quotes, total] = await Promise.all([
      this.prisma.quote.findMany({
        where: { org_id: orgId },
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.quote.count({ where: { org_id: orgId } }),
    ]);

    return { data: quotes, total, page, limit };
  }

  async findOne(orgId: string, id: string) {
    const quote = await this.prisma.quote.findFirst({
      where: { id, org_id: orgId },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    return quote;
  }

  async approve(orgId: string, userId: string, id: string) {
    const quote = await this.findOne(orgId, id);

    if (quote.status !== 'draft' && quote.status !== 'sent') {
      throw new ForbiddenException('Quote cannot be approved in current status');
    }

    const updatedQuote = await this.prisma.quote.update({
      where: { id, org_id: orgId },
      data: { status: 'approved' },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
      },
    });

    await this.auditService.log(orgId, userId, 'Quote', id, 'APPROVE', quote, updatedQuote);
    
    this.eventEmitter.emit('quote.approved', { quoteId: id, orgId });

    return updatedQuote;
  }

  async convertToInvoice(orgId: string, userId: string, id: string) {
    const quote = await this.findOne(orgId, id);

    if (quote.status !== 'approved') {
      throw new ForbiddenException('Only approved quotes can be converted to invoices');
    }

    // Create invoice from quote
    const invoice = await this.prisma.invoice.create({
      data: {
        org_id: orgId,
        customer_id: quote.customer_id,
        quote_id: quote.id,
        kind: 'AR',
        status: 'draft',
        currency: quote.currency,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        source: 'CPQ',
        lines: {
          create: quote.items.map(item => ({
            product_id: item.product_id,
            desc: item.product.name,
            qty: item.qty,
            unit_amount: item.unit_amount,
            tax_rate: 0.18,
          })),
        },
      },
      include: {
        lines: true,
        customer: true,
      },
    });

    await this.auditService.log(orgId, userId, 'Invoice', invoice.id, 'CREATE_FROM_QUOTE', null, invoice);
    
    this.eventEmitter.emit('invoice.created_from_quote', { 
      invoiceId: invoice.id, 
      quoteId: id, 
      orgId 
    });

    return invoice;
  }
}
