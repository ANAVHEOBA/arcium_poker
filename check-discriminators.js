const { PublicKey, Connection } = require('@solana/web3.js');

const accounts = [
  { name: 'Account 1 (8696 bytes)', addr: '4khWoKYyqcfnV7xexutvJFQMyj6ekM7E8gdvcH7fy4Ba' },
  { name: 'Account 2 (100 bytes)', addr: '855kV52vroBmanfaL2QLcoPyioGPd12USBcFAsibtJnP' },
  { name: 'Account 3 (80 bytes)', addr: '94ZeSmg21ktsHWPbRSYqtu77T4SUKNoEj9qn8c6zjLxH' },
  { name: 'Account 4 (152 bytes)', addr: 'AEw7wNnzB5zPpj92FHgqf3Pwyd5cqdG5Cus4pofCnbk9' },
  { name: 'Account 5 (8444 bytes)', addr: 'CaTxKKfdaoCM7ZzLj5dLzrrmnsg9GJb5iYzRzCk8VEu3' },
  { name: 'Account 6 (102 bytes)', addr: 'HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo' },
];

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║           CHECKING ACCOUNT DISCRIMINATORS                      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');

  for (const { name, addr } of accounts) {
    try {
      const pubkey = new PublicKey(addr);
      const info = await connection.getAccountInfo(pubkey);

      if (info) {
        const discriminator = Array.from(info.data.slice(0, 8))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ');

        console.log(`${name}`);
        console.log(`  Address: ${addr}`);
        console.log(`  Discriminator: ${discriminator}`);
        console.log(`  Size: ${info.data.length} bytes`);
        console.log('');
      }
    } catch (e) {
      console.log(`❌ ${name} - Error: ${e.message}`);
      console.log('');
    }
  }

  console.log('');
  console.log('Known Arcium Discriminators:');
  console.log('  MXE:          (unknown - need to find)');
  console.log('  Mempool:      (unknown - need to find)');
  console.log('  CompDef:      (unknown - need to find)');
  console.log('');
}

main().catch(console.error);
