# 🔧 Completing Placeholder Functions for Real MPC

This guide shows exactly which functions are placeholders and how to complete them.

---

## 📋 Placeholder Functions to Complete

### Summary

| File | Function | Status | Action Required |
|------|----------|--------|-----------------|
| `arcium/integration.rs` | `encrypt_for_mxe()` | ❌ Stub | Move to client-side |
| `arcium/integration.rs` | `decrypt_from_mxe()` | ❌ Stub | Move to client-side |
| `arcium/integration.rs` | `init_computation_definition()` | ⚠️ Partial | Complete CPI call |
| `arcium/integration.rs` | `queue_mxe_computation()` | ⚠️ Partial | Fix discriminator |
| `arcium/mpc_shuffle.rs` | Helper functions | ❌ Unused | Remove dead code |
| `security/zkp.rs` | All ZKP functions | ❌ Placeholder | Optional (future) |

---

## 1️⃣ **Encryption/Decryption (Client-Side)**

### Problem

Lines 192-217 in `programs/arcium_poker/src/arcium/integration.rs`:

```rust
pub fn encrypt_for_mxe(
    _data: &[u8],
    nonce: [u8; 16],
) -> Result<EncryptedData> {
    // ❌ In production, use RescueCipher from SDK
    // For now, return placeholder
    Ok(EncryptedData {
        ciphertext: [0u8; 32],  // ❌ PLACEHOLDER
        nonce,
        owner: None,
    })
}
```

### Solution

**These functions should NOT be in Solana program!** Encryption happens client-side.

#### Action 1: Remove from Solana Program

These functions are never called by your program. You can safely remove them or mark them as deprecated:

```rust
/// ⚠️ DEPRECATED: Encryption must be done CLIENT-SIDE
/// Use @arcium-hq/client SDK instead
#[deprecated(note = "Use client-side RescueCipher from @arcium-hq/client")]
pub fn encrypt_for_mxe(
    _data: &[u8],
    nonce: [u8; 16],
) -> Result<EncryptedData> {
    msg!("[ERROR] encrypt_for_mxe called - this should be client-side only");
    Err(ErrorCode::EncryptionFailed.into())
}
```

#### Action 2: Implement Client-Side (TypeScript)

Create `tests/helpers/mxe_crypto.ts`:

```typescript
import { RescueCipher, generateKeypair } from "@arcium-hq/client";

/**
 * Encrypt data for Arcium MXE
 */
export function encryptForMxe(
  data: Uint8Array,
  ownerPublicKey?: Uint8Array
): {
  ciphertext: Uint8Array;
  nonce: Uint8Array;
  publicKey?: Uint8Array;
} {
  const cipher = new RescueCipher();
  const keypair = generateKeypair();
  const nonce = new Uint8Array(16);
  crypto.getRandomValues(nonce);

  const ciphertext = cipher.encrypt(
    data,
    keypair.secretKey,
    nonce
  );

  return {
    ciphertext,
    nonce,
    publicKey: ownerPublicKey,
  };
}

/**
 * Decrypt data from Arcium MXE
 */
export function decryptFromMxe(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  secretKey: Uint8Array
): Uint8Array {
  const cipher = new RescueCipher();
  return cipher.decrypt(ciphertext, secretKey, nonce);
}

/**
 * Generate player entropy (32 random bytes)
 */
export function generateEntropy(): Uint8Array {
  const entropy = new Uint8Array(32);
  crypto.getRandomValues(entropy);
  return entropy;
}
```

**Usage in tests:**

```typescript
import { encryptForMxe, generateEntropy } from "./helpers/mxe_crypto";

// Generate and encrypt entropy
const entropy = generateEntropy();
const encrypted = encryptForMxe(entropy);

// Pass to program
await program.methods
  .startGame([Array.from(encrypted.ciphertext)])
  .accounts({ ... })
  .rpc();
```

---

## 2️⃣ **Fix Computation Queue (CPI Call)**

### Problem

Line 101 in `programs/arcium_poker/src/arcium/integration.rs`:

```rust
pub fn queue_mxe_computation<'info>(
    // ...
) -> Result<[u8; 32]> {
    // Build instruction data for Arcium's queue_computation
    let mut ix_data = Vec::new();

    // Instruction discriminator (queue_computation)
    ix_data.extend_from_slice(&[0x01]); // ❌ Placeholder discriminator

    // ...
}
```

### Solution

Get the correct discriminator for Arcium MXE's `queue_computation` instruction.

#### Option A: Use Anchor Discriminator

If Arcium MXE uses Anchor:

```rust
// At top of file
use anchor_lang::Discriminator;

pub fn queue_mxe_computation<'info>(
    // ... params ...
) -> Result<[u8; 32]> {
    let mut ix_data = Vec::new();

    // Get discriminator for "queue_computation" instruction
    // Anchor discriminator = first 8 bytes of sha256("global:queue_computation")
    let discriminator = anchor_lang::solana_program::hash::hash(
        b"global:queue_computation"
    ).to_bytes();
    ix_data.extend_from_slice(&discriminator[..8]);

    // Computation offset
    ix_data.extend_from_slice(&computation_offset);

    // ... rest of function ...
}
```

#### Option B: Get from Arcium Docs

Check Arcium documentation for the exact instruction format:

```rust
// Example - Get real values from Arcium docs
pub const QUEUE_COMPUTATION_DISCRIMINATOR: [u8; 8] = [
    0x12, 0x34, 0x56, 0x78,  // Replace with real discriminator
    0x9a, 0xbc, 0xde, 0xf0,
];

pub fn queue_mxe_computation<'info>(
    // ... params ...
) -> Result<[u8; 32]> {
    let mut ix_data = Vec::new();

    // Use correct discriminator
    ix_data.extend_from_slice(&QUEUE_COMPUTATION_DISCRIMINATOR);

    // ... rest ...
}
```

#### Option C: Use MXE Client SDK

Best approach - let Arcium's SDK handle it:

```rust
// In Cargo.toml
[dependencies]
arcium-sdk = "0.3.0"  // Add this

// In integration.rs
use arcium_sdk::mxe::queue_computation;

pub fn queue_mxe_computation<'info>(
    // ... params ...
) -> Result<[u8; 32]> {
    // Use SDK helper instead of manual CPI
    let computation_id = arcium_sdk::mxe::queue_computation(
        mxe_program,
        comp_def,
        mempool,
        cluster,
        computation_account,
        authority,
        instruction_index,
        encrypted_inputs,
        computation_offset,
    )?;

    Ok(computation_id)
}
```

---

## 3️⃣ **Complete Init Comp Def**

### Problem

Lines 60-77 in `programs/arcium_poker/src/arcium/integration.rs`:

```rust
pub fn init_computation_definition(
    comp_def_account: &AccountInfo,
    mxe_account: &AccountInfo,
    authority: &Signer,
    system_program: &Program<System>,
    comp_def_offset: u32,
    instruction_index: u8,
) -> Result<()> {
    msg!("[ARCIUM] Initializing computation definition {}", comp_def_offset);

    // ❌ In production, this would call Arcium's init_comp_def instruction
    // For now, log that it should be initialized externally
    msg!("[ARCIUM] Note: Comp def should be initialized via Arcium CLI or client SDK");

    Ok(())  // ❌ Does nothing!
}
```

### Solution

Actually call Arcium MXE to register the computation:

```rust
use anchor_lang::solana_program::program::invoke_signed;

pub fn init_computation_definition(
    comp_def_account: &AccountInfo,
    mxe_account: &AccountInfo,
    authority: &Signer,
    system_program: &Program<System>,
    comp_def_offset: u32,
    instruction_index: u8,
) -> Result<()> {
    msg!("[ARCIUM] Initializing computation definition {}", comp_def_offset);
    msg!("[ARCIUM] Instruction index: {}", instruction_index);

    // Build instruction data
    let mut ix_data = Vec::new();

    // Discriminator for init_comp_def (get from Arcium docs)
    ix_data.extend_from_slice(&INIT_COMP_DEF_DISCRIMINATOR);

    // Comp def offset
    ix_data.extend_from_slice(&comp_def_offset.to_le_bytes());

    // Instruction index in your encrypted-ixs program
    ix_data.push(instruction_index);

    // Number of inputs/outputs (depends on your circuit)
    ix_data.push(2); // Example: shuffle has 2 inputs (deck + entropy)
    ix_data.push(1); // Example: shuffle has 1 output (shuffled deck)

    // Create account metas
    let account_metas = vec![
        anchor_lang::solana_program::instruction::AccountMeta::new(
            *comp_def_account.key,
            false
        ),
        anchor_lang::solana_program::instruction::AccountMeta::new(
            *mxe_account.key,
            false
        ),
        anchor_lang::solana_program::instruction::AccountMeta::new(
            *authority.key,
            true
        ),
        anchor_lang::solana_program::instruction::AccountMeta::new_readonly(
            *system_program.key,
            false
        ),
    ];

    // Create instruction
    let ix = anchor_lang::solana_program::instruction::Instruction {
        program_id: Pubkey::from_str(ARCIUM_PROGRAM_ID).unwrap(),
        accounts: account_metas,
        data: ix_data,
    };

    // Invoke via CPI
    let account_infos = &[
        comp_def_account.clone(),
        mxe_account.clone(),
        authority.to_account_info(),
        system_program.to_account_info(),
    ];

    invoke_signed(&ix, account_infos, &[])?;

    msg!("[ARCIUM] Computation definition initialized successfully");

    Ok(())
}
```

---

## 4️⃣ **Remove Dead Code**

### Problem

Lines 361-412 in `programs/arcium_poker/src/arcium/mpc_shuffle.rs`:

```rust
warning: function `create_mxe_instruction` is never used
warning: function `invoke_mxe_computation` is never used
warning: function `generate_session_id_from_offset` is never used
```

### Solution

Remove these unused functions to clean up warnings:

```bash
# Edit: programs/arcium_poker/src/arcium/mpc_shuffle.rs
# Delete lines 361-412 (or comment them out)
```

Or mark as `#[allow(dead_code)]` if you plan to use them later:

```rust
#[allow(dead_code)]
fn create_mxe_instruction(
    // ...
) {
    // ...
}
```

---

## 5️⃣ **Zero-Knowledge Proofs (Optional)**

### Problem

Lines in `programs/arcium_poker/src/security/zkp.rs`:

```rust
pub fn generate_shuffle_proof(
    // ...
) -> Result<Vec<u8>> {
    // For MVP, return a placeholder proof
    Ok(vec![1, 2, 3, 4])  // ❌ PLACEHOLDER
}
```

### Solution (Optional - Future Enhancement)

ZKP functions are **optional** and not required for basic MPC operation. You can:

**Option A:** Leave as-is (placeholder proofs)
**Option B:** Remove entirely if not needed
**Option C:** Implement real ZK proofs later

If you want to implement real ZKPs, consider using:

```rust
// Add to Cargo.toml
[dependencies]
arkworks-groth16 = "0.4"
arkworks-bn254 = "0.4"

// In zkp.rs
use ark_groth16::{Groth16, Proof};
use ark_bn254::Bn254;

pub fn generate_shuffle_proof(
    shuffled_deck: &[u8; 52],
    original_deck: &[u8; 52],
    entropy: &[u8; 32],
) -> Result<Vec<u8>> {
    // Generate real ZK proof that shuffle was correct
    // without revealing the shuffle mapping

    // This is complex - consider if you really need it
    // Arcium MPC already provides cryptographic guarantees

    todo!("Implement ZK shuffle proof using arkworks");
}
```

**Recommendation:** Leave ZKPs as placeholders for now. Arcium's MPC provides sufficient cryptographic guarantees without additional ZK proofs.

---

## ✅ Summary: What to Do

### Must Complete (For Real MPC)

1. ✅ **Move encryption to client-side** - Create `tests/helpers/mxe_crypto.ts`
2. ✅ **Fix CPI discriminator** - Get real Arcium MXE instruction discriminator
3. ✅ **Complete init_comp_def** - Make actual CPI call to register circuits
4. ✅ **Update MXE_PROGRAM_ID** - Replace placeholder with real devnet ID

### Should Complete (Cleanup)

5. ⚠️ **Remove dead code** - Delete unused helper functions
6. ⚠️ **Fix compiler warnings** - Prefix unused params with `_`

### Optional (Future)

7. 🔜 **Implement ZKPs** - Only if you need additional proof layer
8. 🔜 **Add error handling** - More robust error messages

---

## 🧪 Testing Your Changes

After completing the above, test each function:

```bash
# 1. Test client-side encryption
npm test tests/test_mxe_crypto.ts

# 2. Test comp def initialization
npm test tests/test_init_comp_def.ts

# 3. Test full MPC shuffle
npm test tests/test_real_mxe_shuffle.ts

# 4. Run all tests
npm test
```

---

## 📝 Diff Preview

Here's what your code should look like after fixes:

### Before (Placeholder)
```rust
// ❌ OLD
ix_data.extend_from_slice(&[0x01]); // Placeholder discriminator
```

### After (Real)
```rust
// ✅ NEW
ix_data.extend_from_slice(&QUEUE_COMPUTATION_DISCRIMINATOR);
```

---

## 🔍 Verification

After completing all changes, verify:

```bash
# No compilation warnings
anchor build 2>&1 | grep -i warning
# Should show minimal warnings

# All functions implemented
rg "TODO|FIXME|PLACEHOLDER" programs/arcium_poker/src/arcium/
# Should return few/no results in arcium/ directory

# Tests pass
npm test
# Should show passing tests
```

---

## 📚 References

- **Arcium MXE API**: https://docs.arcium.com/api/mxe
- **Rescue Cipher**: https://docs.arcium.com/cryptography/rescue
- **CPI Examples**: https://github.com/arcium-hq/examples/tree/main/cpi
- **Client SDK Docs**: https://docs.arcium.com/sdk/client

---

**Next Step:** See `ENABLE_REAL_MPC_ON_DEVNET.md` for full deployment guide.
