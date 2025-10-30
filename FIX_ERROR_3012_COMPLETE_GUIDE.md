# 🔧 Complete Guide: Fix Arcium Error 3012 and Deploy

## The Problem

You're getting **Error 3012** from the Arcium MXE program:

```
InstructionError: [0, { Custom: 3012 }]
```

### Root Cause

The MXE account on devnet was created with the **wrong callback_program**:
- **Current callback program:** `12K7eUMz7j6TfuAijrnbsTPWFtWJG6Dk9Wcby7tfmPJ` (old program)
- **Your program ID:** `GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT`

When you call `queue_computation`, Arcium validates that the calling program matches the `callback_program` stored in the MXE account. Since they don't match → **Error 3012**.

### Why Can't We Update It?

1. The MXE account already exists at: `GMEvxD8FJaQs3J8HPF2tq9BAaiTgiovDZe8dLbEjiPXX`
2. `arcium init-mxe` fails because the account already exists
3. Arcium doesn't provide an `update-mxe` command
4. Only the Arcium MXE program can modify the account data

---

## ✅ Solution: Deploy with New Program ID

The fix is to deploy your program with a **new keypair** to get a fresh program ID, which will create a new MXE account.

### Step 1: Generate New Program Keypair

```bash
cd ~/arcium_poker

# Backup current keypair (optional)
cp target/deploy/arcium_poker-keypair.json target/deploy/arcium_poker-keypair.json.backup

# Generate new keypair
solana-keygen new -o target/deploy/arcium_poker-keypair.json --force
```

**Note:** This will give you a new program ID!

### Step 2: Update Program ID in Code

Get the new program ID:

```bash
NEW_PROGRAM_ID=$(solana-keygen pubkey target/deploy/arcium_poker-keypair.json)
echo "New Program ID: $NEW_PROGRAM_ID"
```

Update these files:

**1. Anchor.toml:**
```toml
[programs.localnet]
arcium_poker = "<NEW_PROGRAM_ID>"

[programs.devnet]
arcium_poker = "<NEW_PROGRAM_ID>"
```

**2. programs/arcium_poker/src/lib.rs:**
```rust
use anchor_lang::prelude::*;

declare_id!("<NEW_PROGRAM_ID>");  // ← UPDATE THIS LINE
```

### Step 3: Rebuild and Deploy

```bash
# Build with new program ID
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Get transaction signature
DEPLOY_TX=$(solana program show "$NEW_PROGRAM_ID" --url devnet --output json | jq -r '.programId')
echo "✅ Deployed: $DEPLOY_TX"
```

### Step 4: Initialize MXE with New Program ID

```bash
arcium init-mxe \
  --callback-program "$NEW_PROGRAM_ID" \
  --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url devnet
```

This will create a **fresh MXE account** with the correct callback program!

### Step 5: Get MXE Account Addresses

Run the helper script:

```bash
# First, update the PROGRAM_ID in scripts/get-mxe-addresses.ts
# Then run:
npx ts-node scripts/get-mxe-addresses.ts
```

This will output all the MXE account addresses you need for the frontend.

### Step 6: Update Frontend

Update your frontend code (e.g., `hooks/useStartGame.ts`) with the addresses from Step 5.

Copy the output from the script into your frontend:

```typescript
// Arcium MXE Configuration
const MXE_PROGRAM = new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6");
const PROGRAM_ID = new PublicKey("<NEW_PROGRAM_ID>");  // Your new ID
const CLUSTER_OFFSET = 1078779259;

// MXE accounts (from script output)
const MXE_ACCOUNT = new PublicKey("...");
const COMP_DEF = new PublicKey("...");
const MEMPOOL = new PublicKey("...");
const EXECUTING_POOL = new PublicKey("...");
const CLUSTER = new PublicKey("...");
const SIGN_SEED = new PublicKey("...");
const STAKING_POOL = new PublicKey("...");
```

### Step 7: Initialize Computation Definition

```bash
# Get MXE account from script output
MXE_ACCOUNT="<from_script_output>"

arcium init-comp-def \
  --mxe-account "$MXE_ACCOUNT" \
  --comp-def-offset 1 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url devnet
```

### Step 8: Test!

Now try starting a game from your frontend. The error should be fixed!

---

## 🚀 Alternative: Use Localnet (Recommended for Development)

If you want to iterate faster without worrying about devnet issues:

### 1. Start Arcium Localnet

```bash
# Install Docker Compose if not installed
sudo apt-get install -y docker-compose-plugin  # Linux
# OR
brew install docker-compose  # Mac

# Start Arcium localnet
arcium localnet
```

### 2. Deploy to Localnet

In another terminal:

```bash
cd ~/arcium_poker

# Deploy to localnet
anchor build
anchor deploy --provider.cluster localnet

# Initialize MXE on localnet
NEW_PROGRAM_ID=$(solana-keygen pubkey target/deploy/arcium_poker-keypair.json)
arcium init-mxe \
  --callback-program "$NEW_PROGRAM_ID" \
  --cluster-offset 1078779259 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url localnet

# Get addresses
npx ts-node scripts/get-mxe-addresses.ts

# Initialize comp def
MXE_ACCOUNT="<from_script_output>"
arcium init-comp-def \
  --mxe-account "$MXE_ACCOUNT" \
  --comp-def-offset 1 \
  --keypair-path ~/.config/solana/id.json \
  --rpc-url localnet
```

### 3. Update Frontend to Use Localnet

Update your RPC endpoint:

```typescript
const connection = new Connection("http://localhost:8899", "confirmed");
```

---

## 🔍 Verify the Fix

After deploying, verify the MXE account has the correct callback program:

```bash
# Get MXE account address (from script output)
MXE_ACCOUNT="..."

# Check account data
solana account "$MXE_ACCOUNT" --url devnet --output json > mxe-account.json

# Decode callback program
node -e "
const bs58 = require('bs58');
const fs = require('fs');
const account = JSON.parse(fs.readFileSync('mxe-account.json', 'utf8'));
const data = Buffer.from(account.account.data[0], 'base64');
const callbackProgram = data.slice(8, 40);
console.log('Callback Program:', bs58.encode(callbackProgram));
console.log('Your Program ID:', '$NEW_PROGRAM_ID');
console.log('Match:', bs58.encode(callbackProgram) === '$NEW_PROGRAM_ID');
"
```

Should output:
```
Callback Program: <NEW_PROGRAM_ID>
Your Program ID: <NEW_PROGRAM_ID>
Match: true
```

---

## 📋 Complete Deployment Checklist

- [ ] Generate new program keypair
- [ ] Update program ID in `Anchor.toml`
- [ ] Update program ID in `lib.rs` (`declare_id!`)
- [ ] Update program ID in `scripts/get-mxe-addresses.ts`
- [ ] Run `anchor build`
- [ ] Run `anchor deploy --provider.cluster devnet`
- [ ] Run `arcium init-mxe` with new program ID
- [ ] Run `npx ts-node scripts/get-mxe-addresses.ts`
- [ ] Update frontend with new addresses
- [ ] Run `arcium init-comp-def`
- [ ] Test start game function
- [ ] Verify MXE account has correct callback program

---

## 🆘 Troubleshooting

### Issue: "Account already in use"
**Solution:** You need to use a different program ID. Go back to Step 1.

### Issue: "Insufficient funds"
**Solution:** Get devnet SOL:
```bash
WALLET=$(solana-keygen pubkey ~/.config/solana/id.json)
solana airdrop 2 "$WALLET" --url devnet
```

### Issue: "Cluster not found"
**Solution:** Make sure the cluster offset (1078779259) is valid. Check Arcium docs for available clusters.

### Issue: Still getting Error 3012
**Solution:** Verify the MXE account callback program matches your program ID (see "Verify the Fix" section).

---

## 📞 Need More Help?

1. Check Arcium docs: https://docs.arcium.com
2. Join Arcium Discord: Check their website for invite
3. GitHub issues: https://github.com/arcium-hq
4. Review error logs: `solana logs --url devnet`

---

## 🎉 Success!

Once deployed, your game will use **real Arcium MPC** for:
- ✅ Encrypted deck shuffling
- ✅ Secure card dealing
- ✅ Verifiable randomness
- ✅ Zero-knowledge proofs

Your poker game is now production-ready with enterprise-grade security! 🚀
