import { test, expect } from '@playwright/test'

test.describe('Finance OS Golden Path', () => {
  test('complete CPQ to payment flow', async ({ page }) => {
    // 1. Login
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'admin@demo.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await expect(page).toHaveURL(/.*dashboard/)
    await expect(page.locator('h1')).toContainText('Cash Pulse')

    // 2. Navigate to CPQ
    await page.click('a[href="/dashboard/cpq"]')
    await expect(page.locator('h1')).toContainText('CPQ & Quotes')

    // 3. Create Quote
    await page.click('button:has-text("Create Quote")')
    
    // Fill quote form
    await page.click('[data-testid="customer-select"]')
    await page.click('text=TechStart Inc')
    
    // Add product
    await page.click('[data-testid="product-select-0"]')
    await page.click('text=Professional Services')
    
    // Set quantity
    await page.fill('input[type="number"][value="1"]', '2')
    
    // Create quote
    await page.click('button:has-text("Create Quote")')
    
    // Verify quote created
    await expect(page.locator('text=Quote #')).toBeVisible()

    // 4. Approve Quote
    await page.click('button:has-text("Approve")')
    await expect(page.locator('text=approved')).toBeVisible()

    // 5. Convert to Invoice
    await page.click('button:has-text("Convert to Invoice")')
    
    // Navigate to invoices to verify
    await page.click('a[href="/dashboard/invoices"]')
    await expect(page.locator('text=Invoice')).toBeVisible()

    // 6. Send Invoice (generate payment links)
    await page.click('button:has-text("Send")')
    await expect(page.locator('text=issued')).toBeVisible()

    // 7. Simulate Payment Webhook
    // This would normally be done by payment gateway
    const response = await page.request.post('http://localhost:8000/api/payments/webhook/stripe', {
      data: {
        type: 'payment_intent.succeeded',
        amount: 118000, // 1180.00 INR (2 * 500 + 18% GST)
        customer_email: 'billing@techstart.com',
        id: 'pi_test_golden_path'
      }
    })
    expect(response.status()).toBe(202)

    // 8. Verify Auto-reconciliation
    await page.reload()
    await expect(page.locator('text=paid')).toBeVisible()

    // 9. Check Dashboard Updates
    await page.click('a[href="/dashboard"]')
    await expect(page.locator('h1')).toContainText('Cash Pulse')
    
    // Verify cash flow chart is visible
    await expect(page.locator('text=Daily Net Cash Flow')).toBeVisible()
  })

  test('AP invoice upload and processing', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3000/login')
    await page.fill('input[type="email"]', 'ap@demo.com')
    await page.fill('input[type="password"]', 'ap123')
    await page.click('button[type="submit"]')

    // Navigate to Payables
    await page.click('a[href="/dashboard/payables"]')
    
    // Upload invoice (mock file upload)
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'vendor-invoice.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content')
    })

    // Verify OCR processing
    await expect(page.locator('text=Processing')).toBeVisible()
    await expect(page.locator('text=Acme Corp')).toBeVisible()
  })
})
