// Use Anchor's web3 dependency
const anchor = require('@coral-xyz/anchor');
const { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } = anchor.web3;

// Use proper BIP39 derivation
const bip39 = require('bip39');
const { derivePath } = require('ed25519-hd-key');

async function transferSOL() {
    try {
        // Configuration
        const MNEMONIC = "purity field mixed where various solution unique high crouch describe give isolate";
        const RECIPIENT = "4JaZnV8M3iKSM7G9GmWowg1GFXyvk59ojo7VyEgZ49zL";
        const AMOUNT_SOL = 1;
        const RPC_URL = "https://api.devnet.solana.com";

        console.log("🔐 Deriving keypair from seed phrase...");

        // Proper BIP39 derivation with Solana path
        const seed = await bip39.mnemonicToSeed(MNEMONIC);
        const derivedSeed = derivePath("m/44'/501'/0'/0'", seed.toString('hex')).key;
        const sourceKeypair = Keypair.fromSeed(derivedSeed);

        console.log("📍 Source wallet:", sourceKeypair.publicKey.toBase58());
        console.log("📍 Recipient wallet:", RECIPIENT);

        // Connect to Solana
        console.log("\n🌐 Connecting to Solana devnet...");
        const connection = new Connection(RPC_URL, 'confirmed');

        // Check source balance
        const sourceBalance = await connection.getBalance(sourceKeypair.publicKey);
        console.log(`💰 Source balance: ${sourceBalance / LAMPORTS_PER_SOL} SOL`);

        if (sourceBalance < AMOUNT_SOL * LAMPORTS_PER_SOL) {
            console.error(`❌ Insufficient balance! Need ${AMOUNT_SOL} SOL, have ${sourceBalance / LAMPORTS_PER_SOL} SOL`);
            process.exit(1);
        }

        // Create transaction
        console.log(`\n💸 Transferring ${AMOUNT_SOL} SOL...`);
        const recipientPubkey = new PublicKey(RECIPIENT);

        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: sourceKeypair.publicKey,
                toPubkey: recipientPubkey,
                lamports: AMOUNT_SOL * LAMPORTS_PER_SOL,
            })
        );

        // Send transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [sourceKeypair],
            { commitment: 'confirmed' }
        );

        console.log("✅ Transfer successful!");
        console.log(`📝 Signature: ${signature}`);
        console.log(`🔗 Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`);

        // Check new balances
        const newSourceBalance = await connection.getBalance(sourceKeypair.publicKey);
        const recipientBalance = await connection.getBalance(recipientPubkey);

        console.log("\n📊 Final balances:");
        console.log(`   Source: ${newSourceBalance / LAMPORTS_PER_SOL} SOL`);
        console.log(`   Recipient: ${recipientBalance / LAMPORTS_PER_SOL} SOL`);

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
}

transferSOL();
