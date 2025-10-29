# Finance OS - AWS Deployment Guide

## Prerequisites

1. **AWS CLI installed** and configured
2. **Docker** installed and running
3. **AWS credentials** with appropriate permissions

## Quick Deploy to AWS

```bash
# 1. Navigate to project directory
cd finance-os

# 2. Run deployment script
./deploy/aws-deploy.sh
```

The script will:
- Create ECR repositories
- Build and push Docker images
- Deploy CloudFormation stack
- Set up RDS PostgreSQL database
- Configure ElastiCache Redis
- Deploy ECS Fargate services
- Set up Application Load Balancer

## Manual Deployment Steps

### 1. Configure AWS Credentials

```bash
export AWS_ACCESS_KEY_ID="your-access-key-here"
export AWS_SECRET_ACCESS_KEY="your-secret-key-here"
export AWS_DEFAULT_REGION="us-east-1"
```

### 2. Create ECR Repositories

```bash
aws ecr create-repository --repository-name finance-os/backend
aws ecr create-repository --repository-name finance-os/frontend
aws ecr create-repository --repository-name finance-os/workers
```

### 3. Build and Push Images

```bash
# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
docker build -f app/backend/Dockerfile.prod -t finance-os/backend ./app/backend
docker tag finance-os/backend:latest $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finance-os/backend:latest
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finance-os/backend:latest

# Build and push frontend
docker build -f app/frontend/Dockerfile.prod -t finance-os/frontend ./app/frontend
docker tag finance-os/frontend:latest $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finance-os/frontend:latest
docker push $ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finance-os/frontend:latest
```

### 4. Deploy CloudFormation Stack

```bash
aws cloudformation deploy \
  --template-file deploy/cloudformation.yml \
  --stack-name finance-os \
  --parameter-overrides \
    BackendImage=$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finance-os/backend:latest \
    FrontendImage=$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/finance-os/frontend:latest \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### 5. Run Database Migrations

```bash
# Get RDS endpoint from CloudFormation outputs
DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name finance-os --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text)

# Connect to database and run migrations
# This would typically be done via ECS task or bastion host
```

## Post-Deployment

### Access URLs

```bash
# Get deployment URLs
FRONTEND_URL=$(aws cloudformation describe-stacks --stack-name finance-os --query 'Stacks[0].Outputs[?OutputKey==`FrontendURL`].OutputValue' --output text)
BACKEND_URL=$(aws cloudformation describe-stacks --stack-name finance-os --query 'Stacks[0].Outputs[?OutputKey==`BackendURL`].OutputValue' --output text)

echo "Frontend: $FRONTEND_URL"
echo "Backend: $BACKEND_URL"
```

### Default Login
- Email: admin@demo.com
- Password: admin123

## Architecture Overview

The deployment creates:

- **VPC** with public/private subnets
- **RDS PostgreSQL** database in private subnets
- **ElastiCache Redis** for caching
- **ECS Fargate** services for backend/frontend
- **Application Load Balancer** for traffic routing
- **CloudWatch** logs for monitoring

## Scaling

### Horizontal Scaling
```bash
# Scale ECS services
aws ecs update-service --cluster finance-os-cluster --service finance-os-backend --desired-count 3
aws ecs update-service --cluster finance-os-cluster --service finance-os-frontend --desired-count 2
```

### Vertical Scaling
Update task definitions with higher CPU/memory and redeploy.

## Monitoring

- **CloudWatch Logs**: `/ecs/finance-os-backend`, `/ecs/finance-os-frontend`
- **ECS Metrics**: CPU, memory, network utilization
- **ALB Metrics**: Request count, latency, error rates
- **RDS Metrics**: Database performance

## Security

- **VPC**: Private subnets for database and cache
- **Security Groups**: Restrictive ingress rules
- **IAM**: Least privilege task execution roles
- **Secrets Manager**: Database credentials
- **ALB**: SSL termination (add certificate for HTTPS)

## Cleanup

```bash
# Delete CloudFormation stack
aws cloudformation delete-stack --stack-name finance-os

# Delete ECR repositories
aws ecr delete-repository --repository-name finance-os/backend --force
aws ecr delete-repository --repository-name finance-os/frontend --force
aws ecr delete-repository --repository-name finance-os/workers --force
```

## Troubleshooting

### Common Issues

1. **ECS Tasks Failing**: Check CloudWatch logs
2. **Database Connection**: Verify security groups and credentials
3. **Load Balancer 502**: Check target group health
4. **Image Pull Errors**: Verify ECR permissions

### Debug Commands

```bash
# Check ECS service status
aws ecs describe-services --cluster finance-os-cluster --services finance-os-backend

# View task logs
aws logs tail /ecs/finance-os-backend --follow

# Check target group health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```
