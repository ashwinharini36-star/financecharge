import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ApService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async ingestInvoice(orgId: string, userId: string, file: Express.Multer.File, vendorId?: string) {
    // OCR stub - extract data from PDF
    const ocrData = await this.performOCR(file);
    
    // Find or create vendor
    let vendor;
    if (vendorId) {
      vendor = await this.prisma.vendor.findFirst({
        where: { id: vendorId, org_id: orgId },
      });
    } else {
      // Try to find vendor by name from OCR
      vendor = await this.prisma.vendor.findFirst({
        where: { 
          org_id: orgId,
          name: { contains: ocrData.vendor_name, mode: 'insensitive' },
        },
      });
    }

    if (!vendor) {
      // Create new vendor
      vendor = await this.prisma.vendor.create({
        data: {
          org_id: orgId,
          name: ocrData.vendor_name,
          email: ocrData.vendor_email,
        },
      });
    }

    // Create draft AP invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        org_id: orgId,
        vendor_id: vendor.id,
        kind: 'AP',
        status: 'draft',
        currency: 'INR',
        subtotal: ocrData.subtotal,
        tax: ocrData.tax,
        total: ocrData.total,
        due_date: ocrData.due_date,
        source: 'Manual',
        po_number: ocrData.po_number,
        lines: {
          create: ocrData.line_items.map(item => ({
            desc: item.description,
            qty: item.quantity,
            unit_amount: item.unit_price,
            tax_rate: 0.18,
          })),
        },
      },
      include: {
        lines: true,
        vendor: true,
      },
    });

    // Store file blob
    await this.prisma.fileBlob.create({
      data: {
        org_id: orgId,
        object_key: `invoices/${invoice.id}/${file.originalname}`,
        mime: file.mimetype,
        size: file.size,
        sha256: 'mock_hash',
        linked_entity_type: 'Invoice',
        linked_entity_id: invoice.id,
      },
    });

    await this.auditService.log(orgId, userId, 'Invoice', invoice.id, 'INGEST', null, invoice);

    return invoice;
  }

  private async performOCR(file: Express.Multer.File) {
    // OCR stub - in real implementation, use AWS Textract or similar
    return {
      vendor_name: 'Acme Corp',
      vendor_email: 'billing@acme.com',
      subtotal: 10000, // 100.00 INR
      tax: 1800, // 18.00 INR
      total: 11800, // 118.00 INR
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      po_number: 'PO-2024-001',
      line_items: [
        {
          description: 'Professional Services',
          quantity: 1,
          unit_price: 10000,
        },
      ],
    };
  }

  async perform3WayMatch(orgId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, org_id: orgId },
      include: { lines: true },
    });

    if (!invoice || !invoice.po_number) {
      return { matched: false, discrepancies: ['No PO number found'] };
    }

    // 3-way match stub
    const poData = await this.fetchPOData(invoice.po_number);
    const grnData = await this.fetchGRNData(invoice.po_number);

    const discrepancies = [];

    // Amount check
    if (Math.abs(invoice.total - poData.total) > 100) {
      discrepancies.push(`Amount mismatch: Invoice ${invoice.total/100}, PO ${poData.total/100}`);
    }

    // Quantity check (simplified)
    if (invoice.lines.length !== poData.line_items.length) {
      discrepancies.push('Line item count mismatch');
    }

    const matched = discrepancies.length === 0;

    return { matched, discrepancies };
  }

  private async fetchPOData(poNumber: string) {
    // PO stub - in real implementation, integrate with ERP
    return {
      total: 11800,
      line_items: [
        { description: 'Professional Services', quantity: 1, unit_price: 10000 },
      ],
    };
  }

  private async fetchGRNData(poNumber: string) {
    // GRN stub - in real implementation, integrate with inventory system
    return {
      line_items: [
        { description: 'Professional Services', quantity: 1 },
      ],
    };
  }
}
