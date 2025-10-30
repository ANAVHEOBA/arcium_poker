#!/usr/bin/env python3

import subprocess
import json
from solders.keypair import Keypair
from solders.pubkey import Pubkey
from solders.system_program import transfer, TransferParams
from solders.transaction import Transaction
from solana.rpc.api import Client
from mnemonic import Mnemonic

def main():
    # Configuration
    MNEMONIC_PHRASE = "purity field mixed where various solution unique various solution unique high crouch describe give isolate"
    RECIPIENT = "4JaZnV8M3iKSM7G9GmWowg1GFXyvk59ojo7VyEgZ49zL"
    AMOUNT_SOL = 1.0
    RPC_URL = "https://api.devnet.solana.com"

    print("🔐 Deriving keypair from mnemonic...")

    # Derive keypair from mnemonic
    mnemo = Mnemonic("english")
    seed = mnemo.to_seed(MNEMONIC_PHRASE)

    # Use first 32 bytes as the keypair seed
    source_keypair = Keypair.from_seed(seed[:32])

    print(f"📍 Source wallet: {source_keypair.pubkey()}")
    print(f"📍 Recipient wallet: {RECIPIENT}")

    # Connect to Solana
    print("\n🌐 Connecting to Solana devnet...")
    client = Client(RPC_URL)

    # Check source balance
    response = client.get_balance(source_keypair.pubkey())
    source_balance = response.value / 1e9  # Convert lamports to SOL
    print(f"💰 Source balance: {source_balance} SOL")

    if source_balance < AMOUNT_SOL:
        print(f"❌ Insufficient balance! Need {AMOUNT_SOL} SOL, have {source_balance} SOL")
        return 1

    # Create transaction
    print(f"\n💸 Transferring {AMOUNT_SOL} SOL...")
    recipient_pubkey = Pubkey.from_string(RECIPIENT)

    lamports = int(AMOUNT_SOL * 1e9)

    # Create transfer instruction
    transfer_ix = transfer(
        TransferParams(
            from_pubkey=source_keypair.pubkey(),
            to_pubkey=recipient_pubkey,
            lamports=lamports
        )
    )

    # Get recent blockhash
    blockhash_resp = client.get_latest_blockhash()
    recent_blockhash = blockhash_resp.value.blockhash

    # Create and sign transaction
    transaction = Transaction.new_with_payer(
        [transfer_ix],
        source_keypair.pubkey(),
    )
    transaction.partial_sign([source_keypair], recent_blockhash)

    # Send transaction
    result = client.send_transaction(transaction)
    signature = result.value

    print("✅ Transfer successful!")
    print(f"📝 Signature: {signature}")
    print(f"🔗 Explorer: https://explorer.solana.com/tx/{signature}?cluster=devnet")

    # Wait for confirmation
    print("\n⏳ Waiting for confirmation...")
    client.confirm_transaction(signature)

    # Check new balances
    new_source_balance = client.get_balance(source_keypair.pubkey()).value / 1e9
    recipient_balance = client.get_balance(recipient_pubkey).value / 1e9

    print("\n📊 Final balances:")
    print(f"   Source: {new_source_balance} SOL")
    print(f"   Recipient: {recipient_balance} SOL")

    return 0

if __name__ == "__main__":
    try:
        exit(main())
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
