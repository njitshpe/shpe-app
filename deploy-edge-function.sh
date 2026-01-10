#!/bin/bash

# Deploy check-in Edge Functions to Supabase
# Usage: ./deploy-edge-function.sh

set -e

PROJECT_REF="jsayqpclkkoqglulvzbu"

echo "🚀 Deploying check-in Edge Functions to Supabase project $PROJECT_REF"

# Use npx to run supabase CLI
SUPABASE="npx supabase"

# Link project if not already linked
if [ ! -f .supabase/config.toml ]; then
    echo "🔗 Linking Supabase project..."
    $SUPABASE link --project-ref $PROJECT_REF
fi

# Deploy both functions with --no-verify-jwt
# This disables automatic JWT validation at the gateway level
# JWT validation is still performed securely via auth.getUser() in the function code
echo "📤 Deploying check-in-token Edge Function..."
$SUPABASE functions deploy check-in-token --no-verify-jwt

echo "📤 Deploying validate-check-in Edge Function..."
$SUPABASE functions deploy validate-check-in --no-verify-jwt

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "1. Verify environment variables in Supabase Dashboard:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
echo ""
echo "2. Required environment variables:"
echo "   - SUPABASE_URL (auto-set)"
echo "   - SUPABASE_ANON_KEY (auto-set)"
echo "   - CHECK_IN_JWT_SECRET (must be manually set)"
echo ""
echo "3. Functions use secure JWT verification:"
echo "   - Gateway-level JWT check is disabled (--no-verify-jwt)"
echo "   - JWT signatures ARE validated by auth.getUser() in function code"
echo "   - This approach allows custom auth logic while maintaining security"
echo "   - Matches the secure pattern from admin-event function"
echo ""
echo "4. Test the functions by opening the QR modal in your app"
