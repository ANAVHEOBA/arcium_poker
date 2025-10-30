# ✅ CORRECT Arcium MXE Addresses

## The Problem

The PDA derivation we used didn't match what Arcium actually creates. We computed addresses like `3XCqEWHvKCdzJyuDAJGwTdQqwZXDmezTfM7iwPHv9xES` but Arcium created different addresses.

## The Real Addresses (from init-mxe transaction)

These are the ACTUAL addresses created by `arcium init-mxe`:

| Account Type | Address | Size | Purpose |
|--------------|---------|------|---------|
| **MXE Account** | `4khWoKYyqcfnV7xexutvJFQMyj6ekM7E8gdvcH7fy4Ba` | 8696 bytes | Main MXE account |
| **Mempool** | `CaTxKKfdaoCM7ZzLj5dLzrrmnsg9GJb5iYzRzCk8VEu3` | 8444 bytes | Queue for computations |
| **Comp Def** | `AEw7wNnzB5zPpj92FHgqf3Pwyd5cqdG5Cus4pofCnbk9` | 152 bytes | Computation definition |
| **Sign Seed** | `HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo` | 102 bytes | Signing seed PDA |
| **Unknown** | `855kV52vroBmanfaL2QLcoPyioGPd12USBcFAsibtJnP` | 100 bytes | (TBD) |
| **Executing Pool** | `94ZeSmg21ktsHWPbRSYqtu77T4SUKNoEj9qn8c6zjLxH` | 80 bytes | Pool of executing computations |

**Static accounts (from previous computation):**
- **Cluster:** `XEDRk3i1BK9vwU4tnaBQRG2bi77QCxtBHhsbSLqXD6z` ✅
- **Staking Pool:** `xVwyypubQUe6rrgKPXXZDSDbJzRZH67cSKgdsGaE6oD` ✅

---

## 🔧 Frontend Configuration (CORRECTED)

### Update your `hooks/useArciumMXE.ts`:

```typescript
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

// ============================================================================
// ARCIUM MXE CONFIGURATION - CORRECTED ADDRESSES
// ============================================================================

export const ARCIUM_CONFIG = {
  // Program IDs
  programId: new PublicKey("B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W"),
  mxeProgram: new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"),

  // Cluster Configuration
  clusterOffset: 1078779259,
  compDefOffset: 1,

  // ✅ CORRECTED MXE Accounts (from actual init-mxe transaction)
  accounts: {
    mxeAccount: new PublicKey("4khWoKYyqcfnV7xexutvJFQMyj6ekM7E8gdvcH7fy4Ba"),
    compDef: new PublicKey("AEw7wNnzB5zPpj92FHgqf3Pwyd5cqdG5Cus4pofCnbk9"),
    mempool: new PublicKey("CaTxKKfdaoCM7ZzLj5dLzrrmnsg9GJb5iYzRzCk8VEu3"),
    executingPool: new PublicKey("94ZeSmg21ktsHWPbRSYqtu77T4SUKNoEj9qn8c6zjLxH"),
    cluster: new PublicKey("XEDRk3i1BK9vwU4tnaBQRG2bi77QCxtBHhsbSLqXD6z"),
    signSeed: new PublicKey("HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo"),
    stakingPool: new PublicKey("xVwyypubQUe6rrgKPXXZDSDbJzRZH67cSKgdsGaE6oD"),
  },
};

// ============================================================================
// COMPUTATION ACCOUNT (Dynamic per game)
// ============================================================================

/**
 * Get the computation account for a specific game
 */
export function getComputationAccount(gameId: number | anchor.BN): PublicKey {
  const gameIdBN = typeof gameId === "number" ? new anchor.BN(gameId) : gameId;

  const [computationAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("computation"),
      ARCIUM_CONFIG.accounts.mxeAccount.toBuffer(),
      gameIdBN.toArrayLike(Buffer, "le", 8),
    ],
    ARCIUM_CONFIG.mxeProgram
  );

  return computationAccount;
}

// ============================================================================
// HELPER: Get all MXE accounts for a game
// ============================================================================

export function getMXEAccountsForGame(gameId: number) {
  return {
    mxeProgram: ARCIUM_CONFIG.mxeProgram,
    mxeAccount: ARCIUM_CONFIG.accounts.mxeAccount,
    compDef: ARCIUM_CONFIG.accounts.compDef,
    mempool: ARCIUM_CONFIG.accounts.mempool,
    executingPool: ARCIUM_CONFIG.accounts.executingPool,
    cluster: ARCIUM_CONFIG.accounts.cluster,
    computationAccount: getComputationAccount(gameId),
    signSeed: ARCIUM_CONFIG.accounts.signSeed,
    stakingPool: ARCIUM_CONFIG.accounts.stakingPool,
  };
}
```

---

## 📝 Quick Copy-Paste for Frontend

```typescript
// CORRECTED Arcium MXE Account Addresses
const MXE_PROGRAM = new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6");
const PROGRAM_ID = new PublicKey("B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W");

const MXE_ACCOUNT = new PublicKey("4khWoKYyqcfnV7xexutvJFQMyj6ekM7E8gdvcH7fy4Ba");
const COMP_DEF = new PublicKey("AEw7wNnzB5zPpj92FHgqf3Pwyd5cqdG5Cus4pofCnbk9");
const MEMPOOL = new PublicKey("CaTxKKfdaoCM7ZzLj5dLzrrmnsg9GJb5iYzRzCk8VEu3");
const EXECUTING_POOL = new PublicKey("94ZeSmg21ktsHWPbRSYqtu77T4SUKNoEj9qn8c6zjLxH");
const CLUSTER = new PublicKey("XEDRk3i1BK9vwU4tnaBQRG2bi77QCxtBHhsbSLqXD6z");
const SIGN_SEED = new PublicKey("HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo");
const STAKING_POOL = new PublicKey("xVwyypubQUe6rrgKPXXZDSDbJzRZH67cSKgdsGaE6oD");
```

---

## ✅ Verification

All accounts verified on-chain:
- ✅ MXE Account exists with 0.061 SOL
- ✅ All accounts owned by Arcium MXE program
- ✅ Proper account sizes
- ✅ Ready for use

---

## 🎯 Next Steps

1. **Update your frontend** with these corrected addresses
2. **Test start game** - Error 3012 should be fixed!
3. **Celebrate!** 🎉

The PDA derivation we used was incorrect. Arcium uses different seeds than what we assumed. These are the ACTUAL addresses from the init-mxe transaction.
