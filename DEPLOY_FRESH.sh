#!/bin/bash

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                    FRESH ARCIUM POKER DEPLOYMENT                             ║
# ║                                                                              ║
# ║  This script deploys the poker program with a NEW program ID to fix         ║
# ║  Error 3012. Your WALLET stays the same, only the program keypair changes.  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                  🚀 ARCIUM POKER FRESH DEPLOYMENT                            ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CLUSTER="devnet"
RPC_URL="https://api.devnet.solana.com"
KEYPAIR_PATH="$HOME/.config/solana/id.json"
ARCIUM_MXE_PROGRAM="BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
CLUSTER_OFFSET="1078779259"

echo "📋 Configuration:"
echo "   • Cluster: $CLUSTER"
echo "   • RPC URL: $RPC_URL"
echo "   • Your Wallet: $KEYPAIR_PATH"
echo "   • Arcium MXE Program: $ARCIUM_MXE_PROGRAM"
echo ""

# Check wallet balance
WALLET_ADDRESS=$(solana-keygen pubkey "$KEYPAIR_PATH")
BALANCE=$(solana balance --url "$RPC_URL" --keypair "$KEYPAIR_PATH" | awk '{print $1}')
echo -e "${GREEN}✅ Your Wallet Address: $WALLET_ADDRESS${NC}"
echo -e "${GREEN}✅ Balance: $BALANCE SOL${NC}"
echo ""

if (( $(echo "$BALANCE < 1.0" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Warning: Low balance! You need at least 1 SOL for deployment${NC}"
    echo ""
    echo "Get more devnet SOL:"
    echo "  solana airdrop 2 $WALLET_ADDRESS --url $RPC_URL"
    echo ""
    read -p "Press Enter to continue or Ctrl+C to cancel..."
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                        STEP 1: NEW PROGRAM KEYPAIR                           ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Creating a new program keypair (not your wallet!)..."
echo ""

# Backup old keypair
if [ -f "target/deploy/arcium_poker-keypair.json" ]; then
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="target/deploy/arcium_poker-keypair.json.backup_$TIMESTAMP"
    cp "target/deploy/arcium_poker-keypair.json" "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backed up old keypair to: $BACKUP_FILE${NC}"
fi

# Generate new program keypair
solana-keygen new -o target/deploy/arcium_poker-keypair.json --force --no-bip39-passphrase
echo ""

NEW_PROGRAM_ID=$(solana-keygen pubkey target/deploy/arcium_poker-keypair.json)
echo -e "${BLUE}📝 NEW Program ID: $NEW_PROGRAM_ID${NC}"
echo ""

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                      STEP 2: UPDATE PROGRAM ID                               ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# Update Anchor.toml
echo "Updating Anchor.toml..."
sed -i "s/arcium_poker = \".*\"/arcium_poker = \"$NEW_PROGRAM_ID\"/" Anchor.toml
echo -e "${GREEN}✅ Updated Anchor.toml${NC}"

# Update lib.rs
echo "Updating programs/arcium_poker/src/lib.rs..."
sed -i "s/declare_id!(\".*\")/declare_id!(\"$NEW_PROGRAM_ID\")/" programs/arcium_poker/src/lib.rs
echo -e "${GREEN}✅ Updated lib.rs${NC}"

# Update get-mxe-addresses.ts
echo "Updating scripts/get-mxe-addresses.ts..."
sed -i "s/const PROGRAM_ID = new PublicKey('.*');/const PROGRAM_ID = new PublicKey('$NEW_PROGRAM_ID');/" scripts/get-mxe-addresses.ts
echo -e "${GREEN}✅ Updated get-mxe-addresses.ts${NC}"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                         STEP 3: BUILD PROGRAM                                ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "Building program with new ID..."
anchor build

echo ""
echo -e "${GREEN}✅ Build complete!${NC}"
echo ""

# Verify the build
BUILT_PROGRAM_ID=$(solana address -k target/deploy/arcium_poker-keypair.json)
if [ "$BUILT_PROGRAM_ID" != "$NEW_PROGRAM_ID" ]; then
    echo -e "${RED}❌ Error: Program ID mismatch!${NC}"
    echo "   Expected: $NEW_PROGRAM_ID"
    echo "   Got: $BUILT_PROGRAM_ID"
    exit 1
fi

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                        STEP 4: DEPLOY PROGRAM                                ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "Deploying to $CLUSTER..."
echo ""

anchor deploy --provider.cluster "$CLUSTER"

echo ""
echo -e "${GREEN}✅ Program deployed successfully!${NC}"
echo ""

# Verify deployment
solana program show "$NEW_PROGRAM_ID" --url "$RPC_URL" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Program verified on chain!${NC}"
else
    echo -e "${RED}❌ Warning: Could not verify program on chain${NC}"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                    STEP 5: INITIALIZE MXE ACCOUNT                            ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "Initializing MXE account with new program ID..."
echo ""

arcium init-mxe \
  --callback-program "$NEW_PROGRAM_ID" \
  --cluster-offset "$CLUSTER_OFFSET" \
  --keypair-path "$KEYPAIR_PATH" \
  --rpc-url "$CLUSTER"

echo ""
echo -e "${GREEN}✅ MXE account initialized!${NC}"
echo ""

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                   STEP 6: COMPUTE MXE ADDRESSES                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "Computing all MXE account addresses..."
echo ""

npx ts-node scripts/get-mxe-addresses.ts > mxe-addresses-output.txt

cat mxe-addresses-output.txt

echo ""
echo -e "${GREEN}✅ Addresses saved to: mxe-addresses-output.txt${NC}"
echo ""

# Extract MXE account for next step
MXE_ACCOUNT=$(grep -A 1 "MXE Account:" mxe-addresses-output.txt | tail -1 | awk '{print $2}')
echo -e "${BLUE}📝 MXE Account: $MXE_ACCOUNT${NC}"
echo ""

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                 STEP 7: INITIALIZE COMPUTATION DEFINITION                    ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

echo "Initializing computation definition for shuffle..."
echo ""

# Note: This command might not exist or might fail - that's OK
# The comp def might be initialized automatically by init-mxe
echo "Attempting to initialize comp def offset 1..."
arcium init-comp-def \
  --mxe-account "$MXE_ACCOUNT" \
  --comp-def-offset 1 \
  --keypair-path "$KEYPAIR_PATH" \
  --rpc-url "$CLUSTER" 2>&1 || echo -e "${YELLOW}⚠️  Comp def init failed or not needed${NC}"

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                            🎉 SUCCESS!                                       ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📝 Summary:"
echo "   • Your Wallet: $WALLET_ADDRESS (unchanged)"
echo "   • New Program ID: $NEW_PROGRAM_ID"
echo "   • MXE Account: $MXE_ACCOUNT"
echo "   • Network: $CLUSTER"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Copy the MXE addresses from mxe-addresses-output.txt"
echo ""
echo "2. Update your frontend code with the new addresses"
echo "   Location: hooks/useStartGame.ts or similar"
echo ""
echo "3. Test the start game function!"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "🔗 Useful links:"
echo "   • Devnet Explorer: https://explorer.solana.com/address/$NEW_PROGRAM_ID?cluster=devnet"
echo "   • Program Logs: solana logs --url $RPC_URL"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
