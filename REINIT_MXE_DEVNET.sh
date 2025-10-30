#!/bin/bash

# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                  REINITIALIZE ARCIUM MXE ON DEVNET                           ║
# ║                                                                              ║
# ║  This script fixes Error 3012 by creating a fresh MXE account with the      ║
# ║  correct callback_program set to our deployed program ID.                   ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -e  # Exit on error

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                  🔧 Arcium MXE Reinitialization Script                       ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

# ============================================================================
# CONFIGURATION
# ============================================================================

PROGRAM_ID="GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT"
ARCIUM_MXE_PROGRAM="BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
CLUSTER_OFFSET="1078779259"
RPC_URL="https://api.devnet.solana.com"
KEYPAIR_PATH="$HOME/.config/solana/id.json"

echo "📝 Configuration:"
echo "   • Program ID: $PROGRAM_ID"
echo "   • Arcium MXE Program: $ARCIUM_MXE_PROGRAM"
echo "   • Cluster Offset: $CLUSTER_OFFSET"
echo "   • RPC URL: $RPC_URL"
echo "   • Keypair: $KEYPAIR_PATH"
echo ""

# ============================================================================
# STEP 1: Check Prerequisites
# ============================================================================

echo "🔍 Checking prerequisites..."

# Check if arcium CLI is installed
if ! command -v arcium &> /dev/null; then
    echo "❌ Arcium CLI not found!"
    echo ""
    echo "Install with:"
    echo "  cargo install arcium-cli"
    echo ""
    echo "Or download from: https://github.com/arcium-hq/arcium-cli"
    exit 1
fi

# Check if solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found!"
    echo ""
    echo "Install with:"
    echo "  sh -c \"\$(curl -sSfL https://release.solana.com/stable/install)\""
    exit 1
fi

# Check if keypair exists
if [ ! -f "$KEYPAIR_PATH" ]; then
    echo "❌ Keypair not found at $KEYPAIR_PATH"
    echo ""
    echo "Generate a new keypair with:"
    echo "  solana-keygen new -o $KEYPAIR_PATH"
    exit 1
fi

# Check balance
BALANCE=$(solana balance --url $RPC_URL --keypair $KEYPAIR_PATH | awk '{print $1}')
echo "   ✅ Wallet balance: $BALANCE SOL"

if (( $(echo "$BALANCE < 0.5" | bc -l) )); then
    echo "   ⚠️  Low balance! You need at least 0.5 SOL for initialization"
    WALLET_ADDR=$(solana-keygen pubkey $KEYPAIR_PATH)
    echo ""
    echo "   Get devnet SOL:"
    echo "   $ solana airdrop 2 $WALLET_ADDR --url $RPC_URL"
    echo ""
    read -p "   Press Enter after getting SOL, or Ctrl+C to cancel..."
fi

echo ""

# ============================================================================
# STEP 2: Initialize MXE Account (Fresh)
# ============================================================================

echo "🔐 Initializing fresh MXE account..."
echo ""
echo "This will create a new MXE account with the correct callback_program."
echo "The old MXE account (GMEvxD8FJaQs3J8HPF2tq9BAaiTgiovDZe8dLbEjiPXX) will be abandoned."
echo ""

# Run arcium init-mxe
# This will derive a NEW MXE account address based on the program ID
echo "$ arcium init-mxe \\"
echo "    --callback-program $PROGRAM_ID \\"
echo "    --cluster-offset $CLUSTER_OFFSET \\"
echo "    --keypair-path $KEYPAIR_PATH \\"
echo "    --url $RPC_URL"
echo ""

arcium init-mxe \
  --callback-program "$PROGRAM_ID" \
  --cluster-offset "$CLUSTER_OFFSET" \
  --keypair-path "$KEYPAIR_PATH" \
  --url "$RPC_URL"

echo ""
echo "✅ MXE account initialized!"
echo ""

# ============================================================================
# STEP 3: Get MXE Account Addresses
# ============================================================================

echo "📋 Fetching MXE account addresses..."
echo ""

# The MXE account is a PDA derived from: [b"mxe", program_id.as_ref()]
# We can compute it or fetch it from the transaction logs

echo "Computing MXE PDA addresses..."
echo ""

# Use Solana CLI to find the MXE account
echo "$ solana program show $PROGRAM_ID --url $RPC_URL"
echo ""

# Get accounts owned by Arcium MXE program that have our program as callback
echo "Searching for MXE accounts..."
MXE_ACCOUNTS=$(solana account $ARCIUM_MXE_PROGRAM --url $RPC_URL --output json 2>/dev/null || echo "{}")

echo ""
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                           📝 NEXT STEPS                                      ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "1. Find your new MXE account address:"
echo "   Check the transaction output above for 'MXE account: <ADDRESS>'"
echo ""
echo "2. Get all required PDA addresses using this TypeScript code:"
echo ""
echo "   import { PublicKey } from '@solana/web3.js';"
echo "   import * as anchor from '@coral-xyz/anchor';"
echo ""
echo "   const programId = new PublicKey('$PROGRAM_ID');"
echo "   const mxeProgram = new PublicKey('$ARCIUM_MXE_PROGRAM');"
echo "   const clusterOffset = $CLUSTER_OFFSET;"
echo ""
echo "   // MXE Account (main account)"
echo "   const [mxeAccount] = PublicKey.findProgramAddressSync("
echo "     [Buffer.from('mxe'), programId.toBuffer()],"
echo "     mxeProgram"
echo "   );"
echo ""
echo "   // Computation Definition"
echo "   const [compDef] = PublicKey.findProgramAddressSync("
echo "     ["
echo "       Buffer.from('comp_def'),"
echo "       mxeAccount.toBuffer(),"
echo "       new anchor.BN(1).toArrayLike(Buffer, 'le', 4)"
echo "     ],"
echo "     mxeProgram"
echo "   );"
echo ""
echo "   // Mempool"
echo "   const [mempool] = PublicKey.findProgramAddressSync("
echo "     [Buffer.from('mempool'), mxeAccount.toBuffer()],"
echo "     mxeProgram"
echo "   );"
echo ""
echo "   // Executing Pool"
echo "   const [executingPool] = PublicKey.findProgramAddressSync("
echo "     [Buffer.from('executing_pool'), mxeAccount.toBuffer()],"
echo "     mxeProgram"
echo "   );"
echo ""
echo "   // Cluster"
echo "   const [cluster] = PublicKey.findProgramAddressSync("
echo "     [Buffer.from('cluster'), new anchor.BN($CLUSTER_OFFSET).toArrayLike(Buffer, 'le', 8)],"
echo "     mxeProgram"
echo "   );"
echo ""
echo "   // Sign Seed"
echo "   const [signSeed] = PublicKey.findProgramAddressSync("
echo "     [Buffer.from('sign_seed'), mxeAccount.toBuffer()],"
echo "     mxeProgram"
echo "   );"
echo ""
echo "   // Staking Pool"
echo "   const [stakingPool] = PublicKey.findProgramAddressSync("
echo "     [Buffer.from('staking_pool')],"
echo "     mxeProgram"
echo "   );"
echo ""
echo "   console.log('MXE Account:', mxeAccount.toBase58());"
echo "   console.log('Comp Def:', compDef.toBase58());"
echo "   console.log('Mempool:', mempool.toBase58());"
echo "   console.log('Executing Pool:', executingPool.toBase58());"
echo "   console.log('Cluster:', cluster.toBase58());"
echo "   console.log('Sign Seed:', signSeed.toBase58());"
echo "   console.log('Staking Pool:', stakingPool.toBase58());"
echo ""
echo "3. Update your frontend code (useStartGame.ts) with these addresses."
echo ""
echo "4. Initialize the computation definition:"
echo "   $ arcium init-comp-def \\"
echo "       --mxe-account <MXE_ACCOUNT_FROM_STEP_1> \\"
echo "       --comp-def-offset 1 \\"
echo "       --keypair-path $KEYPAIR_PATH \\"
echo "       --url $RPC_URL"
echo ""
echo "5. Test the start game function again!"
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo "✅ MXE initialization complete!"
echo ""
echo "If you still get errors, run:"
echo "  $ solana logs --url $RPC_URL"
echo ""
echo "And check for detailed error messages."
echo "═══════════════════════════════════════════════════════════════════════════════"
