import { proxyActivities } from '@temporalio/workflow'
import type * as activities from './activities'

const { sendEmail, processPayment, updateInvoiceStatus, logAudit } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
})

export async function cpqApprovalWorkflow(quoteId: string, orgId: string): Promise<void> {
  // CPQ Approval: CreateQuote -> ValidatePricing -> RouteToApprover -> Approve -> ConvertToInvoice -> Notify
  
  await logAudit(orgId, 'Quote', quoteId, 'WORKFLOW_STARTED', 'CPQ Approval workflow started')
  
  // Route to approver (simplified - in real implementation, check approval policies)
  await sendEmail({
    to: 'approver@demo.com',
    subject: `Quote ${quoteId} requires approval`,
    body: `Please review and approve quote ${quoteId}`,
  })
  
  await logAudit(orgId, 'Quote', quoteId, 'APPROVAL_REQUESTED', 'Approval request sent')
}

export async function arCashApplicationWorkflow(
  paymentData: any,
  orgId: string
): Promise<void> {
  // AR Cash App: ReceivePaymentEvent -> CandidateInvoices -> FuzzyScore -> Apply -> RecomputeAging -> AuditLog
  
  await logAudit(orgId, 'Payment', paymentData.id, 'WORKFLOW_STARTED', 'Cash application workflow started')
  
  // This would be handled by the payments service auto-reconciliation
  // Here we just log the completion
  await logAudit(orgId, 'Payment', paymentData.id, 'CASH_APPLIED', 'Payment automatically applied to invoice')
}

export async function apApprovalWorkflow(invoiceId: string, orgId: string): Promise<void> {
  // AP Approvals: OCRParse -> CodeToGL -> 3WayMatch -> RouteByPolicy -> Approve/Reject -> PaymentRunDraft
  
  await logAudit(orgId, 'Invoice', invoiceId, 'WORKFLOW_STARTED', 'AP approval workflow started')
  
  // Route to AP clerk for review
  await sendEmail({
    to: 'ap@demo.com',
    subject: `AP Invoice ${invoiceId} requires review`,
    body: `Please review AP invoice ${invoiceId} for approval`,
  })
  
  await logAudit(orgId, 'Invoice', invoiceId, 'REVIEW_REQUESTED', 'AP review request sent')
}

export async function dunningWorkflow(customerId: string, orgId: string): Promise<void> {
  // Dunning: OverdueScan -> Stage1(email) -> Stage2(whatsapp) -> Stage3(legal notice placeholder)
  
  await logAudit(orgId, 'Customer', customerId, 'DUNNING_STARTED', 'Dunning workflow started')
  
  // Stage 1: Email reminder
  await sendEmail({
    to: 'customer@example.com', // Would be fetched from customer record
    subject: 'Payment Reminder - Overdue Invoice',
    body: 'This is a friendly reminder that you have overdue invoices. Please make payment at your earliest convenience.',
  })
  
  // Wait 7 days (simplified for demo)
  // In real implementation: await sleep('7 days')
  
  // Stage 2: WhatsApp reminder (placeholder)
  await logAudit(orgId, 'Customer', customerId, 'WHATSAPP_REMINDER', 'WhatsApp reminder sent (placeholder)')
  
  // Stage 3: Legal notice (placeholder)
  await logAudit(orgId, 'Customer', customerId, 'LEGAL_NOTICE', 'Legal notice prepared (placeholder)')
}
