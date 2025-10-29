#!/bin/bash

# Finance OS AWS Deployment Script
set -e

# Configuration
AWS_REGION="us-east-1"
APP_NAME="finance-os"
ECR_REPO_PREFIX="finance-os"

echo "🚀 Deploying Finance OS to AWS..."

# Configure AWS CLI (set these as environment variables)
# export AWS_ACCESS_KEY_ID="your-access-key"
# export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_DEFAULT_REGION="$AWS_REGION"

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "📋 AWS Account ID: $ACCOUNT_ID"

# Create ECR repositories
echo "📦 Creating ECR repositories..."
aws ecr create-repository --repository-name $ECR_REPO_PREFIX/backend --region $AWS_REGION || true
aws ecr create-repository --repository-name $ECR_REPO_PREFIX/frontend --region $AWS_REGION || true
aws ecr create-repository --repository-name $ECR_REPO_PREFIX/workers --region $AWS_REGION || true

# Login to ECR
echo "🔐 Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push images
echo "🏗️ Building and pushing Docker images..."

# Backend
docker build -t $ECR_REPO_PREFIX/backend ./app/backend
docker tag $ECR_REPO_PREFIX/backend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_PREFIX/backend:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_PREFIX/backend:latest

# Frontend
docker build -t $ECR_REPO_PREFIX/frontend ./app/frontend
docker tag $ECR_REPO_PREFIX/frontend:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_PREFIX/frontend:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_PREFIX/frontend:latest

# Workers
docker build -t $ECR_REPO_PREFIX/workers ./app/workers
docker tag $ECR_REPO_PREFIX/workers:latest $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_PREFIX/workers:latest
docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_PREFIX/workers:latest

echo "✅ Images pushed to ECR successfully!"

# Deploy infrastructure
echo "🏗️ Deploying infrastructure..."
aws cloudformation deploy \
  --template-file deploy/cloudformation.yml \
  --stack-name $APP_NAME \
  --parameter-overrides \
    AppName=$APP_NAME \
    BackendImage=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_PREFIX/backend:latest \
    FrontendImage=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_PREFIX/frontend:latest \
    WorkersImage=$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_PREFIX/workers:latest \
  --capabilities CAPABILITY_IAM \
  --region $AWS_REGION

# Get outputs
echo "📋 Getting deployment outputs..."
FRONTEND_URL=$(aws cloudformation describe-stacks --stack-name $APP_NAME --query 'Stacks[0].Outputs[?OutputKey==`FrontendURL`].OutputValue' --output text --region $AWS_REGION)
BACKEND_URL=$(aws cloudformation describe-stacks --stack-name $APP_NAME --query 'Stacks[0].Outputs[?OutputKey==`BackendURL`].OutputValue' --output text --region $AWS_REGION)

echo "🎉 Deployment complete!"
echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
echo "Login: admin@demo.com / admin123"
