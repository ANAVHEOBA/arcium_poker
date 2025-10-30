use solana_client::rpc_client::RpcClient;
use solana_sdk::{
    commitment_config::CommitmentConfig,
    native_token::LAMPORTS_PER_SOL,
    pubkey::Pubkey,
    signature::{Keypair, Signer},
    system_instruction,
    transaction::Transaction,
};
use sha2::{Sha256, Digest};
use std::str::FromStr;

fn main() {
    // Configuration
    let mnemonic = "purity field mixed where various solution unique various solution unique high crouch describe give isolate";
    let recipient_address = "4JaZnV8M3iKSM7G9GmWowg1GFXyvk59ojo7VyEgZ49zL";
    let amount_sol = 1.0;
    let rpc_url = "https://api.devnet.solana.com";

    println!("🔐 Deriving keypair from seed phrase...");

    // Hash the mnemonic to get a 32-byte seed
    let mut hasher = Sha256::new();
    hasher.update(mnemonic.as_bytes());
    let seed = hasher.finalize();

    // Create keypair from seed
    let source_keypair = Keypair::from_bytes(&seed.into()).expect("Failed to create keypair");

    println!("📍 Source wallet: {}", source_keypair.pubkey());
    println!("📍 Recipient wallet: {}", recipient_address);

    // Connect to Solana
    println!("\n🌐 Connecting to Solana devnet...");
    let client = RpcClient::new_with_commitment(rpc_url.to_string(), CommitmentConfig::confirmed());

    // Check source balance
    let source_balance = client
        .get_balance(&source_keypair.pubkey())
        .expect("Failed to get balance");
    let source_balance_sol = source_balance as f64 / LAMPORTS_PER_SOL as f64;

    println!("💰 Source balance: {} SOL", source_balance_sol);

    let amount_lamports = (amount_sol * LAMPORTS_PER_SOL as f64) as u64;

    if source_balance < amount_lamports {
        eprintln!(
            "❌ Insufficient balance! Need {} SOL, have {} SOL",
            amount_sol, source_balance_sol
        );
        std::process::exit(1);
    }

    // Create transaction
    println!("\n💸 Transferring {} SOL...", amount_sol);
    let recipient_pubkey =
        Pubkey::from_str(recipient_address).expect("Invalid recipient address");

    let transfer_instruction = system_instruction::transfer(
        &source_keypair.pubkey(),
        &recipient_pubkey,
        amount_lamports,
    );

    // Get recent blockhash
    let recent_blockhash = client
        .get_latest_blockhash()
        .expect("Failed to get recent blockhash");

    // Create and sign transaction
    let transaction = Transaction::new_signed_with_payer(
        &[transfer_instruction],
        Some(&source_keypair.pubkey()),
        &[&source_keypair],
        recent_blockhash,
    );

    // Send transaction
    let signature = client
        .send_and_confirm_transaction(&transaction)
        .expect("Failed to send transaction");

    println!("✅ Transfer successful!");
    println!("📝 Signature: {}", signature);
    println!(
        "🔗 Explorer: https://explorer.solana.com/tx/{}?cluster=devnet",
        signature
    );

    // Check new balances
    let new_source_balance = client
        .get_balance(&source_keypair.pubkey())
        .expect("Failed to get source balance");
    let recipient_balance = client
        .get_balance(&recipient_pubkey)
        .expect("Failed to get recipient balance");

    println!("\n📊 Final balances:");
    println!(
        "   Source: {} SOL",
        new_source_balance as f64 / LAMPORTS_PER_SOL as f64
    );
    println!(
        "   Recipient: {} SOL",
        recipient_balance as f64 / LAMPORTS_PER_SOL as f64
    );
}
