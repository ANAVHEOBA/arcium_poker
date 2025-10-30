# MXE Program ID for Frontend

## Date: October 26, 2025

---

## The Answer You Need

**Arcium Network MXE Program ID:**
```
BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6
```

This is the program ID your frontend needs for the `mxeProgram` parameter.

---

## Understanding the Two Program IDs

Your frontend needs to work with **TWO different program IDs**:

### 1. Your Poker Program (Callback Program)
```typescript
const POKER_PROGRAM_ID = "5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn";
```
- This is YOUR deployed poker contract
- Used for game logic (initialize_game, join_game, bet, etc.)
- This is what you created and deployed

### 2. Arcium Network Program (MXE Program)
```typescript
const ARCIUM_MXE_PROGRAM_ID = "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6";
```
- This is the official Arcium network program
- Used for MPC computations (shuffle, deal, reveal)
- This is deployed by Arcium and available on all networks

---

## Frontend Configuration

### Fix Your Error

Your frontend error was:
```
Error: Account `mxeProgram` not provided.
```

This happened because you were using:
```typescript
// ❌ WRONG
const mxeProgram = "5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn"
```

Should be:
```typescript
// ✅ CORRECT
const mxeProgram = "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
```

---

## Complete Frontend Setup

### Step 1: Install Arcium Packages

```bash
npm install @arcium-hq/client @arcium-hq/reader
```

### Step 2: Configure Program IDs

```typescript
import { AnchorProvider, Program } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { getArciumProgramReadonly } from '@arcium-hq/reader';

// Your poker program
const POKER_PROGRAM_ID = new PublicKey("5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn");

// Arcium MXE program (for MPC)
const ARCIUM_PROGRAM_ID = new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6");

// Connection
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// Load your poker program
const pokerIdl = await fetch('/path/to/arcium_poker.json').then(r => r.json());
const pokerProgram = new Program(pokerIdl, POKER_PROGRAM_ID, provider);

// Load Arcium MXE program (for MPC operations)
const arciumProgram = getArciumProgramReadonly(connection);
```

### Step 3: Use Both Programs Together

```typescript
import { getMXEAccAddress } from '@arcium-hq/reader';

// When you need to interact with MPC
async function shuffleDeck(gameId: number) {
  // 1. Derive your game's MXE account
  const [mxeAccount] = await getMXEAccAddress(
    POKER_PROGRAM_ID,  // Your poker program (callback)
    0                   // MXE offset (from init-mxe)
  );

  // 2. Call your poker program's shuffle instruction
  await pokerProgram.methods
    .shuffleDeck()
    .accounts({
      game: gamePda,
      mxeProgram: ARCIUM_PROGRAM_ID,  // ✅ Use Arcium program here
      mxeAccount: mxeAccount,
      // ... other accounts
    })
    .rpc();
}
```

---

## When to Use Which Program ID

| Use Case | Program ID to Use | Variable Name |
|----------|-------------------|---------------|
| Game instructions (initialize, join, bet, fold) | `5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn` | `POKER_PROGRAM_ID` |
| MPC operations (shuffle, deal, reveal) - `mxeProgram` account | `BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6` | `ARCIUM_PROGRAM_ID` |
| Reading MXE account data | `BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6` | `ARCIUM_PROGRAM_ID` |
| Callback program in MXE init | `5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn` | `POKER_PROGRAM_ID` |

---

## Full Example: Initialize Game with MPC

```typescript
import { BN } from '@coral-xyz/anchor';
import { SystemProgram } from '@solana/web3.js';
import { getMXEAccAddress } from '@arcium-hq/reader';

const POKER_PROGRAM_ID = new PublicKey("5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn");
const ARCIUM_PROGRAM_ID = new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6");

async function initializeGame(
  gameId: number,
  smallBlind: number,
  bigBlind: number,
  buyIn: number
) {
  // Derive game PDA
  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("game"), new BN(gameId).toArrayLike(Buffer, "le", 8)],
    POKER_PROGRAM_ID  // ✅ Use your poker program
  );

  // Derive MXE account
  const [mxeAccount] = await getMXEAccAddress(
    POKER_PROGRAM_ID,  // Your poker program is the callback program
    0                   // MXE offset from init-mxe
  );

  // Initialize game
  const tx = await pokerProgram.methods
    .initializeGame(
      new BN(gameId),
      new BN(smallBlind),
      new BN(bigBlind),
      new BN(buyIn)
    )
    .accounts({
      game: gamePda,
      authority: wallet.publicKey,
      mxeProgram: ARCIUM_PROGRAM_ID,  // ✅ Arcium MXE program
      mxeAccount: mxeAccount,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  console.log("Game initialized:", tx);
  return tx;
}
```

---

## Where This ID Comes From

The Arcium MXE Program ID (`BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6`) is:

1. **Official Arcium Network Program**: Deployed and maintained by Arcium
2. **Available in Their SDK**: Exported from `@arcium-hq/client` and `@arcium-hq/reader`
3. **Same Across Networks**: Used on devnet, testnet, and mainnet
4. **Not Your Program**: You don't deploy this - it's already deployed by Arcium

You can verify it in your node_modules:
```bash
grep -r "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6" node_modules/@arcium-hq
```

---

## Quick Reference Card

Copy this into your frontend constants file:

```typescript
// constants.ts
import { PublicKey } from '@solana/web3.js';

export const NETWORK = "devnet";
export const RPC_ENDPOINT = "https://api.devnet.solana.com";

// Your poker program
export const POKER_PROGRAM_ID = new PublicKey(
  "5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn"
);

// Arcium MXE program (for MPC)
export const ARCIUM_MXE_PROGRAM_ID = new PublicKey(
  "BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"
);

// MXE configuration (from your deployment)
export const MXE_OFFSET = 0;
export const CLUSTER_OFFSET = 1078779259;
```

---

## Testing Your Fix

After updating your frontend code:

1. Open browser console
2. Check that you see:
   ```
   Poker Program: 5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn
   MXE Program: BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6  ✅
   ```

3. Try initializing a game - the `mxeProgram` error should be gone!

---

## Summary

**Question**: "what the mxe program id"

**Answer**: `BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6`

**Usage**: Use this as the `mxeProgram` account in all MPC-related instructions (shuffle, deal, reveal).

**Don't confuse with**: Your poker program ID (`5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn`) which is used for game logic.

---

## Need More Help?

- See `FRONTEND_INTEGRATION_GUIDE.md` for complete integration guide
- See `MXE_DEPLOYMENT_SUCCESS.md` for deployment details
- Check Arcium docs: https://docs.arcium.com

---

**Your frontend should now work! ✅**
