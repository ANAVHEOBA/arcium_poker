# MXE CPI Error Fix Guide

## Date: October 26, 2025

---

## Problem Summary

Your Solana program is failing with error `0x65` (InstructionFallbackNotFound) when trying to call the Arcium MXE program.

**Transaction:** `61ki8qcN4xmexPLVAbMJPY7NTdQWoQSuQpBYrK64ncnUhf3YGpY3z9Xbf4LqaJcFQog7eAeChgRtiBjRnTwWaqS`

**Error Message:** `Error: Fallback functions are not supported`

---

## Root Cause Analysis

### What Error 0x65 Means

Error code `0x65` (101 in decimal) = **InstructionFallbackNotFound**

This error occurs when an Anchor program cannot find the correct instruction to call based on the discriminator (first 8 bytes of instruction data).

### The Specific Problem

Looking at your code in `programs/arcium_poker/src/arcium/integration.rs` at line 147:

```rust
// ❌ WRONG - Placeholder discriminator
ix_data.extend_from_slice(&[0x01]); // Only 1 byte instead of 8!
```

The Arcium MXE `queue_computation` instruction expects:
```rust
// ✅ CORRECT - Actual discriminator from Arcium IDL
[1, 149, 103, 13, 102, 227, 93, 164]  // 8 bytes
```

---

## Complete Fix Required

The issue is **more than just the discriminator**. Your entire CPI call structure needs to match the Arcium MXE API.

### Current Implementation Issues

1. **Wrong discriminator** (line 147)
2. **Wrong argument format** (lines 149-161)
3. **Missing required accounts**
4. **Incorrect data serialization**

---

## The Correct queue_computation API

### Discriminator
```rust
[1, 149, 103, 13, 102, 227, 93, 164]
```

### Required Arguments (in order)

```rust
pub struct QueueComputationArgs {
    // 1. Computation offset (u64) - unique ID for this computation
    pub comp_offset: u64,

    // 2. Computation definition offset (u32) - which circuit to use
    pub computation_definition_offset: u32,

    // 3. Cluster index (Option<u16>) - which cluster to use (None = any available)
    pub cluster_index: Option<u16>,

    // 4. Arguments (Vec<Argument>) - encrypted inputs for the circuit
    pub args: Vec<Argument>,

    // 5. MXE program ID (Pubkey) - the MXE program public key
    pub mxe_program: Pubkey,

    // 6. Callback URL (Option<String>) - for large results
    pub callback_url: Option<String>,

    // 7. Custom callback instructions (Vec<CallbackInstruction>)
    pub custom_callback_instructions: Vec<CallbackInstruction>,

    // 8. Input delivery fee (u64)
    pub input_delivery_fee: u64,

    // 9. Output delivery fee (u64)
    pub output_delivery_fee: u64,

    // 10. CU price micro (u64) - priority fee
    pub cu_price_micro: u64,
}
```

### Required Accounts (in order)

1. **signer** (mut, signer) - Transaction signer who pays
2. **sign_seed** (signer) - PDA: `["SignerMXEAccount", mxe_program]`
3. **executing_pool** (mut) - PDA: `["Execpool", mxe_program]`
4. **mempool** (mut) - PDA: `["Mempool", mxe_program]`
5. **comp_def_acc** - PDA: `["ComputationDefinitionAccount", comp_def_offset_bytes, mxe_program]`
6. **computation** (mut) - PDA: `["Computation", comp_offset_bytes, mxe_program]`
7. **cluster** - PDA: `["ClusterAccount", cluster_offset_bytes, mxe_program]`
8. **staking_pool** - PDA: `["StakePool", mxe_program]`
9. **system_program** - SystemProgram ID
10. **clock** - PDA: `["ClockAccount"]`

---

## Recommended Solution

### Option 1: Use Arcium SDK (Recommended)

**Don't manually build the CPI call.** Use the Arcium SDK instead:

```rust
// In Cargo.toml
[dependencies]
arcium-client = "0.3.0"  # Or latest version

// In your code
use arcium_client::{queue_computation, Argument};

// Then call it properly
queue_computation(
    ctx,
    comp_offset,
    computation_definition_offset,
    None,  // cluster_index
    args,
    mxe_program_id,
    None,  // callback_url
    vec![], // custom_callback_instructions
    0,  // input_delivery_fee
    0,  // output_delivery_fee
    0,  // cu_price_micro
)?;
```

### Option 2: Manual CPI (Complex)

If you must build it manually, you need to:

1. Import Borsh for proper serialization
2. Define all the data structures (Argument, CallbackInstruction, etc.)
3. Serialize each argument correctly with Borsh
4. Derive all PDAs correctly
5. Pass all accounts in the correct order

**This is NOT recommended** because:
- You need to replicate Arcium's internal data structures
- Risk of version mismatches
- Hard to maintain

---

## Step-by-Step Fix

### Step 1: Update Cargo.toml

Add the Arcium client dependency:

```toml
[dependencies]
arcium-client = { version = "0.3.0", features = ["cpi"] }
# Or use the path if you have it locally
# arcium-client = { path = "../arcium-client", features = ["cpi"] }
```

### Step 2: Update integration.rs

Replace the `queue_mxe_computation` function with proper SDK calls:

```rust
use arcium_client::{
    cpi::accounts::QueueComputation,
    cpi::queue_computation,
    program::Arcium,
    Argument,
};

pub fn queue_mxe_computation<'info>(
    mxe_program: &Program<'info, Arcium>,
    signer: &Signer<'info>,
    sign_seed_pda: &AccountInfo<'info>,
    executing_pool: &AccountInfo<'info>,
    mempool: &AccountInfo<'info>,
    comp_def_acc: &AccountInfo<'info>,
    computation: &AccountInfo<'info>,
    cluster: &AccountInfo<'info>,
    staking_pool: &AccountInfo<'info>,
    system_program: &Program<'info, System>,
    clock: &AccountInfo<'info>,
    comp_offset: u64,
    computation_definition_offset: u32,
    args: Vec<Argument>,
) -> Result<()> {
    msg!("[ARCIUM MPC] Queueing computation via CPI");

    let cpi_accounts = QueueComputation {
        signer: signer.to_account_info(),
        sign_seed: sign_seed_pda.to_account_info(),
        executing_pool: executing_pool.to_account_info(),
        mempool: mempool.to_account_info(),
        comp_def_acc: comp_def_acc.to_account_info(),
        computation: computation.to_account_info(),
        cluster: cluster.to_account_info(),
        staking_pool: staking_pool.to_account_info(),
        system_program: system_program.to_account_info(),
        clock: clock.to_account_info(),
    };

    let cpi_ctx = CpiContext::new(
        mxe_program.to_account_info(),
        cpi_accounts,
    );

    queue_computation(
        cpi_ctx,
        comp_offset,
        computation_definition_offset,
        None,  // cluster_index - None means any available cluster
        args,
        mxe_program.key(),
        None,  // callback_url
        vec![], // custom_callback_instructions
        0,  // input_delivery_fee
        0,  // output_delivery_fee
        0,  // cu_price_micro (priority fee)
    )?;

    msg!("[ARCIUM MPC] Computation queued successfully");

    Ok(())
}
```

### Step 3: Update Account Derivation

You need to derive all the PDAs correctly. Add helper functions:

```rust
use anchor_lang::solana_program::hash::hash;

/// Derive sign_seed PDA
pub fn get_sign_seed_pda(mxe_program: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"SignerMXEAccount", mxe_program.as_ref()],
        &ARCIUM_PROGRAM_ID,
    )
}

/// Derive executing pool PDA
pub fn get_executing_pool_pda(mxe_program: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"Execpool", mxe_program.as_ref()],
        &ARCIUM_PROGRAM_ID,
    )
}

/// Derive mempool PDA
pub fn get_mempool_pda(mxe_program: &Pubkey) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[b"Mempool", mxe_program.as_ref()],
        &ARCIUM_PROGRAM_ID,
    )
}

/// Derive computation definition account PDA
pub fn get_comp_def_pda(mxe_program: &Pubkey, comp_def_offset: u32) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"ComputationDefinitionAccount",
            &comp_def_offset.to_le_bytes(),
            mxe_program.as_ref(),
        ],
        &ARCIUM_PROGRAM_ID,
    )
}

/// Derive computation account PDA
pub fn get_computation_pda(mxe_program: &Pubkey, comp_offset: u64) -> (Pubkey, u8) {
    Pubkey::find_program_address(
        &[
            b"Computation",
            &comp_offset.to_le_bytes(),
            mxe_program.as_ref(),
        ],
        &ARCIUM_PROGRAM_ID,
    )
}
```

---

## Alternative: Use Frontend-Only Approach

Given the complexity, you might want to **skip the CPI entirely** and have your frontend call the Arcium MXE program directly:

### Benefits:
- ✅ Simpler smart contract code
- ✅ Frontend already has the Arcium SDK installed
- ✅ Easier to debug and maintain
- ✅ No need to replicate complex CPI logic

### Implementation:

**In your Solana program:**
```rust
// Just store that a shuffle is pending
game.shuffle_pending = true;
game.shuffle_id = game_id;
```

**In your frontend:**
```typescript
// 1. Mark game as needing shuffle (smart contract call)
await program.methods.requestShuffle().rpc();

// 2. Queue MPC computation (direct call to Arcium)
const arciumProgram = getArciumProgram(connection);
await arciumProgram.methods
    .queueComputation(
        comp_offset,
        computation_definition_offset,
        null, // cluster_index
        args,
        mxeProgram,
        null, // callback_url
        [], // custom_callback_instructions
        new BN(0), // input_delivery_fee
        new BN(0), // output_delivery_fee
        new BN(0), // cu_price_micro
    )
    .accounts({
        // ... all required accounts
    })
    .rpc();

// 3. Wait for callback, then finalize (smart contract call)
await program.methods.finalizeShuffle(result).rpc();
```

---

## Summary of Fixes Needed

1. **Replace the placeholder discriminator** `&[0x01]` with `[1, 149, 103, 13, 102, 227, 93, 164]`

2. **Fix the argument format** - Don't serialize raw encrypted data, use proper `Argument` enum types

3. **Add all missing accounts** - You need 10 accounts, not just 5

4. **Use proper data structures** - Import from `arcium-client` or define them matching the IDL

5. **Consider the frontend-only approach** - Might be simpler for your use case

---

## Testing the Fix

After implementing the fix:

```bash
# 1. Rebuild
cd /home/a/arcium_poker
arcium build

# 2. Redeploy
anchor upgrade target/deploy/arcium_poker.so \
    --program-id 5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn \
    --provider.cluster devnet

# 3. Test from frontend
# Your frontend should no longer see error 0x65
```

---

## Resources

- **Arcium Docs:** https://docs.arcium.com/developers/program
- **Arcium IDL Location:** `node_modules/@arcium-hq/client/build/index.cjs` (line 7918)
- **queue_computation Discriminator:** `[1, 149, 103, 13, 102, 227, 93, 164]`
- **Solana Error 0x65:** InstructionFallbackNotFound = Wrong discriminator or instruction not found

---

## Recommended Next Steps

1. **Decide on approach:**
   - Option A: Use Arcium SDK for CPI (complex but integrated)
   - Option B: Frontend-only MXE calls (simpler)

2. **If using SDK approach:**
   - Add `arcium-client` dependency to Cargo.toml
   - Update `integration.rs` with proper SDK calls
   - Derive all required PDAs correctly

3. **If using frontend approach:**
   - Simplify smart contract to just track state
   - Implement MXE calls in your React frontend
   - Handle callbacks and finalization

4. **Test thoroughly on devnet** before any mainnet deployment

---

**Status:** Issue identified, fix documented, ready for implementation

**Created:** October 26, 2025
