# Finance OS - Unified AP/AR/CPQ SaaS

Multi-tenant finance platform unifying Accounts Payable, Accounts Receivable, and CPQ/Billing with native AI capabilities.

## 🚀 Quick Start

```bash
git clone <repo>
cd finance-os
cp infra/dev.env.example .env
make up
```

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/api/docs
- Temporal UI: http://localhost:8080

**Default Login:**
- Email: admin@demo.com
- Password: admin123

## 📋 Commands

```bash
make up      # Start all services (builds, migrates, seeds)
make test    # Run unit + API tests  
make e2e     # Run end-to-end tests
make down    # Stop services
make clean   # Reset data and containers
make logs    # View service logs
```

## 🎯 Golden Path Test

The system implements the complete CPQ → Invoice → Payment → Reconciliation flow:

1. **Login** as admin@demo.com
2. **Navigate to CPQ** → Create Quote
3. **Add products** (Professional Services, Software License)
4. **Apply discounts** and review totals
5. **Approve quote** → Convert to Invoice
6. **Send payment link** (UPI/PG/Bank transfer)
7. **Simulate payment** via webhook
8. **View auto-reconciliation** in AR dashboard
9. **Check cash pulse** dashboard updates

## 🏗️ Architecture

### Backend (NestJS + PostgreSQL)
- **Multi-tenant** with org_id isolation
- **RBAC** with 6 roles: Owner, FinanceManager, APClerk, ARClerk, SalesRep, Approver
- **Event-driven** with audit logging
- **API-first** with OpenAPI documentation

### Frontend (Next.js + React)
- **Responsive** Tailwind CSS + ShadCN/UI
- **Real-time** updates with React Query
- **Role-based** navigation and permissions
- **Progressive** loading and error boundaries

### Workers (Temporal.io)
- **CPQ Approval** workflow
- **AR Cash Application** with fuzzy matching
- **AP Approval** routing
- **Dunning** automation (3-stage)

### Infrastructure
- **Docker Compose** for local development
- **PostgreSQL** with tenant isolation
- **Redis** for caching and sessions
- **MinIO** S3-compatible storage
- **Temporal** for workflow orchestration

## 👥 Default Users & Roles

| Email | Role | Password | Permissions |
|-------|------|----------|-------------|
| admin@demo.com | Owner | admin123 | Full access |
| finance@demo.com | FinanceManager | finance123 | Finance operations |
| ap@demo.com | APClerk | ap123 | Accounts Payable |
| ar@demo.com | ARClerk | ar123 | Accounts Receivable |
| sales@demo.com | SalesRep | sales123 | CPQ and quotes |
| approver@demo.com | Approver | approver123 | Approvals only |

## 🔧 Core Features

### ✅ Accounts Payable (AP)
- **Invoice ingestion** with OCR (PDF/email/API)
- **3-way matching** (PO/Invoice/Receipt)
- **Approval routing** by policy
- **Vendor portal** and management
- **Payment runs** with batch processing
- **Audit trail** for compliance

### ✅ Accounts Receivable (AR)
- **Invoice generation** from quotes
- **Payment links** (UPI + PG + bank transfer)
- **Auto-reconciliation** with fuzzy matching
- **Collections workflow** automation
- **Dispute management**
- **DSO dashboard** and aging reports

### ✅ CPQ + Billing
- **Product catalog** with pricing rules
- **Quote builder** with discounts
- **Multi-currency** and tax handling
- **Subscription billing** automation
- **Usage-based billing**
- **Revenue recognition**

### ✅ AI & Automation
- **OCR** for document processing
- **GL code prediction** 
- **Fuzzy payment matching** (87%+ accuracy)
- **Anomaly detection** for fraud
- **Predictive cash flow** forecasting
- **Smart reconciliation**

## 🔌 Integrations (Stubbed)

### Payment Gateways
- **Stripe** webhook handler
- **Razorpay** UPI integration
- **Bank transfers** with NEFT/RTGS
- **Crypto payments** (optional)

### ERP Systems
- **QuickBooks** OAuth + REST API
- **Tally** custom connector
- **Zoho Books** webhook sync
- **SAP/Oracle** enterprise connectors

### Communication
- **Email** via SendGrid (console stub)
- **SMS** via Twilio
- **WhatsApp** Business API
- **Slack/Teams** webhook notifications

## 📊 Sample Data

The system includes realistic demo data:
- **3 customers** with different profiles
- **3 vendors** for AP testing
- **8 products** with various pricing models
- **3 quotes** in different states
- **4 invoices** (AR + AP)
- **2 payments** with reconciliation

## 🧪 Testing

### Unit Tests
```bash
# Backend tests
docker-compose exec backend npm test

# Frontend tests  
docker-compose exec frontend npm test
```

### API Tests
```bash
# Test authentication
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}'

# Test quote creation
curl -X POST http://localhost:8000/api/quotes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"customer-techstart-inc","currency":"INR","items":[...]}'
```

### E2E Tests
```bash
make e2e  # Runs Playwright tests
```

## 🔒 Security & Compliance

### Multi-Tenancy
- **Row-level security** with org_id enforcement
- **Prisma middleware** for automatic tenant isolation
- **API guards** prevent cross-tenant access

### Authentication & Authorization
- **JWT tokens** with refresh rotation
- **Role-based permissions** (RBAC)
- **API rate limiting**
- **CORS protection**

### Compliance Ready
- **SOC 2** audit trail
- **GST e-invoicing** (India)
- **PCI DSS** payment handling
- **GDPR** data privacy

## 📈 Performance & Scalability

### Database Optimization
- **Indexed queries** for common patterns
- **Pagination** on all list endpoints
- **Connection pooling**
- **Read replicas** ready

### Caching Strategy
- **Redis** for session and API caching
- **React Query** for client-side caching
- **CDN** for static assets

### Monitoring
- **Structured logging** with correlation IDs
- **Health checks** for all services
- **Metrics** collection ready
- **Error tracking** with stack traces

## 🚢 Deployment

### Local Development
```bash
make up    # Full stack with hot reload
make down  # Stop all services
make clean # Reset everything
```

### Production Considerations
- **Environment variables** for all secrets
- **Database migrations** with Prisma
- **Container orchestration** (Kubernetes ready)
- **Load balancing** and auto-scaling
- **Backup strategies** for data persistence

## 📁 Project Structure

```
finance-os/
├── app/
│   ├── backend/          # NestJS API server
│   ├── frontend/         # Next.js React app
│   ├── workers/          # Temporal workflows
│   └── packages/
│       ├── contracts/    # OpenAPI specs
│       └── ui/           # Shared components
├── infra/
│   ├── docker-compose.yml
│   └── dev.env.example
├── sample-data/          # CSV imports
├── scripts/              # Automation scripts
└── README.md
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Development Guidelines
- **TypeScript** for type safety
- **Prettier** for code formatting
- **ESLint** for code quality
- **Conventional commits** for changelog
- **Tests** for all new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` endpoint
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions
- **Email**: support@finance-os.com

---

**Finance OS** - Reimagining finance operations for the modern enterprise. Built with ❤️ for finance teams who demand more than traditional ERP systems.
