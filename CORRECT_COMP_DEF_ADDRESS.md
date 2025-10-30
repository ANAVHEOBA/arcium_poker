# ✅ CORRECT Comp Def Address - Must Be Derived PDA!

## Problem

The frontend is passing `AEw7wNnzB5zPpj92FHgqf3Pwyd5cqdG5Cus4pofCnbk9` as the comp_def, but Arcium rejects it with Error 3002 (Account Discriminator Mismatch).

## Root Cause

The comp_def account must be a **derived PDA**, not one of the accounts created by `init-mxe`.

According to the Arcium IDL, the comp_def PDA is derived from:
- Seed 1: `"ComputationDefinitionAccount"` (constant)
- Seed 2: `mxe_program` (the MXE program ID: `BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6`)
- Seed 3: `comp_def_offset` (u32, little-endian, value: `1`)
- Program: `BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6` (MXE program)

## Correct Comp Def Address

**Derived PDA:** `2ySMsfh6YDwwDQMZPikbVNtcgGNwFauGR5HYEdZonWwF`

## Frontend Fix Required

Update `hooks/useArciumMXE.ts` or equivalent:

### OLD (WRONG):
```typescript
const COMP_DEF = new PublicKey("AEw7wNnzB5zPpj92FHgqf3Pwyd5cqdG5Cus4pofCnbk9");
```

### NEW (CORRECT - Derive the PDA):
```typescript
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

const MXE_PROGRAM = new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6");
const COMP_DEF_OFFSET = 1;

// Derive comp_def PDA
function getCompDefPDA(): PublicKey {
  const offsetBytes = Buffer.alloc(4);
  offsetBytes.writeUInt32LE(COMP_DEF_OFFSET);

  const [compDefPDA] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("ComputationDefinitionAccount"),
      MXE_PROGRAM.toBuffer(),
      offsetBytes
    ],
    MXE_PROGRAM
  );

  return compDefPDA;
}

// Use the derived PDA
const COMP_DEF = getCompDefPDA(); // Returns: 2ySMsfh6YDwwDQMZPikbVNtcgGNwFauGR5HYEdZonWwF
```

## Updated Configuration

```typescript
export const ARCIUM_CONFIG = {
  programId: new PublicKey("B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W"),
  mxeProgram: new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"),

  clusterOffset: 1078779259,
  compDefOffset: 1,

  accounts: {
    mxeAccount: new PublicKey("HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo"),
    compDef: getCompDefPDA(), // ← DERIVED PDA
    mempool: new PublicKey("CaTxKKfdaoCM7ZzLj5dLzrrmnsg9GJb5iYzRzCk8VEu3"),
    executingPool: new PublicKey("94ZeSmg21ktsHWPbRSYqtu77T4SUKNoEj9qn8c6zjLxH"),
    cluster: new PublicKey("XEDRk3i1BK9vwU4tnaBQRG2bi77QCxtBHhsbSLqXD6z"),
    signSeed: new PublicKey("855kV52vroBmanfaL2QLcoPyioGPd12USBcFAsibtJnP"),
    stakingPool: new PublicKey("xVwyypubQUe6rrgKPXXZDSDbJzRZH67cSKgdsGaE6oD"),
  },
};
```

## Note About Account Creation

The comp_def PDA (`2ySMs...`) **does not exist yet** on-chain. It will be created automatically when:
- The first `queue_computation` call is made, OR
- We need to run a separate initialization step

The Arcium program should handle creating it during the first queue_computation call if it's marked as `init` in the instruction.

## Testing

After updating the frontend:
1. Rebuild/restart your frontend
2. Try starting a game
3. Check the transaction logs - it should now pass validation

## All Correct Addresses

```typescript
MXE_PROGRAM: BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6
PROGRAM_ID: B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W

MXE_ACCOUNT: HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo
COMP_DEF: 2ySMsfh6YDwwDQMZPikbVNtcgGNwFauGR5HYEdZonWwF  ← DERIVED PDA
MEMPOOL: CaTxKKfdaoCM7ZzLj5dLzrrmnsg9GJb5iYzRzCk8VEu3
EXECUTING_POOL: 94ZeSmg21ktsHWPbRSYqtu77T4SUKNoEj9qn8c6zjLxH
CLUSTER: XEDRk3i1BK9vwU4tnaBQRG2bi77QCxtBHhsbSLqXD6z
SIGN_SEED: 855kV52vroBmanfaL2QLcoPyioGPd12USBcFAsibtJnP
STAKING_POOL: xVwyypubQUe6rrgKPXXZDSDbJzRZH67cSKgdsGaE6oD
```

---

**Status:** Frontend needs to derive comp_def PDA instead of using hardcoded address
**Action Required:** Update frontend configuration with PDA derivation
**Expected Result:** Error 3002 on comp_def_acc should be resolved
