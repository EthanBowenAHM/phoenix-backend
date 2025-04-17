#!/bin/bash

# Exit on error
set -e

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo "Error: act is not installed. Please install it first:"
    echo "brew install act"
    exit 1
fi

# Check if AWS SSO is configured
if ! aws configure list-profiles; then
    echo "Error: AWS SSO is not configured. Please configure it first:"
    echo "aws configure sso"
    exit 1
fi

# Check if environment is provided
if [ -z "$1" ]; then
    echo "Error: Environment not specified"
    echo "Usage: $0 <environment> <aws-profile>"
    echo "Example: $0 dev ethan_hobby"
    exit 1
fi

ENVIRONMENT=$1
AWS_PROFILE=$2

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|test|prod)$ ]]; then
    echo "Error: Invalid environment. Must be one of: dev, test, prod"
    exit 1
fi

# Get AWS credentials from SSO
echo "Getting AWS credentials from SSO..."
credentials=$(aws configure export-credentials --profile "$AWS_PROFILE" --format env)

# Extract credentials
AWS_ACCESS_KEY_ID=$(grep "AWS_ACCESS_KEY_ID" <<< "$credentials" | cut -d'=' -f2)
AWS_SECRET_ACCESS_KEY=$(grep "AWS_SECRET_ACCESS_KEY" <<< "$credentials" | cut -d'=' -f2)
AWS_SESSION_TOKEN=$(grep "AWS_SESSION_TOKEN" <<< "$credentials" | cut -d'=' -f2)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile "$AWS_PROFILE" --query Account --output text)

# Run act with the specified environment and secrets
echo "Running GitHub Actions workflow for $ENVIRONMENT environment..."
cd ..
act --container-architecture linux/arm64 \
    -W .github/workflows/backend-ci.yml \
    -e .github/workflows/act-env.json \
    -s "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID" \
    -s "AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY" \
    -s "AWS_SESSION_TOKEN=$AWS_SESSION_TOKEN" \
    -s "AWS_ACCOUNT_ID_DEV=$AWS_ACCOUNT_ID" \
    --env ENVIRONMENT="$ENVIRONMENT" \
    --env AWS_PROFILE="$AWS_PROFILE"