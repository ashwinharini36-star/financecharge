#!/bin/bash

set -e

echo "🎭 Running Finance OS E2E Tests"

# Ensure services are running
echo "📋 Checking services..."
if ! curl -s http://localhost:8000/api/auth/me > /dev/null 2>&1; then
    echo "❌ Backend not running. Please run 'make up' first."
    exit 1
fi

if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Frontend not running. Please run 'make up' first."
    exit 1
fi

# Run Playwright tests
echo "🎭 Running Playwright E2E tests..."
cd app/frontend
npm run e2e

echo "✅ E2E tests completed successfully!"
