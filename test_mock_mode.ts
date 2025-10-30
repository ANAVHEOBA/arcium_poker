import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { ArciumPoker } from "./target/types/arcium_poker";
import { Keypair, SystemProgram } from "@solana/web3.js";

async function testMockMode() {
  console.log("\n=== TESTING MOCK MODE ===\n");

  // Configure the client to use devnet
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.ArciumPoker as Program<ArciumPoker>;

  console.log("Program ID:", program.programId.toBase58());
  console.log("Provider Wallet:", provider.wallet.publicKey.toBase58());

  // Create game account
  const gameKeypair = Keypair.generate();
  console.log("\nGame Account:", gameKeypair.publicKey.toBase58());

  // Create players
  const player1 = Keypair.generate();
  const player2 = Keypair.generate();

  console.log("Player 1:", player1.publicKey.toBase58());
  console.log("Player 2:", player2.publicKey.toBase58());

  // Airdrop SOL to players on devnet
  console.log("\nAirdropping SOL to players...");
  try {
    await provider.connection.requestAirdrop(player1.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(player2.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL);
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (e) {
    console.log("Airdrop may have failed (rate limited), continuing anyway...");
  }

  try {
    console.log("\n--- Initializing Game ---");
    const gameId = Date.now();

    // Derive game PDA
    const [gamePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("game"),
        provider.wallet.publicKey.toBuffer(),
        new anchor.BN(gameId).toArrayLike(Buffer, "le", 8)
      ],
      program.programId
    );

    console.log("Game ID:", gameId);
    console.log("Game PDA:", gamePda.toBase58());

    await program.methods
      .initializeGame(
        new anchor.BN(gameId),
        new anchor.BN(50),      // small blind
        new anchor.BN(100),     // big blind
        new anchor.BN(5000),    // min buy-in
        new anchor.BN(10000),   // max buy-in
        6                        // max players
      )
      .accounts({
        authority: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ Game initialized!");

    console.log("\n--- Adding Players ---");

    // Derive player state PDAs
    const [player1StatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), gamePda.toBuffer(), player1.publicKey.toBuffer()],
      program.programId
    );

    const [player2StatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("player"), gamePda.toBuffer(), player2.publicKey.toBuffer()],
      program.programId
    );

    // Join game as player 1
    await program.methods
      .joinGame(new anchor.BN(10000))
      .accounts({
        game: gamePda,
        player: player1.publicKey,
      })
      .signers([player1])
      .rpc();

    console.log("✅ Player 1 joined");

    // Join game as player 2
    await program.methods
      .joinGame(new anchor.BN(10000))
      .accounts({
        game: gamePda,
        player: player2.publicKey,
      })
      .signers([player2])
      .rpc();

    console.log("✅ Player 2 joined");

    console.log("\n--- Starting Game (MOCK MODE) ---");
    console.log("⚠️  NOT providing MXE accounts - should use MOCK shuffle");

    // Generate mock entropy (32 bytes of random data per player)
    const playerEntropy = Array(2).fill(0).map(() => Array(32).fill(0));

    // Start game WITHOUT MXE accounts (mock mode)
    const tx = await program.methods
      .startGame(playerEntropy)
      .accounts({
        game: gamePda,
        authority: provider.wallet.publicKey,
        // NOT providing any MXE accounts - should trigger mock mode
      })
      .rpc({ skipPreflight: false });

    console.log("✅ Game started with MOCK MODE!");
    console.log("Transaction:", tx);

    // Fetch game state
    const gameState = await program.account.game.fetch(gamePda);
    console.log("\n--- Game State ---");
    console.log("Stage:", Object.keys(gameState.stage)[0]);
    console.log("Deck initialized:", gameState.deckInitialized);
    console.log("Current player index:", gameState.currentPlayerIndex);

    console.log("\n🎉 SUCCESS! Mock mode is working!\n");

  } catch (error) {
    console.error("\n❌ Error:", error);
    if (error.logs) {
      console.error("\nProgram logs:");
      error.logs.forEach(log => console.error(log));
    }
    process.exit(1);
  }
}

testMockMode()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
