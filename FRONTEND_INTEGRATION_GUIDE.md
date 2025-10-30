# 🎮 Arcium Poker - Frontend Integration Guide

Complete guide for integrating the Arcium Poker game with your frontend application.

---

## 📋 Table of Contents

1. [Deployment Information](#deployment-information)
2. [Required Dependencies](#required-dependencies)
3. [Program IDL](#program-idl)
4. [Account Structures](#account-structures)
5. [Available Instructions](#available-instructions)
6. [MPC Integration](#mpc-integration)
7. [Code Examples](#code-examples)
8. [Testing](#testing)

---

## 🌐 Deployment Information

### Network Configuration
- **Network:** Solana Devnet
- **RPC Endpoint:** `https://api.devnet.solana.com`
- **Explorer:** `https://explorer.solana.com/?cluster=devnet`

### Program Details
- **Program ID:** `5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn`
- **Deployment Transaction:** `3oNqk5iM1rXFupXAshhWkkT8yRawfeGi3pkqhFFwJBwURDdYC99i6X3ucfYCzLhC87dJ3uXWpo7iGLjZMUTVmvJV`
- **MXE Initialized:** ✅ Yes
- **MXE Transaction:** `2Wx5ULzmRHPTsHhJmVADnmpz4YwELso88xtugsxT57cME4sWMsFaFMXp3QiGDuTpezoEw9D9u44pT9bxEkoUDTkK`

### MXE Configuration
- **Cluster Offset:** `1078779259`
- **Status:** Active on Devnet
- **Features:** Real MPC-based card shuffling and dealing

### IDL Location
```
target/idl/arcium_poker.json
```

---

## 📦 Required Dependencies

### NPM/Yarn Packages

```json
{
  "dependencies": {
    "@coral-xyz/anchor": "^0.32.1",
    "@solana/web3.js": "^1.95.0",
    "@solana/wallet-adapter-base": "^0.9.23",
    "@solana/wallet-adapter-react": "^0.15.35",
    "@solana/wallet-adapter-wallets": "^0.19.32",
    "@arcium-hq/client": "^0.3.0",
    "@arcium-hq/reader": "^0.3.0",
    "bn.js": "^5.2.1"
  }
}
```

### Installation

```bash
npm install @coral-xyz/anchor @solana/web3.js @solana/wallet-adapter-react
npm install @arcium-hq/client @arcium-hq/reader
```

---

## 📄 Program IDL

### Loading the IDL

```typescript
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import idl from './idl/arcium_poker.json';

const PROGRAM_ID = new web3.PublicKey('5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn');

// Initialize program
const connection = new web3.Connection('https://api.devnet.solana.com', 'confirmed');
const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
const program = new Program(idl, PROGRAM_ID, provider);
```

---

## 🗂️ Account Structures

### Game Account

```typescript
interface Game {
  gameId: BN;                    // Unique game identifier
  authority: PublicKey;          // Game creator/authority
  currentStage: GameStage;       // Current game stage
  pot: BN;                       // Total pot amount
  smallBlind: BN;                // Small blind amount
  bigBlind: BN;                  // Big blind amount
  currentBet: BN;                // Current bet to match
  dealerSeat: number;            // Dealer position (0-5)
  currentTurn: number;           // Current player's turn
  numActivePlayers: number;      // Active players count
  communityCards: number[];      // Revealed community cards
  deck: number[];                // Encrypted deck (52 cards)
  deckTop: number;               // Next card index
  winners: number[];             // Winning seat numbers
  winningAmount: BN;             // Amount won
  createdAt: BN;                 // Creation timestamp
  lastActionAt: BN;              // Last action timestamp
}
```

### Player State

```typescript
interface PlayerState {
  gameId: BN;                    // Associated game ID
  seatNumber: number;            // Seat position (0-5)
  walletAddress: PublicKey;      // Player's wallet
  chipStack: BN;                 // Current chip count
  betAmount: BN;                 // Current bet amount
  status: PlayerStatus;          // Active/Folded/AllIn/Out
  action: PlayerAction;          // Last action taken
  holeCards: number[];           // Player's hole cards
  handRank: HandRank;            // Evaluated hand rank
  joinedAt: BN;                  // Join timestamp
}
```

### Enums

```typescript
enum GameStage {
  PreFlop = 0,
  Flop = 1,
  Turn = 2,
  River = 3,
  Showdown = 4,
  Ended = 5
}

enum PlayerStatus {
  Active = 0,
  Folded = 1,
  AllIn = 2,
  Out = 3
}

enum PlayerAction {
  None = 0,
  Fold = 1,
  Check = 2,
  Call = 3,
  Raise = 4,
  AllIn = 5
}

enum HandRank {
  HighCard = 0,
  Pair = 1,
  TwoPair = 2,
  ThreeOfAKind = 3,
  Straight = 4,
  Flush = 5,
  FullHouse = 6,
  FourOfAKind = 7,
  StraightFlush = 8,
  RoyalFlush = 9
}
```

---

## 🎯 Available Instructions

### 1. Initialize Game

```typescript
async function initializeGame(
  gameId: BN,
  smallBlind: BN = new BN(10),
  bigBlind: BN = new BN(20),
  initialStack: BN = new BN(1000)
) {
  const [gamePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), gameId.toArrayLike(Buffer, 'le', 8)],
    program.programId
  );

  const tx = await program.methods
    .initializeGame(gameId, smallBlind, bigBlind, initialStack)
    .accounts({
      game: gamePda,
      authority: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  return { tx, gamePda };
}
```

### 2. Join Game

```typescript
async function joinGame(gameId: BN, seatNumber: number, buyIn: BN) {
  const [gamePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), gameId.toArrayLike(Buffer, 'le', 8)],
    program.programId
  );

  const [playerPda] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('player'),
      gamePda.toBuffer(),
      new BN(seatNumber).toArrayLike(Buffer, 'le', 1)
    ],
    program.programId
  );

  const tx = await program.methods
    .joinGame(seatNumber, buyIn)
    .accounts({
      game: gamePda,
      player: playerPda,
      authority: wallet.publicKey,
      systemProgram: web3.SystemProgram.programId,
    })
    .rpc();

  return { tx, playerPda };
}
```

### 3. Start Game

```typescript
async function startGame(gameId: BN) {
  const [gamePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), gameId.toArrayLike(Buffer, 'le', 8)],
    program.programId
  );

  const tx = await program.methods
    .startGame()
    .accounts({
      game: gamePda,
      authority: wallet.publicKey,
    })
    .rpc();

  return tx;
}
```

### 4. Player Actions

```typescript
// Fold
async function fold(gameId: BN, seatNumber: number) {
  const [gamePda, playerPda] = getDerivedAccounts(gameId, seatNumber);

  return await program.methods
    .playerFold()
    .accounts({
      game: gamePda,
      player: playerPda,
      authority: wallet.publicKey,
    })
    .rpc();
}

// Check
async function check(gameId: BN, seatNumber: number) {
  const [gamePda, playerPda] = getDerivedAccounts(gameId, seatNumber);

  return await program.methods
    .playerCheck()
    .accounts({
      game: gamePda,
      player: playerPda,
      authority: wallet.publicKey,
    })
    .rpc();
}

// Call
async function call(gameId: BN, seatNumber: number) {
  const [gamePda, playerPda] = getDerivedAccounts(gameId, seatNumber);

  return await program.methods
    .playerCall()
    .accounts({
      game: gamePda,
      player: playerPda,
      authority: wallet.publicKey,
    })
    .rpc();
}

// Raise
async function raise(gameId: BN, seatNumber: number, amount: BN) {
  const [gamePda, playerPda] = getDerivedAccounts(gameId, seatNumber);

  return await program.methods
    .playerRaise(amount)
    .accounts({
      game: gamePda,
      player: playerPda,
      authority: wallet.publicKey,
    })
    .rpc();
}
```

### 5. Advance Game Stage

```typescript
async function nextStage(gameId: BN) {
  const [gamePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), gameId.toArrayLike(Buffer, 'le', 8)],
    program.programId
  );

  return await program.methods
    .advanceStage()
    .accounts({
      game: gamePda,
      authority: wallet.publicKey,
    })
    .rpc();
}
```

---

## 🔐 MPC Integration

### Encrypted Card Operations

The MPC integration provides cryptographically secure card operations:

#### Shuffle Deck (MPC)
```typescript
// Automatically called during game initialization
// Uses Arcium MPC to shuffle deck securely
```

#### Deal Cards (MPC)
```typescript
// Called internally when dealing hole cards and community cards
// Cards remain encrypted until reveal time
```

#### Reveal Cards
```typescript
// During showdown, cards are revealed through MPC computation
async function revealHoleCards(gameId: BN, seatNumber: number) {
  const [gamePda, playerPda] = getDerivedAccounts(gameId, seatNumber);

  return await program.methods
    .revealCards()
    .accounts({
      game: gamePda,
      player: playerPda,
      authority: wallet.publicKey,
    })
    .rpc();
}
```

### MPC Features
- ✅ **Provably Fair Shuffling:** Deck is shuffled using multi-party computation
- ✅ **Encrypted Hole Cards:** Players' cards remain hidden until showdown
- ✅ **Verifiable Randomness:** All random operations are cryptographically verifiable
- ✅ **No Centralized Trust:** No single party can manipulate cards

---

## 💻 Code Examples

### Complete Game Flow

```typescript
import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor';
import { useAnchorWallet } from '@solana/wallet-adapter-react';

// Helper function
function getDerivedAccounts(gameId: BN, seatNumber: number) {
  const [gamePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), gameId.toArrayLike(Buffer, 'le', 8)],
    program.programId
  );

  const [playerPda] = web3.PublicKey.findProgramAddressSync(
    [
      Buffer.from('player'),
      gamePda.toBuffer(),
      new BN(seatNumber).toArrayLike(Buffer, 'le', 1)
    ],
    program.programId
  );

  return [gamePda, playerPda];
}

// Complete game example
async function playPokerGame() {
  const gameId = new BN(Date.now());
  const smallBlind = new BN(10);
  const bigBlind = new BN(20);
  const buyIn = new BN(1000);

  try {
    // 1. Create game
    const { gamePda } = await initializeGame(gameId, smallBlind, bigBlind, buyIn);
    console.log('Game created:', gamePda.toString());

    // 2. Players join
    await joinGame(gameId, 0, buyIn); // Seat 0
    await joinGame(gameId, 1, buyIn); // Seat 1

    // 3. Start game (triggers MPC shuffle)
    await startGame(gameId);
    console.log('Game started - deck shuffled via MPC');

    // 4. Play hand
    await call(gameId, 0);
    await raise(gameId, 1, new BN(50));
    await call(gameId, 0);

    // 5. Advance to flop
    await nextStage(gameId);

    // 6. Continue betting...
    await check(gameId, 0);
    await check(gameId, 1);

    // 7. Advance to showdown
    await nextStage(gameId); // Turn
    await nextStage(gameId); // River
    await nextStage(gameId); // Showdown

    // 8. Fetch winner
    const game = await program.account.game.fetch(gamePda);
    console.log('Winners:', game.winners);
    console.log('Pot:', game.pot.toString());

  } catch (error) {
    console.error('Game error:', error);
  }
}
```

### Fetching Game State

```typescript
async function getGameState(gameId: BN) {
  const [gamePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), gameId.toArrayLike(Buffer, 'le', 8)],
    program.programId
  );

  const game = await program.account.game.fetch(gamePda);

  return {
    gameId: game.gameId.toString(),
    stage: Object.keys(game.currentStage)[0],
    pot: game.pot.toString(),
    currentBet: game.currentBet.toString(),
    dealerSeat: game.dealerSeat,
    currentTurn: game.currentTurn,
    activePlayers: game.numActivePlayers,
    communityCards: game.communityCards,
    winners: game.winners,
  };
}
```

### Subscribing to Game Updates

```typescript
function subscribeToGame(gameId: BN, callback: (game: any) => void) {
  const [gamePda] = web3.PublicKey.findProgramAddressSync(
    [Buffer.from('game'), gameId.toArrayLike(Buffer, 'le', 8)],
    program.programId
  );

  const subscriptionId = connection.onAccountChange(
    gamePda,
    async (accountInfo) => {
      const game = program.coder.accounts.decode('Game', accountInfo.data);
      callback(game);
    },
    'confirmed'
  );

  return () => connection.removeAccountChangeListener(subscriptionId);
}
```

---

## 🧪 Testing

### Test Configuration

```typescript
// test-config.ts
export const TEST_CONFIG = {
  network: 'devnet',
  programId: '5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn',
  rpcUrl: 'https://api.devnet.solana.com',
  commitment: 'confirmed' as web3.Commitment,
};
```

### Example Test

```typescript
import { expect } from 'chai';
import { BN } from '@coral-xyz/anchor';

describe('Arcium Poker Frontend Integration', () => {
  it('should create and join a game', async () => {
    const gameId = new BN(Date.now());
    const { gamePda } = await initializeGame(gameId);

    const game = await program.account.game.fetch(gamePda);
    expect(game.gameId.toString()).to.equal(gameId.toString());

    const { playerPda } = await joinGame(gameId, 0, new BN(1000));
    const player = await program.account.playerState.fetch(playerPda);
    expect(player.seatNumber).to.equal(0);
    expect(player.chipStack.toString()).to.equal('1000');
  });
});
```

---

## 🎨 UI Components

### Example React Component

```tsx
import { useState, useEffect } from 'react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { BN } from '@coral-xyz/anchor';

export function PokerTable({ gameId }: { gameId: BN }) {
  const wallet = useAnchorWallet();
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    if (!wallet) return;

    // Subscribe to game updates
    const unsubscribe = subscribeToGame(gameId, (game) => {
      setGameState(game);
    });

    // Initial fetch
    getGameState(gameId).then(setGameState);

    return unsubscribe;
  }, [gameId, wallet]);

  const handleAction = async (action: string, amount?: number) => {
    const seatNumber = 0; // Get from player's state

    switch (action) {
      case 'fold':
        await fold(gameId, seatNumber);
        break;
      case 'check':
        await check(gameId, seatNumber);
        break;
      case 'call':
        await call(gameId, seatNumber);
        break;
      case 'raise':
        await raise(gameId, seatNumber, new BN(amount));
        break;
    }
  };

  if (!gameState) return <div>Loading...</div>;

  return (
    <div className="poker-table">
      <div className="pot">Pot: {gameState.pot} chips</div>
      <div className="community-cards">
        {gameState.communityCards.map((card, i) => (
          <Card key={i} value={card} />
        ))}
      </div>
      <div className="actions">
        <button onClick={() => handleAction('fold')}>Fold</button>
        <button onClick={() => handleAction('check')}>Check</button>
        <button onClick={() => handleAction('call')}>Call</button>
        <button onClick={() => handleAction('raise', 50)}>Raise</button>
      </div>
    </div>
  );
}
```

---

## 📚 Additional Resources

### Documentation
- **Program IDL:** `target/idl/arcium_poker.json`
- **Test Suite:** `tests/arcium_poker.test.ts`
- **Arcium Docs:** https://docs.arcium.com/developers

### Helper Libraries
- **Arcium Client:** `@arcium-hq/client` - For MPC operations
- **Arcium Reader:** `@arcium-hq/reader` - For reading MPC state

### Support
- **GitHub Issues:** [Your Repository]
- **Arcium Discord:** https://discord.gg/arcium

---

## 🚀 Quick Start Checklist

- [ ] Install dependencies (`npm install`)
- [ ] Copy IDL file to your frontend project
- [ ] Configure connection to devnet
- [ ] Set program ID: `5yRH1ANsvUw1gBcBudzZbBjV3dAkNXJ37m514e3RsoBn`
- [ ] Implement wallet connection
- [ ] Create game initialization flow
- [ ] Add player join functionality
- [ ] Implement betting actions
- [ ] Subscribe to game state updates
- [ ] Test on devnet

---

## ⚠️ Important Notes

1. **Network:** Currently deployed on **Devnet only**
2. **MPC Status:** ✅ Real MPC enabled (not mock mode)
3. **Testing:** Always test with small amounts first
4. **Mainnet:** Requires re-deployment and security audit
5. **Rate Limits:** Be mindful of RPC rate limits on devnet

---

**Happy Building! 🎮🃏**

For questions or issues, please open an issue on GitHub or contact the Arcium community.
