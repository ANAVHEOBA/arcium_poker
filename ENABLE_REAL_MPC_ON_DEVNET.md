# 🔐 How to Enable Real Arcium MPC on Devnet

**Status:** Currently using Mock Mode (deterministic shuffle)
**Goal:** Enable real encrypted MPC operations on Solana Devnet
**Time Required:** 2-4 hours

---

## 📊 Current Status

### ✅ Already Working
- ✅ MPC circuits compiled (`encrypted-ixs/`)
- ✅ Dual-mode architecture (Mock + MXE)
- ✅ Arcium client SDK installed (`@arcium-hq/client`, `@arcium-hq/reader`)
- ✅ Program deployed to Devnet: `Cm5y2aab75vj9dpRcyG1EeZNgeh4GZLRkN3BmmRVNEwZ`

### ❌ What's Missing for Real MPC
1. **MXE Program Setup** - Need to deploy/configure Arcium MXE on Devnet
2. **Computation Definitions** - Register your MPC circuits with Arcium network
3. **Cluster Configuration** - Connect to Arcium's compute cluster
4. **Complete Placeholder Functions** - Finish encryption/decryption helpers
5. **Sufficient SOL** - Need ~3.5 SOL for deployment (currently 0.57 SOL)

---

## 🚀 Step-by-Step Guide

### **Step 1: Get More SOL (Required)**

Your current balance: **0.57 SOL** (need ~3.5 SOL)

```bash
# Check current balance
solana balance

# Option A: Use Solana Devnet Faucet
solana airdrop 2
solana airdrop 2
# Repeat until you have 3.5+ SOL

# Option B: Use web faucet
# Visit: https://faucet.solana.com/
# Switch to Devnet and request airdrop

# Verify
solana balance
# Should show: 3.5+ SOL
```

---

### **Step 2: Deploy/Configure Arcium MXE**

Arcium MXE is the Multi-Party Execution engine that runs your MPC circuits.

#### 2.1 Check if Arcium MXE is Available on Devnet

```bash
# Check if Arcium has a public MXE deployment on Devnet
# (As of Oct 2025, check Arcium docs for official Devnet MXE address)

# Expected: ArciumMXE11111111111111111111111111111111111
# Or a similar program ID
```

#### 2.2 Option A: Use Arcium's Hosted MXE (Recommended)

If Arcium provides a hosted MXE on Devnet:

```bash
# Update your code with official MXE Program ID
# Edit: programs/arcium_poker/src/arcium/integration.rs
```

In `integration.rs`, update line 11:
```rust
// OLD
pub const ARCIUM_PROGRAM_ID: &str = "ArciumMXE11111111111111111111111111111111111";

// NEW - Get real ID from https://docs.arcium.com
pub const ARCIUM_PROGRAM_ID: &str = "<ACTUAL_DEVNET_MXE_PROGRAM_ID>";
```

#### 2.3 Option B: Deploy Your Own MXE Instance

If you need your own MXE:

```bash
# Install Arcium CLI
npm install -g @arcium-hq/cli

# Or via cargo
cargo install arcium-cli

# Deploy MXE to Devnet
arcium mxe deploy --cluster devnet --keypair ~/.config/solana/id.json

# This will output:
# ✅ MXE Program ID: <YOUR_MXE_PROGRAM_ID>
# ✅ MXE Account: <YOUR_MXE_ACCOUNT>
# ✅ Cluster ID: <YOUR_CLUSTER_ID>

# Save these values!
```

---

### **Step 3: Deploy MPC Circuits to Arcium Network**

Your circuits are already compiled in `encrypted-ixs/`. Now deploy them:

```bash
cd encrypted-ixs

# Build circuits
cargo build-sbf

# Deploy circuits to Arcium cluster
arcium circuits deploy \
  --cluster devnet \
  --mxe-program <MXE_PROGRAM_ID> \
  --keypair ~/.config/solana/id.json \
  target/deploy/encrypted_ixs.so

# This creates "Computation Definitions" for each circuit:
# ✅ shuffle_deck       -> Comp Def Offset: 0
# ✅ deal_card         -> Comp Def Offset: 1
# ✅ reveal_hole_cards -> Comp Def Offset: 2
# ✅ generate_random   -> Comp Def Offset: 3
```

**Save the output:** You'll get computation definition offsets and PDAs.

---

### **Step 4: Update Your Code with Real MXE Values**

#### 4.1 Update Program Constants

Edit `programs/arcium_poker/src/arcium/integration.rs`:

```rust
/// Arcium MXE Program ID on Devnet (UPDATE THIS!)
pub const ARCIUM_PROGRAM_ID: &str = "<YOUR_ACTUAL_MXE_PROGRAM_ID>";

/// Computation definition offsets (from Step 3 output)
pub const SHUFFLE_COMP_DEF_OFFSET: u32 = 0;  // Or actual offset
pub const DEAL_COMP_DEF_OFFSET: u32 = 1;     // Or actual offset
pub const REVEAL_COMP_DEF_OFFSET: u32 = 2;   // Or actual offset
```

#### 4.2 Complete Placeholder Functions

The following functions are currently stubs. Complete them:

**File:** `programs/arcium_poker/src/arcium/integration.rs`

```rust
/// Encrypt data for MXE using Rescue cipher
///
/// Currently returns placeholder ❌
pub fn encrypt_for_mxe(
    data: &[u8],
    nonce: [u8; 16],
) -> Result<EncryptedData> {
    // TODO: Implement real encryption
    // Use RescueCipher from Arcium SDK

    // For now, this should be done CLIENT-SIDE using @arcium-hq/client
    // The Solana program just validates encrypted data

    msg!("[ARCIUM] encrypt_for_mxe called - should be client-side");

    Ok(EncryptedData {
        ciphertext: [0u8; 32],  // ❌ Replace with real encryption
        nonce,
        owner: None,
    })
}

/// Decrypt data from MXE
pub fn decrypt_from_mxe(
    encrypted: &EncryptedData,
    _secret_key: &[u8; 32],
) -> Result<Vec<u8>> {
    // TODO: Implement real decryption
    // This should typically be done CLIENT-SIDE

    msg!("[ARCIUM] decrypt_from_mxe called - should be client-side");

    Ok(vec![0u8; 32])  // ❌ Replace with real decryption
}
```

**Important:** Encryption/decryption should happen **CLIENT-SIDE** using the TypeScript SDK. The Solana program just passes encrypted data.

---

### **Step 5: Create Client-Side Integration**

Create a new test file: `tests/test_real_mxe.ts`

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArciumPoker } from "../target/types/arcium_poker";
import {
  MxeClient,
  RescueCipher,
  generateKeypair
} from "@arcium-hq/client";

describe("Real MXE Integration", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.ArciumPoker as Program<ArciumPoker>;

  // Initialize Arcium MXE Client
  const mxeClient = new MxeClient({
    endpoint: "https://api.devnet.solana.com",
    mxeProgramId: "<YOUR_MXE_PROGRAM_ID>",  // From Step 2
    cluster: "<YOUR_CLUSTER_ID>",           // From Step 2
  });

  it("Start game with real MPC shuffle", async () => {
    // 1. Generate entropy for each player
    const player1Entropy = new Uint8Array(32);
    const player2Entropy = new Uint8Array(32);
    crypto.getRandomValues(player1Entropy);
    crypto.getRandomValues(player2Entropy);

    // 2. Encrypt entropy using RescueCipher
    const cipher = new RescueCipher();
    const keypair1 = generateKeypair();
    const keypair2 = generateKeypair();

    const nonce1 = new Uint8Array(16);
    const nonce2 = new Uint8Array(16);
    crypto.getRandomValues(nonce1);
    crypto.getRandomValues(nonce2);

    const encryptedEntropy1 = cipher.encrypt(
      player1Entropy,
      keypair1.secretKey,
      nonce1
    );
    const encryptedEntropy2 = cipher.encrypt(
      player2Entropy,
      keypair2.secretKey,
      nonce2
    );

    // 3. Derive MXE accounts
    const [mxeAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mxe")],
      new anchor.web3.PublicKey("<YOUR_MXE_PROGRAM_ID>")
    );

    const [compDefAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("comp_def"), Buffer.from([0])],  // Offset 0 = shuffle
      new anchor.web3.PublicKey("<YOUR_MXE_PROGRAM_ID>")
    );

    const [mempoolAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("mempool")],
      new anchor.web3.PublicKey("<YOUR_MXE_PROGRAM_ID>")
    );

    // 4. Call start_game with MXE accounts
    const tx = await program.methods
      .startGame([
        Array.from(encryptedEntropy1),
        Array.from(encryptedEntropy2),
      ])
      .accounts({
        game: gameAccount,
        authority: authority.publicKey,
        mxeProgram: new anchor.web3.PublicKey("<YOUR_MXE_PROGRAM_ID>"),
        mxeAccount,
        compDefAccount,
        mempoolAccount,
        executingPoolAccount,  // Derive this too
        clusterAccount,        // From Step 2
        computationAccount,    // Generate unique PDA
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .remainingAccounts([
        // Player state accounts
        { pubkey: player1State, isSigner: false, isWritable: true },
        { pubkey: player2State, isSigner: false, isWritable: true },
      ])
      .rpc();

    console.log("✅ Game started with real MPC shuffle!");
    console.log("   Transaction:", tx);

    // 5. Wait for MPC computation to complete
    const computation = await mxeClient.waitForComputation(tx);

    console.log("✅ MPC shuffle completed!");
    console.log("   Shuffled deck commitment:", computation.result);
  });
});
```

---

### **Step 6: Update Test Configuration**

Update `Anchor.toml`:

```toml
[features]
seeds = false
skip-lint = false

[programs.devnet]
arcium_poker = "Cm5y2aab75vj9dpRcyG1EeZNgeh4GZLRkN3BmmRVNEwZ"

[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

# ADD THIS - Arcium MXE Configuration
[arcium]
mxe_program_id = "<YOUR_MXE_PROGRAM_ID>"
cluster_id = "<YOUR_CLUSTER_ID>"
```

---

### **Step 7: Rebuild and Deploy**

```bash
# Rebuild program with updated MXE constants
anchor build

# Deploy updated program
anchor deploy --provider.cluster devnet

# Run tests with real MXE
npm test
```

---

## 🔍 Verification Checklist

After completing all steps, verify:

- [ ] **SOL Balance**: 3.5+ SOL in devnet wallet
- [ ] **MXE Program ID**: Real Arcium MXE program ID (not placeholder)
- [ ] **Circuits Deployed**: 4 computation definitions registered
- [ ] **Cluster Connected**: Your program can reach Arcium compute nodes
- [ ] **Program Deployed**: Updated program on devnet
- [ ] **Tests Pass**: At least one test runs with real MXE

---

## 📝 Common Issues & Solutions

### Issue 1: "MXE Program Not Found"
**Solution:** Verify MXE Program ID is correct for Devnet.
```bash
# Check if program exists
solana account <MXE_PROGRAM_ID> --url devnet
```

### Issue 2: "Computation Definition Not Initialized"
**Solution:** Run `init_shuffle_comp_def` instruction first:
```typescript
await program.methods
  .initShuffleCompDef(0)  // Comp def offset
  .accounts({ ... })
  .rpc();
```

### Issue 3: "Insufficient Funds"
**Solution:** Get more SOL:
```bash
solana airdrop 2
```

### Issue 4: "MXE Callback Never Arrives"
**Solution:**
1. Check Arcium network status
2. Verify cluster configuration
3. Ensure computation was queued successfully
4. Wait longer (MPC computations take time)

### Issue 5: "Encryption/Decryption Fails"
**Solution:** Encryption happens CLIENT-SIDE:
- Use `@arcium-hq/client` SDK
- Don't encrypt in Solana program
- Pass encrypted data as bytes

---

## 🎯 Expected Behavior After Integration

### Before (Mock Mode)
```
[ARCIUM MPC] Using MOCK MODE (no MXE accounts provided)
[ARCIUM MPC] Shuffle complete! Session ID: [deterministic]
```

### After (Real MXE Mode)
```
[ARCIUM MPC] Using REAL MXE MODE
[ARCIUM MPC] Queueing computation via CPI
[ARCIUM MPC] Computation queued successfully
[ARCIUM MPC] Computation ID: 0x1234...
[ARCIUM MPC] Waiting for MPC network...
[ARCIUM] Handling shuffle callback
[ARCIUM] Shuffle result received and verified
[ARCIUM] Deck ready for dealing
```

---

## 📚 Resources

- **Arcium Docs**: https://docs.arcium.com
- **Arcium Devnet Info**: https://docs.arcium.com/networks/devnet
- **MXE Architecture**: https://docs.arcium.com/concepts/mxe
- **Client SDK Examples**: https://github.com/arcium-hq/examples
- **Rescue Cipher Spec**: https://docs.arcium.com/cryptography/rescue

---

## 🚧 Alternative: Keep Using Mock Mode

If you prefer to keep using **Mock Mode** for now (deterministic shuffle):

**Pros:**
- ✅ Instant shuffle (no network latency)
- ✅ Tests pass consistently
- ✅ No external dependencies
- ✅ Works offline

**Cons:**
- ❌ Not cryptographically secure
- ❌ Shuffle is deterministic (predictable)
- ❌ No real MPC guarantees

**To keep mock mode:** Simply don't provide MXE accounts when calling `start_game()`. The program automatically falls back to mock mode.

---

## 🎉 Success Criteria

You'll know real MPC is working when:

1. ✅ `start_game()` calls Arcium MXE via CPI
2. ✅ Computation queued on Arcium network
3. ✅ Callback received with encrypted shuffle result
4. ✅ Cards dealt with owner-specific encryption
5. ✅ Showdown reveals cards via threshold decryption
6. ✅ No deterministic values in shuffle

---

## ⚡ Quick Start (TL;DR)

```bash
# 1. Get SOL
solana airdrop 2 && solana airdrop 2

# 2. Get MXE Program ID
# Visit: https://docs.arcium.com/networks/devnet

# 3. Update code with real MXE ID
# Edit: programs/arcium_poker/src/arcium/integration.rs
# Replace: "ArciumMXE11111111111111111111111111111111111"

# 4. Deploy circuits
cd encrypted-ixs
arcium circuits deploy --cluster devnet --mxe-program <ID>

# 5. Rebuild & deploy
cd ..
anchor build
anchor deploy

# 6. Test
npm test tests/test_real_mxe.ts
```

---

**Need help?** Check Arcium Discord or open an issue on GitHub.
