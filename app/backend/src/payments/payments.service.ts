import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private eventEmitter: EventEmitter2,
  ) {}

  async processWebhook(provider: string, payload: any) {
    // Store webhook event
    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        org_id: 'system', // Will be determined from payment data
        provider,
        event_type: payload.type || 'payment',
        payload_json: payload,
      },
    });

    // Process payment based on provider
    let paymentData;
    if (provider === 'stripe') {
      paymentData = this.parseStripeWebhook(payload);
    } else if (provider === 'razorpay') {
      paymentData = this.parseRazorpayWebhook(payload);
    }

    if (paymentData) {
      await this.reconcilePayment(paymentData);
      
      // Mark webhook as processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { processed_at: new Date() },
      });
    }

    return { status: 'processed' };
  }

  private parseStripeWebhook(payload: any) {
    // Stub implementation
    return {
      amount: payload.amount || 10000, // 100.00 INR
      currency: 'INR',
      external_ref: payload.id || 'stripe_test_123',
      customer_email: payload.customer_email || 'test@example.com',
    };
  }

  private parseRazorpayWebhook(payload: any) {
    // Stub implementation
    return {
      amount: payload.amount || 10000,
      currency: 'INR',
      external_ref: payload.payment_id || 'rzp_test_123',
      customer_email: payload.email || 'test@example.com',
    };
  }

  private async reconcilePayment(paymentData: any) {
    // Find matching invoices using fuzzy logic
    const candidateInvoices = await this.prisma.invoice.findMany({
      where: {
        kind: 'AR',
        status: { in: ['issued', 'partially_paid'] },
        total: { gte: paymentData.amount - 100, lte: paymentData.amount + 100 }, // ±1 INR tolerance
      },
      include: { customer: true },
    });

    // Score candidates
    const scoredCandidates = candidateInvoices.map(invoice => ({
      invoice,
      score: this.calculateMatchScore(invoice, paymentData),
    })).filter(c => c.score > 0.7).sort((a, b) => b.score - a.score);

    if (scoredCandidates.length > 0) {
      const bestMatch = scoredCandidates[0].invoice;
      
      // Create payment record
      const payment = await this.prisma.payment.create({
        data: {
          org_id: bestMatch.org_id,
          direction: 'in',
          method: 'pg',
          amount: paymentData.amount,
          currency: paymentData.currency,
          received_on: new Date(),
          external_ref: paymentData.external_ref,
        },
      });

      // Apply payment to invoice
      await this.prisma.paymentApplication.create({
        data: {
          payment_id: payment.id,
          invoice_id: bestMatch.id,
          amount_applied: paymentData.amount,
        },
      });

      // Update invoice status
      const totalPaid = await this.prisma.paymentApplication.aggregate({
        where: { invoice_id: bestMatch.id },
        _sum: { amount_applied: true },
      });

      const newStatus = totalPaid._sum.amount_applied >= bestMatch.total ? 'paid' : 'partially_paid';
      
      await this.prisma.invoice.update({
        where: { id: bestMatch.id },
        data: { status: newStatus },
      });

      await this.auditService.log(
        bestMatch.org_id, 
        null, 
        'Payment', 
        payment.id, 
        'AUTO_RECONCILE', 
        null, 
        { payment, invoice: bestMatch, score: scoredCandidates[0].score }
      );

      this.eventEmitter.emit('payment.reconciled', {
        paymentId: payment.id,
        invoiceId: bestMatch.id,
        orgId: bestMatch.org_id,
        score: scoredCandidates[0].score,
      });
    }
  }

  private calculateMatchScore(invoice: any, paymentData: any): number {
    let score = 0;

    // Amount match (exact = 1.0, within tolerance = 0.8)
    if (invoice.total === paymentData.amount) {
      score += 0.6;
    } else if (Math.abs(invoice.total - paymentData.amount) <= 100) {
      score += 0.4;
    }

    // Customer email match
    if (invoice.customer?.email === paymentData.customer_email) {
      score += 0.3;
    }

    // Date proximity (recent invoices score higher)
    const daysSinceIssued = Math.floor((Date.now() - invoice.created_at.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceIssued <= 7) score += 0.1;

    return Math.min(score, 1.0);
  }
}
