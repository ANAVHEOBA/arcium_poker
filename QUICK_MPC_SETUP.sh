#!/bin/bash
# Quick Setup Script for Arcium MPC on Devnet
# Run: chmod +x QUICK_MPC_SETUP.sh && ./QUICK_MPC_SETUP.sh

set -e  # Exit on error

echo "🔐 Arcium Poker - MPC Setup Script"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."
echo ""

# Check Solana CLI
if ! command -v solana &> /dev/null; then
    echo -e "${RED}❌ Solana CLI not found${NC}"
    echo "Install: sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi
echo -e "${GREEN}✅ Solana CLI installed${NC}"

# Check Anchor CLI
if ! command -v anchor &> /dev/null; then
    echo -e "${RED}❌ Anchor CLI not found${NC}"
    echo "Install: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    exit 1
fi
echo -e "${GREEN}✅ Anchor CLI installed${NC}"

# Check Node/npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    echo "Install Node.js from: https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ npm installed${NC}"

echo ""

# Step 2: Check SOL balance
echo "💰 Step 2: Checking SOL balance..."
echo ""

BALANCE=$(solana balance | awk '{print $1}')
REQUIRED=3.5

if (( $(echo "$BALANCE < $REQUIRED" | bc -l) )); then
    echo -e "${YELLOW}⚠️  Current balance: $BALANCE SOL${NC}"
    echo -e "${YELLOW}⚠️  Required: $REQUIRED+ SOL${NC}"
    echo ""
    echo "Getting airdrops..."

    for i in {1..3}; do
        echo "Airdrop attempt $i..."
        solana airdrop 2 || echo "Airdrop failed (rate limit?), retrying..."
        sleep 2
    done

    BALANCE=$(solana balance | awk '{print $1}')
    echo -e "${GREEN}✅ New balance: $BALANCE SOL${NC}"
else
    echo -e "${GREEN}✅ Sufficient balance: $BALANCE SOL${NC}"
fi

echo ""

# Step 3: Check if Arcium CLI is installed
echo "🔧 Step 3: Checking Arcium CLI..."
echo ""

if ! command -v arcium &> /dev/null; then
    echo -e "${YELLOW}⚠️  Arcium CLI not found${NC}"
    echo ""
    echo "To install Arcium CLI, run:"
    echo "  npm install -g @arcium-hq/cli"
    echo ""
    echo "Or check: https://docs.arcium.com/getting-started/installation"
    echo ""
    read -p "Do you want to continue without Arcium CLI? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    ARCIUM_INSTALLED=false
else
    echo -e "${GREEN}✅ Arcium CLI installed${NC}"
    arcium --version
    ARCIUM_INSTALLED=true
fi

echo ""

# Step 4: Install dependencies
echo "📦 Step 4: Installing dependencies..."
echo ""

npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"

echo ""

# Step 5: Build project
echo "🔨 Step 5: Building project..."
echo ""

anchor build
echo -e "${GREEN}✅ Project built successfully${NC}"

echo ""

# Step 6: Get Arcium MXE info
echo "🔍 Step 6: Arcium MXE Configuration"
echo ""

echo -e "${YELLOW}⚠️  ACTION REQUIRED:${NC}"
echo ""
echo "To enable real MPC, you need:"
echo "1. Arcium MXE Program ID for Devnet"
echo "2. Cluster ID"
echo ""
echo "Get these from:"
echo "  • Arcium Docs: https://docs.arcium.com/networks/devnet"
echo "  • Arcium Discord: https://discord.gg/arcium"
echo ""

if [ "$ARCIUM_INSTALLED" = true ]; then
    echo "Checking for Arcium MXE on Devnet..."
    echo ""

    # Try to query Arcium network info
    # Note: This command may not exist - adjust based on actual Arcium CLI
    # arcium cluster list --network devnet || echo "Could not query clusters"

    echo "Once you have the MXE Program ID, update:"
    echo "  programs/arcium_poker/src/arcium/integration.rs"
    echo "  Line 11: pub const ARCIUM_PROGRAM_ID"
fi

echo ""

# Step 7: Deploy circuits (if Arcium CLI available)
if [ "$ARCIUM_INSTALLED" = true ]; then
    echo "🚀 Step 7: Deploy MPC Circuits"
    echo ""

    read -p "Do you have an Arcium MXE Program ID? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Enter MXE Program ID (or press Enter to skip):"
        read MXE_PROGRAM_ID

        if [ -n "$MXE_PROGRAM_ID" ]; then
            echo "Deploying circuits to Arcium network..."
            cd encrypted-ixs

            # Build circuits
            cargo build-sbf || cargo build-bpf

            # Deploy (adjust command based on actual Arcium CLI)
            echo ""
            echo "To deploy, run:"
            echo "  arcium circuits deploy \\"
            echo "    --cluster devnet \\"
            echo "    --mxe-program $MXE_PROGRAM_ID \\"
            echo "    --keypair ~/.config/solana/id.json \\"
            echo "    target/deploy/encrypted_ixs.so"
            echo ""

            cd ..
        fi
    fi
else
    echo "🚀 Step 7: Deploy MPC Circuits (Skipped - no Arcium CLI)"
    echo ""
    echo "Install Arcium CLI to deploy circuits:"
    echo "  npm install -g @arcium-hq/cli"
fi

echo ""

# Step 8: Deploy program
echo "🚀 Step 8: Deploy to Devnet"
echo ""

read -p "Deploy program to Devnet now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    anchor deploy --provider.cluster devnet
    echo -e "${GREEN}✅ Program deployed to Devnet${NC}"
else
    echo "Skipped deployment. Deploy later with:"
    echo "  anchor deploy --provider.cluster devnet"
fi

echo ""

# Step 9: Run tests
echo "🧪 Step 9: Run Tests"
echo ""

read -p "Run tests now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running tests..."
    npm test || echo -e "${YELLOW}⚠️  Some tests failed (expected if MXE not configured)${NC}"
else
    echo "Skipped tests. Run later with:"
    echo "  npm test"
fi

echo ""
echo "=================================="
echo "🎉 Setup Complete!"
echo "=================================="
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Read the full guide:"
echo "   cat ENABLE_REAL_MPC_ON_DEVNET.md"
echo ""
echo "2. Complete placeholder functions:"
echo "   cat COMPLETE_PLACEHOLDER_FUNCTIONS.md"
echo ""
echo "3. Update MXE Program ID:"
echo "   Edit: programs/arcium_poker/src/arcium/integration.rs"
echo "   Line 11: pub const ARCIUM_PROGRAM_ID = \"<YOUR_REAL_MXE_ID>\";"
echo ""
echo "4. Test with mock mode (works now):"
echo "   npm test tests/test_game_flow.ts"
echo ""
echo "5. Test with real MXE (after configuration):"
echo "   npm test tests/test_real_mxe.ts"
echo ""
echo "📖 Documentation:"
echo "   • ENABLE_REAL_MPC_ON_DEVNET.md"
echo "   • COMPLETE_PLACEHOLDER_FUNCTIONS.md"
echo "   • Arcium Docs: https://docs.arcium.com"
echo ""
echo "Need help? Check the README.md or open an issue."
echo ""
