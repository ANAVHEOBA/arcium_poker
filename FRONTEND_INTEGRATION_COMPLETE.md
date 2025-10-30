# 🎮 Complete Frontend Integration Guide - Arcium Poker

## 🎉 Deployment Success!

Your Arcium Poker program has been successfully deployed to Solana Devnet with full MPC integration!

### Deployment Summary

- **Your Wallet:** `4JaZnV8M3iKSM7G9GmWowg1GFXyvk59ojo7VyEgZ49zL` (unchanged ✅)
- **New Program ID:** `B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W`
- **Network:** Devnet
- **Arcium MXE:** Initialized with computation definition offset 1 ✅
- **Status:** Ready for testing! 🚀

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [MXE Account Addresses](#mxe-account-addresses)
3. [Frontend Integration Code](#frontend-integration-code)
4. [Testing Instructions](#testing-instructions)
5. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### Step 1: Update Program ID

Update your frontend to use the new program ID:

```typescript
// In your config/constants.ts or similar
export const PROGRAM_ID = new PublicKey("B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W");
```

### Step 2: Copy MXE Configuration

Add the following MXE configuration to your frontend:

```typescript
// Arcium MXE Configuration
export const MXE_PROGRAM = new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6");
export const CLUSTER_OFFSET = 1078779259;
export const COMP_DEF_OFFSET = 1;

// MXE Account Addresses (Static - computed once)
export const MXE_ACCOUNT = new PublicKey("3XCqEWHvKCdzJyuDAJGwTdQqwZXDmezTfM7iwPHv9xES");
export const COMP_DEF = new PublicKey("HsMC9y9HZvpvDSqgc9mC8tkhuUNhi17WXisrthYJrihc");
export const MEMPOOL = new PublicKey("79DAsZwMCyfC3Gq3VmFDC3HhBwcpHjgMbTNBs9cMTsop");
export const EXECUTING_POOL = new PublicKey("CrGJx4qmyM4vkAkYfYZsSWrAxBD2RXjW18JP7sMSRzgA");
export const CLUSTER = new PublicKey("XEDRk3i1BK9vwU4tnaBQRG2bi77QCxtBHhsbSLqXD6z");
export const SIGN_SEED = new PublicKey("6WBdYnro9jRkWhtjSMEmQ2W8MiRKMCMyPvVhZH2qkPtM");
export const STAKING_POOL = new PublicKey("xVwyypubQUe6rrgKPXXZDSDbJzRZH67cSKgdsGaE6oD");
```

### Step 3: Update IDL

Regenerate your IDL and types:

```bash
cd ~/arcium_poker

# Generate new IDL (already done during deployment)
anchor build

# Copy to frontend (adjust path as needed)
cp target/idl/arcium_poker.json frontend/src/idl/
```

### Step 4: Test!

Start your frontend and test the game:

```bash
# In frontend directory
npm run dev  # or yarn dev
```

---

## 🔑 MXE Account Addresses

These are the Arcium MXE account addresses your frontend needs:

| Account Type | Address | Purpose |
|--------------|---------|---------|
| **MXE Program** | `BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6` | Arcium's MXE runtime program |
| **MXE Account** | `3XCqEWHvKCdzJyuDAJGwTdQqwZXDmezTfM7iwPHv9xES` | Main MXE account for your program |
| **Comp Def** | `HsMC9y9HZvpvDSqgc9mC8tkhuUNhi17WXisrthYJrihc` | Computation definition (shuffle) |
| **Mempool** | `79DAsZwMCyfC3Gq3VmFDC3HhBwcpHjgMbTNBs9cMTsop` | Queue for MPC computations |
| **Executing Pool** | `CrGJx4qmyM4vkAkYfYZsSWrAxBD2RXjW18JP7sMSRzgA` | Pool of executing computations |
| **Cluster** | `XEDRk3i1BK9vwU4tnaBQRG2bi77QCxtBHhsbSLqXD6z` | Arcium network cluster |
| **Sign Seed** | `6WBdYnro9jRkWhtjSMEmQ2W8MiRKMCMyPvVhZH2qkPtM` | Signing seed PDA |
| **Staking Pool** | `xVwyypubQUe6rrgKPXXZDSDbJzRZH67cSKgdsGaE6oD` | Staking pool for MXE |

---

## 💻 Frontend Integration Code

### Complete MXE Configuration

Create a file: `hooks/useArciumMXE.ts` or add to your existing config:

```typescript
import { PublicKey } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";

// ============================================================================
// ARCIUM MXE CONFIGURATION
// ============================================================================

export const ARCIUM_CONFIG = {
  // Program IDs
  programId: new PublicKey("B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W"),
  mxeProgram: new PublicKey("BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6"),

  // Cluster Configuration
  clusterOffset: 1078779259,
  compDefOffset: 1,

  // Static MXE Accounts
  accounts: {
    mxeAccount: new PublicKey("3XCqEWHvKCdzJyuDAJGwTdQqwZXDmezTfM7iwPHv9xES"),
    compDef: new PublicKey("HsMC9y9HZvpvDSqgc9mC8tkhuUNhi17WXisrthYJrihc"),
    mempool: new PublicKey("79DAsZwMCyfC3Gq3VmFDC3HhBwcpHjgMbTNBs9cMTsop"),
    executingPool: new PublicKey("CrGJx4qmyM4vkAkYfYZsSWrAxBD2RXjW18JP7sMSRzgA"),
    cluster: new PublicKey("XEDRk3i1BK9vwU4tnaBQRG2bi77QCxtBHhsbSLqXD6z"),
    signSeed: new PublicKey("6WBdYnro9jRkWhtjSMEmQ2W8MiRKMCMyPvVhZH2qkPtM"),
    stakingPool: new PublicKey("xVwyypubQUe6rrgKPXXZDSDbJzRZH67cSKgdsGaE6oD"),
  },
};

// ============================================================================
// COMPUTATION ACCOUNT (Dynamic per game)
// ============================================================================

/**
 * Get the computation account for a specific game
 * This account is unique per game and stores the MPC computation state
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

### Update `useStartGame.ts`

Update your `startGame` function to use the new configuration:

```typescript
import { ARCIUM_CONFIG, getMXEAccountsForGame } from "./useArciumMXE";

export const useStartGame = () => {
  const startGame = async (gamePda: PublicKey, gameId: number) => {
    // ... your existing code ...

    // Get MXE accounts
    const mxeAccounts = getMXEAccountsForGame(gameId);

    // Generate player entropy (one 32-byte array per player)
    const playerEntropy = players.map(() => {
      const entropy = new Uint8Array(32);
      crypto.getRandomValues(entropy);
      return Array.from(entropy);
    });

    // Build instruction
    const tx = await program.methods
      .startGame(playerEntropy)
      .accounts({
        game: gamePda,
        authority: wallet.publicKey,
        mxeProgram: mxeAccounts.mxeProgram,
        mxeAccount: mxeAccounts.mxeAccount,
        compDefAccount: mxeAccounts.compDef,
        mempoolAccount: mxeAccounts.mempool,
        executingPoolAccount: mxeAccounts.executingPool,
        clusterAccount: mxeAccounts.cluster,
        computationAccount: mxeAccounts.computationAccount,
        signSeed: mxeAccounts.signSeed,
        stakingPool: mxeAccounts.stakingPool,
        systemProgram: SystemProgram.programId,
        clock: SYSVAR_CLOCK_PUBKEY,
      })
      .remainingAccounts(
        // Add player accounts in seat order
        playerAccountsSorted.map((player) => ({
          pubkey: player.publicKey,
          isWritable: true,
          isSigner: false,
        }))
      )
      .rpc();

    console.log("✅ Game started with REAL Arcium MPC!");
    console.log("Transaction:", tx);
  };

  return { startGame };
};
```

---

## 🧪 Testing Instructions

### 1. Test Game Creation

```typescript
// Create a game
const { createGame } = useCreateGame();
await createGame({
  minBuyIn: 1000,
  maxBuyIn: 10000,
  smallBlind: 10,
  bigBlind: 20,
});
```

### 2. Join the Game

```typescript
// Two players join
const { joinGame } = useJoinGame();
await joinGame(gamePda, buyInAmount, seatIndex);
```

### 3. Start the Game (With MPC!)

```typescript
// Start game - triggers Arcium MPC shuffle
const { startGame } = useStartGame();
await startGame(gamePda, gameId);
```

### 4. Check Logs

Open browser console and check for:

```
🎮 ========== START GAME ==========
🔐 Mode: REAL Arcium MPC
🔨 Building start game instruction...
✅ Instruction built
📤 Sending transaction...
✅ Transaction sent: <TX_SIGNATURE>
🎉 Game started with REAL Arcium MPC!
```

### 5. Verify on Explorer

Check the transaction on Solana Explorer:

```
https://explorer.solana.com/tx/<TX_SIGNATURE>?cluster=devnet
```

Look for:
- ✅ Status: Success
- ✅ Program: B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W
- ✅ No error code 3012!

---

## 🐛 Troubleshooting

### Error: "Invalid program ID"

**Solution:** Make sure you updated the program ID everywhere:

```bash
# Check these files:
grep -r "GBMo6hbRHem9J3kccZLuLKAZQt7yXoSpyXaUgaVgniHT" frontend/
```

Replace old ID with new one: `B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W`

### Error: "Account not found"

**Solution:** Regenerate your IDL and types:

```bash
cd ~/arcium_poker
anchor build
cp target/idl/arcium_poker.json frontend/src/idl/
```

### Error: "Transaction simulation failed"

**Solution:** Check the detailed error:

```typescript
try {
  await startGame();
} catch (error) {
  console.error("Full error:", JSON.stringify(error, null, 2));
  if (error.logs) {
    console.error("Program logs:", error.logs);
  }
}
```

### Error 3012 Still Happening?

**Solution:** Verify MXE account callback program matches:

```bash
arcium mxe-info B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W --rpc-url devnet
```

Should show: `Cluster offset: 1078779259` and `Computation definition offsets: [1]`

### Game State Not Updating?

**Solution:** Make sure you're polling for updates:

```typescript
// Poll game state every 2 seconds
useEffect(() => {
  const interval = setInterval(async () => {
    const gameAccount = await program.account.game.fetch(gamePda);
    setGameState(gameAccount);
  }, 2000);

  return () => clearInterval(interval);
}, [gamePda]);
```

---

## 🔐 Security Features

Your deployment now includes **REAL** Arcium MPC for:

### ✅ Encrypted Deck Shuffling
- Multi-party computation ensures no single party controls randomness
- Fisher-Yates shuffle performed in MPC across Arcium nodes
- Cryptographic commitments prove shuffle integrity

### ✅ Secure Card Dealing
- Cards are dealt encrypted via MPC
- Only player's encrypted hole cards are stored on-chain
- Community cards revealed when needed

### ✅ Verifiable Randomness
- Each player contributes entropy
- Combined entropy creates provably fair shuffle
- Zero-knowledge proofs available for verification

### ✅ Cheat-Proof
- No player can see others' hole cards
- Deck shuffle can be verified after game ends
- All actions logged on-chain immutably

---

## 📊 What Happens During Game Start

When you call `startGame()`:

1. **Frontend generates entropy** for each player (32 bytes)
2. **Transaction sent** to Solana program
3. **Program calls Arcium MXE** via CPI (Cross-Program Invocation)
4. **MXE queues computation** in the mempool
5. **Arcium nodes perform MPC shuffle** securely
6. **Shuffled deck stored** encrypted on-chain
7. **Hole cards dealt** to each player (encrypted)
8. **Game stage** changes to PreFlop
9. **Blinds posted** automatically
10. **Betting round begins!** 🎰

---

## 🚀 Next Steps

### For Development

1. **Test all game flows:**
   - Create game ✅
   - Join game ✅
   - Start game ✅
   - Betting rounds
   - Showdown
   - Winner determination

2. **Monitor MPC computations:**
   ```bash
   # Watch logs in real-time
   solana logs --url devnet | grep B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W
   ```

3. **Optimize gas costs:**
   - Use `ComputeBudget` instruction for complex operations
   - Consider batching player actions

### For Production

1. **Deploy to mainnet** (when ready):
   ```bash
   anchor deploy --provider.cluster mainnet
   ```

2. **Initialize MXE on mainnet:**
   ```bash
   arcium init-mxe \
     --callback-program <MAINNET_PROGRAM_ID> \
     --cluster-offset <MAINNET_CLUSTER> \
     --keypair-path ~/.config/solana/id.json \
     --rpc-url mainnet
   ```

3. **Update frontend** to use mainnet RPC

4. **Security audit** recommended before real-money games!

---

## 📞 Support & Resources

- **Solana Explorer:** https://explorer.solana.com/address/B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W?cluster=devnet
- **Arcium Docs:** https://docs.arcium.com
- **Arcium Discord:** Check their website for invite
- **Program Logs:** `solana logs --url devnet`

---

## 🎉 Congratulations!

You've successfully deployed **Arcium Poker** with real MPC integration!

Your poker game now has enterprise-grade security powered by Arcium's decentralized MPC network. Players can enjoy provably fair games with encrypted deck shuffling and secure card dealing.

**Time to deal some hands!** 🃏🎰

---

## 📝 Quick Reference Card

```
Program ID:     B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W
MXE Program:    BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6
MXE Account:    3XCqEWHvKCdzJyuDAJGwTdQqwZXDmezTfM7iwPHv9xES
Cluster Offset: 1078779259
Network:        Devnet
Status:         ✅ READY
```

---

*Generated: $(date)*
*Deployment: Fresh install with new program ID*
*Wallet: 4JaZnV8M3iKSM7G9GmWowg1GFXyvk59ojo7VyEgZ49zL*
