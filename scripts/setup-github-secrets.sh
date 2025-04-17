#!/bin/bash

# Check if AWS profile argument is provided
if [ -z "$1" ]; then
    echo "Please provide an AWS profile name as an argument"
    echo "Usage: $0 <aws-profile>"
    exit 1
fi

# Check if gh CLI is installed
if ! which gh > /dev/null 2>&1; then
    echo "GitHub CLI is not installed. Please install it first:"
    echo "https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "Please login to GitHub first:"
    echo "gh auth login"
    exit 1
fi

# Get AWS credentials from CICD Terraform output
echo "Getting AWS credentials from CICD Terraform output..."
cd ../terraform/cicd || exit 1

# Get and verify each output
echo "Getting AWS_ACCESS_KEY_ID..."
AWS_ACCESS_KEY_ID=$(AWS_PROFILE=$1 terraform output -raw github_actions_access_key)
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "Error: Failed to get AWS_ACCESS_KEY_ID from terraform output"
    exit 1
fi

echo "Getting AWS_SECRET_ACCESS_KEY..."
AWS_SECRET_ACCESS_KEY=$(AWS_PROFILE=$1 terraform output -raw github_actions_secret_key)
if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "Error: Failed to get AWS_SECRET_ACCESS_KEY from terraform output"
    exit 1
fi

echo "Getting Website Bucket Name from Application Terraform output..."
cd ../application || exit 1

echo "Getting WEBSITE_BUCKET_NAME..."
WEBSITE_BUCKET_NAME=$(AWS_PROFILE=$1 terraform output -raw website_bucket_name)
if [ -z "$WEBSITE_BUCKET_NAME" ]; then
    echo "Error: Failed to get WEBSITE_BUCKET_NAME from terraform output"
    exit 1
fi

cd ..

# Set GitHub Secrets
echo "Setting GitHub Secrets..."
gh secret set AWS_ACCESS_KEY_ID -b "$AWS_ACCESS_KEY_ID"
gh secret set AWS_SECRET_ACCESS_KEY -b "$AWS_SECRET_ACCESS_KEY"
gh secret set WEBSITE_BUCKET_NAME -b "$WEBSITE_BUCKET_NAME"

# Verify secrets were set
echo "Verifying secrets..."
if ! gh secret list | grep -q "AWS_ACCESS_KEY_ID"; then
    echo "Error: AWS_ACCESS_KEY_ID was not set"
    exit 1
fi
if ! gh secret list | grep -q "AWS_SECRET_ACCESS_KEY"; then
    echo "Error: AWS_SECRET_ACCESS_KEY was not set"
    exit 1
fi
if ! gh secret list | grep -q "WEBSITE_BUCKET_NAME"; then
    echo "Error: WEBSITE_BUCKET_NAME was not set"
    exit 1
fi

echo "GitHub Secrets have been set and verified successfully!" 