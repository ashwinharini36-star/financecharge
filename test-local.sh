#!/bin/bash

echo "🧪 Testing Finance OS locally..."

# Check if services are running
echo "📋 Checking services..."

# Test backend health
if curl -s http://localhost:8000/api/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend not running. Run 'make up' first."
    exit 1
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend not running. Run 'make up' first."
    exit 1
fi

# Test authentication
echo "🔐 Testing authentication..."
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"admin123"}' | \
  grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Authentication working"
else
    echo "❌ Authentication failed"
    exit 1
fi

# Test API endpoints
echo "📡 Testing API endpoints..."

# Test customers
CUSTOMERS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/customers)
if echo "$CUSTOMERS" | grep -q "TechStart Inc"; then
    echo "✅ Customers API working"
else
    echo "❌ Customers API failed"
fi

# Test products
PRODUCTS=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/products)
if echo "$PRODUCTS" | grep -q "Professional Services"; then
    echo "✅ Products API working"
else
    echo "❌ Products API failed"
fi

# Test quotes
QUOTES=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/quotes)
if echo "$QUOTES" | grep -q "data"; then
    echo "✅ Quotes API working"
else
    echo "❌ Quotes API failed"
fi

# Test dashboard
DASHBOARD=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8000/api/dashboard/cash-pulse)
if echo "$DASHBOARD" | grep -q "total_ar"; then
    echo "✅ Dashboard API working"
else
    echo "❌ Dashboard API failed"
fi

echo ""
echo "🎉 Local testing complete!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "API Docs: http://localhost:8000/api/docs"
echo "Login: admin@demo.com / admin123"
