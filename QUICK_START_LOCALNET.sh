#!/bin/bash

# Quick Start Script for Arcium Localnet Testing
# Run this script step by step (not all at once)

echo "==================================="
echo "Arcium Localnet Quick Start"
echo "==================================="

# STEP 1: Install Docker Compose (if not already installed)
echo ""
echo "STEP 1: Installing Docker Compose..."
echo "-----------------------------------"
echo "Running this command:"
echo ""

# Create Docker CLI plugins directory
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins

# Download Docker Compose
curl -SL https://github.com/docker/compose/releases/download/v2.40.1/docker-compose-linux-x86_64 \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose

# Make it executable
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

echo ""
echo "✅ Verifying Docker Compose installation:"
docker compose version

# STEP 2: Install Arcium CLI (if not already installed)
echo ""
echo "STEP 2: Installing Arcium CLI..."
echo "-----------------------------------"
echo "Run this command (press Enter when ready):"
echo ""
echo "curl --proto '=https' --tlsv1.2 -sSfL https://install.arcium.com/ | bash"
echo ""
read -p "Press Enter after running the above command..."

echo ""
echo "✅ Verifying Arcium installation:"
arcium --version

# STEP 3: Verify Anchor version
echo ""
echo "STEP 3: Checking Anchor version..."
echo "-----------------------------------"
echo "Required: Anchor 0.31.1 (NOT 0.32.1)"
echo ""
echo "✅ Current Anchor version:"
anchor --version

ANCHOR_VERSION=$(anchor --version 2>&1 | grep -oP '0\.\d+\.\d+')
if [ "$ANCHOR_VERSION" != "0.31.1" ]; then
    echo ""
    echo "⚠️  WARNING: Anchor version is not 0.31.1!"
    echo "Arcium requires Anchor 0.31.1. Install it with:"
    echo ""
    echo "  cargo install --git https://github.com/coral-xyz/anchor avm --force"
    echo "  avm install 0.31.1"
    echo "  avm use 0.31.1"
    echo ""
    read -p "Press Enter after fixing Anchor version..."
fi

# STEP 4: Update Anchor.toml
echo ""
echo "STEP 4: Updating Anchor.toml..."
echo "-----------------------------------"

# Check if [test] section exists
if grep -q "^\[test\]" Anchor.toml 2>/dev/null; then
    echo "✅ [test] section already exists in Anchor.toml"
else
    echo "Adding [test] section to Anchor.toml..."
    echo "" >> Anchor.toml
    echo "[test]" >> Anchor.toml
    echo "startup_wait = 200000" >> Anchor.toml
    echo "✅ Added timeout configuration"
fi

# STEP 5: Instructions for starting localnet
echo ""
echo "==================================="
echo "READY TO START LOCALNET!"
echo "==================================="
echo ""
echo "Follow these steps:"
echo ""
echo "1. Open a NEW terminal window"
echo ""
echo "2. Navigate to the project:"
echo "   cd /home/a/arcium_poker"
echo ""
echo "3. Start Arcium localnet:"
echo "   arcium localnet"
echo ""
echo "   Keep this terminal open - localnet runs in foreground"
echo ""
echo "4. Come back to THIS terminal and press Enter to continue..."
echo ""
read -p "Press Enter after starting localnet in the other terminal..."

# STEP 6: Build and deploy
echo ""
echo "STEP 5: Building and deploying program..."
echo "-----------------------------------"
echo ""
echo "Building program..."
anchor build

echo ""
echo "Deploying to localnet..."
anchor deploy --provider.cluster localnet

echo ""
echo "✅ Program deployed!"

# STEP 7: Initialize MXE
echo ""
echo "STEP 6: Initializing MXE account..."
echo "-----------------------------------"
echo ""

arcium init-mxe \
  --callback-program GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT \
  --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  -u localnet

echo ""
echo "✅ MXE initialized!"

# STEP 8: Verify MXE
echo ""
echo "STEP 7: Verifying MXE account..."
echo "-----------------------------------"
echo ""

arcium mxe-info GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT -u localnet

echo ""
echo "==================================="
echo "🎉 LOCALNET SETUP COMPLETE!"
echo "==================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Run tests:"
echo "   anchor test --skip-local-validator"
echo ""
echo "2. Or run specific test:"
echo "   yarn run ts-mocha -p ./tsconfig.json tests/arcium_poker.ts"
echo ""
echo "3. To stop localnet:"
echo "   Go to the terminal running 'arcium localnet' and press Ctrl+C"
echo ""
echo "Happy testing! 🚀"
echo ""
