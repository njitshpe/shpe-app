#!/bin/bash

# Setup script for QR Code Check-In System
# This script helps deploy the check-in system components

set -e  # Exit on error

echo "🚀 Setting up QR Code Check-In System..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Please install it: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${GREEN}✓${NC} Supabase CLI found"

# Step 1: Deploy Edge Functions
echo ""
echo "📦 Step 1: Deploying Edge Functions..."
echo ""

echo "Deploying check-in-token function..."
supabase functions deploy check-in-token

echo "Deploying validate-check-in function..."
supabase functions deploy validate-check-in

echo -e "${GREEN}✓${NC} Edge Functions deployed"

# Step 2: Generate JWT Secret
echo ""
echo "🔐 Step 2: Setting up JWT Secret..."
echo ""

# Check if secret already exists
if supabase secrets list | grep -q "CHECK_IN_JWT_SECRET"; then
    echo -e "${YELLOW}⚠${NC}  CHECK_IN_JWT_SECRET already exists"
    read -p "Do you want to regenerate it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping JWT secret generation"
    else
        GENERATE_SECRET=true
    fi
else
    GENERATE_SECRET=true
fi

if [ "$GENERATE_SECRET" = true ]; then
    # Generate a secure random secret
    JWT_SECRET=$(openssl rand -base64 32)

    echo "Generated JWT secret (keep this secure!):"
    echo -e "${YELLOW}${JWT_SECRET}${NC}"
    echo ""

    # Set the secret
    echo "$JWT_SECRET" | supabase secrets set CHECK_IN_JWT_SECRET

    echo -e "${GREEN}✓${NC} JWT secret configured"
fi

# Step 3: Run database migrations
echo ""
echo "🗄️  Step 3: Running database migrations..."
echo ""

supabase db push

echo -e "${GREEN}✓${NC} Database migrations applied"

# Step 4: Frontend dependencies
echo ""
echo "📱 Step 4: Installing frontend dependencies..."
echo ""

cd frontend
npm install

echo -e "${GREEN}✓${NC} Frontend dependencies installed"

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "The QR Code Check-In System is now ready to use."
echo ""
echo "📚 Next Steps:"
echo "  1. Read the documentation: CHECK_IN_SYSTEM.md"
echo "  2. Test the system with a sample event"
echo "  3. Verify admin users can generate QR codes"
echo "  4. Test student check-in flow"
echo ""
echo "🔗 Quick Links:"
echo "  - Admin Dashboard: /admin"
echo "  - Event Details: /event/[id]"
echo "  - Check-In Scanner: /check-in"
echo ""
echo -e "${YELLOW}⚠${NC}  Important: Make sure your admin_roles table is populated"
echo "   with at least one admin user for testing."
echo ""
