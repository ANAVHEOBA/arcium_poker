// Script to get REAL MXE addresses from the init-mxe transaction

const { PublicKey, Connection } = require('@solana/web3.js');

// Transaction signature from init-mxe
const INIT_MXE_TX = 'dpLXtdGR1bdnjzSPdcN5k1DDTtG46ZmCKLPwRguWstEdZap49Y3bVgZYRg3bmtvv7621Sw4sBB1kcesxbJHLoXk';
const RPC_URL = 'https://api.devnet.solana.com';

async function main() {
  const connection = new Connection(RPC_URL, 'confirmed');

  // Get transaction
  const tx = await connection.getTransaction(INIT_MXE_TX, {
    maxSupportedTransactionVersion: 0,
  });

  if (!tx) {
    console.error('Transaction not found');
    return;
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          REAL MXE ACCOUNTS FROM INIT-MXE                     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const accounts = tx.transaction.message.getAccountKeys().staticAccountKeys;

  console.log('Accounts created by arcium init-mxe:');
  console.log('');

  // Accounts from the transaction (based on the logs we saw):
  // Account 1: MXE Account (largest, 8696 bytes)
  // Account 2-6: Other related accounts

  const accountNames = [
    'Fee Payer (Your Wallet)',
    'MXE Account (Main)',
    'Unknown Account 2',
    'Unknown Account 3',
    'Unknown Account 4',
    'Unknown Account 5',
    'Unknown Account 6',
    'System Program',
    'Your Program ID',
    'Arcium MXE Program',
  ];

  for (let i = 0; i < Math.min(accounts.length, 10); i++) {
    const account = accounts[i];
    console.log(`  [${i}] ${accountNames[i] || 'Unknown'}`);
    console.log(`      ${account.toBase58()}`);
    console.log('');
  }

  console.log('');
  console.log('✅ Real MXE Account: 4khWoKYyqcfnV7xexutvJFQMyj6ekM7E8gdvcH7fy4Ba');
  console.log('');
  console.log('Now checking which accounts exist and their owners...');
  console.log('');

  // Check accounts 1-6
  const accountsToCheck = [
    '4khWoKYyqcfnV7xexutvJFQMyj6ekM7E8gdvcH7fy4Ba',
    '855kV52vroBmanfaL2QLcoPyioGPd12USBcFAsibtJnP',
    '94ZeSmg21ktsHWPbRSYqtu77T4SUKNoEj9qn8c6zjLxH',
    'AEw7wNnzB5zPpj92FHgqf3Pwyd5cqdG5Cus4pofCnbk9',
    'CaTxKKfdaoCM7ZzLj5dLzrrmnsg9GJb5iYzRzCk8VEu3',
    'HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo',
  ];

  for (const addr of accountsToCheck) {
    try {
      const pubkey = new PublicKey(addr);
      const info = await connection.getAccountInfo(pubkey);
      if (info) {
        console.log(`✅ ${addr}`);
        console.log(`   Owner: ${info.owner.toBase58()}`);
        console.log(`   Size: ${info.data.length} bytes`);
        console.log('');
      } else {
        console.log(`❌ ${addr} - Not found`);
        console.log('');
      }
    } catch (e) {
      console.log(`❌ ${addr} - Error: ${e.message}`);
      console.log('');
    }
  }
}

main().catch(console.error);
