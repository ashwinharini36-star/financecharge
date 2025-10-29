import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'demo-org-id' },
    update: {},
    create: {
      id: 'demo-org-id',
      name: 'Demo Corp',
      gstin: '29ABCDE1234F1Z5',
      currency: 'INR',
    },
  });

  console.log('✅ Created organization:', org.name);

  // Create users with different roles
  const users = [
    { email: 'admin@demo.com', role: 'Owner', password: 'admin123' },
    { email: 'finance@demo.com', role: 'FinanceManager', password: 'finance123' },
    { email: 'ap@demo.com', role: 'APClerk', password: 'ap123' },
    { email: 'ar@demo.com', role: 'ARClerk', password: 'ar123' },
    { email: 'sales@demo.com', role: 'SalesRep', password: 'sales123' },
    { email: 'approver@demo.com', role: 'Approver', password: 'approver123' },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    await prisma.user.upsert({
      where: { 
        org_id_email: { 
          org_id: org.id, 
          email: userData.email 
        } 
      },
      update: {},
      create: {
        org_id: org.id,
        email: userData.email,
        role: userData.role as any,
        hashed_password: hashedPassword,
        status: 'active',
      },
    });
  }

  console.log('✅ Created users');

  // Create customers
  const customers = [
    { name: 'TechStart Inc', email: 'billing@techstart.com' },
    { name: 'Global Solutions', email: 'accounts@globalsol.com' },
    { name: 'Innovation Labs', email: 'finance@innovlabs.com' },
  ];

  for (const customerData of customers) {
    await prisma.customer.upsert({
      where: { 
        id: `customer-${customerData.name.toLowerCase().replace(/\s+/g, '-')}` 
      },
      update: {},
      create: {
        id: `customer-${customerData.name.toLowerCase().replace(/\s+/g, '-')}`,
        org_id: org.id,
        name: customerData.name,
        email: customerData.email,
        currency: 'INR',
        billing_address: {
          street: '123 Business St',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400001',
          country: 'India',
        },
      },
    });
  }

  console.log('✅ Created customers');

  // Create vendors
  const vendors = [
    { name: 'Acme Corp', email: 'billing@acme.com' },
    { name: 'Office Supplies Ltd', email: 'accounts@officesupplies.com' },
    { name: 'Tech Services Inc', email: 'invoices@techservices.com' },
  ];

  for (const vendorData of vendors) {
    await prisma.vendor.upsert({
      where: { 
        id: `vendor-${vendorData.name.toLowerCase().replace(/\s+/g, '-')}` 
      },
      update: {},
      create: {
        id: `vendor-${vendorData.name.toLowerCase().replace(/\s+/g, '-')}`,
        org_id: org.id,
        name: vendorData.name,
        email: vendorData.email,
        payment_terms: 30,
      },
    });
  }

  console.log('✅ Created vendors');

  // Create products
  const products = [
    { name: 'Professional Services', sku: 'PROF-001', type: 'one_time', price: 50000 },
    { name: 'Software License', sku: 'SW-001', type: 'subscription', price: 10000 },
    { name: 'Consulting Hours', sku: 'CONS-001', type: 'usage', price: 5000 },
  ];

  for (const productData of products) {
    const product = await prisma.product.upsert({
      where: { 
        org_id_sku: { 
          org_id: org.id, 
          sku: productData.sku 
        } 
      },
      update: {},
      create: {
        org_id: org.id,
        name: productData.name,
        sku: productData.sku,
        type: productData.type as any,
        tax_code: 'GST18',
        uom: productData.type === 'usage' ? 'hours' : 'each',
      },
    });

    // Create price
    await prisma.price.upsert({
      where: { 
        id: `price-${productData.sku}` 
      },
      update: {},
      create: {
        id: `price-${productData.sku}`,
        org_id: org.id,
        product_id: product.id,
        currency: 'INR',
        unit_amount: productData.price,
        billing_period: productData.type === 'subscription' ? 'monthly' : null,
      },
    });
  }

  console.log('✅ Created products and prices');

  // Create sample quotes
  const quotes = [
    {
      id: 'quote-1',
      customer_id: 'customer-techstart-inc',
      status: 'draft',
      items: [{ product_sku: 'PROF-001', qty: 1, unit_amount: 50000, discount_percent: 0 }],
    },
    {
      id: 'quote-2',
      customer_id: 'customer-global-solutions',
      status: 'approved',
      items: [
        { product_sku: 'SW-001', qty: 5, unit_amount: 10000, discount_percent: 10 },
        { product_sku: 'CONS-001', qty: 20, unit_amount: 5000, discount_percent: 0 },
      ],
    },
    {
      id: 'quote-3',
      customer_id: 'customer-innovation-labs',
      status: 'sent',
      items: [{ product_sku: 'PROF-001', qty: 2, unit_amount: 50000, discount_percent: 5 }],
    },
  ];

  for (const quoteData of quotes) {
    let subtotal = 0;
    let discountTotal = 0;

    for (const item of quoteData.items) {
      const lineTotal = item.qty * item.unit_amount;
      const lineDiscount = lineTotal * (item.discount_percent / 100);
      subtotal += lineTotal;
      discountTotal += lineDiscount;
    }

    const tax = Math.round((subtotal - discountTotal) * 0.18);
    const total = subtotal - discountTotal + tax;

    const quote = await prisma.quote.upsert({
      where: { id: quoteData.id },
      update: {},
      create: {
        id: quoteData.id,
        org_id: org.id,
        customer_id: quoteData.customer_id,
        status: quoteData.status as any,
        currency: 'INR',
        subtotal,
        tax,
        discount_total: discountTotal,
        total,
      },
    });

    // Create quote items
    for (const itemData of quoteData.items) {
      const product = await prisma.product.findFirst({
        where: { org_id: org.id, sku: itemData.product_sku },
      });

      if (product) {
        await prisma.quoteItem.upsert({
          where: { 
            id: `${quoteData.id}-${itemData.product_sku}` 
          },
          update: {},
          create: {
            id: `${quoteData.id}-${itemData.product_sku}`,
            quote_id: quote.id,
            product_id: product.id,
            qty: itemData.qty,
            unit_amount: itemData.unit_amount,
            discount_percent: itemData.discount_percent,
          },
        });
      }
    }
  }

  console.log('✅ Created quotes');

  // Create sample invoices
  const invoices = [
    {
      id: 'invoice-ar-1',
      customer_id: 'customer-techstart-inc',
      kind: 'AR',
      status: 'issued',
      total: 59000,
      due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'invoice-ar-2',
      customer_id: 'customer-global-solutions',
      kind: 'AR',
      status: 'paid',
      total: 163000,
      due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: 'invoice-ar-3',
      customer_id: 'customer-innovation-labs',
      kind: 'AR',
      status: 'issued',
      total: 95000,
      due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Overdue
    },
    {
      id: 'invoice-ap-1',
      vendor_id: 'vendor-acme-corp',
      kind: 'AP',
      status: 'approved',
      total: 25000,
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const invoiceData of invoices) {
    await prisma.invoice.upsert({
      where: { id: invoiceData.id },
      update: {},
      create: {
        id: invoiceData.id,
        org_id: org.id,
        customer_id: invoiceData.customer_id || null,
        vendor_id: invoiceData.vendor_id || null,
        kind: invoiceData.kind as any,
        status: invoiceData.status as any,
        currency: 'INR',
        subtotal: Math.round(invoiceData.total / 1.18),
        tax: Math.round(invoiceData.total * 0.18 / 1.18),
        total: invoiceData.total,
        due_date: invoiceData.due_date,
        source: 'Manual',
      },
    });
  }

  console.log('✅ Created invoices');

  // Create sample payments
  const payments = [
    {
      id: 'payment-1',
      direction: 'in',
      amount: 163000,
      invoice_id: 'invoice-ar-2',
    },
    {
      id: 'payment-2',
      direction: 'in',
      amount: 30000,
      invoice_id: 'invoice-ar-3', // Partial payment
    },
  ];

  for (const paymentData of payments) {
    const payment = await prisma.payment.upsert({
      where: { id: paymentData.id },
      update: {},
      create: {
        id: paymentData.id,
        org_id: org.id,
        direction: paymentData.direction as any,
        method: 'pg',
        amount: paymentData.amount,
        currency: 'INR',
        received_on: new Date(),
        external_ref: `ext_${paymentData.id}`,
      },
    });

    // Create payment application
    await prisma.paymentApplication.upsert({
      where: { 
        id: `app-${paymentData.id}` 
      },
      update: {},
      create: {
        id: `app-${paymentData.id}`,
        payment_id: payment.id,
        invoice_id: paymentData.invoice_id,
        amount_applied: paymentData.amount,
      },
    });

    // Update invoice status
    const invoice = await prisma.invoice.findUnique({
      where: { id: paymentData.invoice_id },
    });

    if (invoice) {
      const newStatus = paymentData.amount >= invoice.total ? 'paid' : 'partially_paid';
      await prisma.invoice.update({
        where: { id: paymentData.invoice_id },
        data: { status: newStatus as any },
      });
    }
  }

  console.log('✅ Created payments and applications');

  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Default login credentials:');
  console.log('Email: admin@demo.com');
  console.log('Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
