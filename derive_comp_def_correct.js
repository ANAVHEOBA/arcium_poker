const { PublicKey } = require('@solana/web3.js');

const MXE_PROGRAM = new PublicKey('BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6');
const COMP_DEF_OFFSET = 1;

// Convert offset to bytes (little endian, u32)
const offsetBytes = Buffer.alloc(4);
offsetBytes.writeUInt32LE(COMP_DEF_OFFSET);

// According to Arcium IDL, seeds are:
// 1. "ComputationDefinitionAccount"
// 2. mxeProgram (argument) - this is the MXE program ID itself
// 3. computationDefinitionOffset (argument)

const [compDef, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('ComputationDefinitionAccount'),
    MXE_PROGRAM.toBuffer(),
    offsetBytes
  ],
  MXE_PROGRAM
);

console.log('Derived Comp Def PDA:', compDef.toBase58());
console.log('Seeds:');
console.log('  1. "ComputationDefinitionAccount"');
console.log('  2. mxe_program:', MXE_PROGRAM.toBase58());
console.log('  3. comp_def_offset (1):', offsetBytes.toString('hex'));
console.log('Bump:', bump);

// Check if it matches any of our known accounts
const knownAccounts = {
  '4khWoKYyqcfnV7xexutvJFQMyj6ekM7E8gdvcH7fy4Ba': '8696 bytes',
  '855kV52vroBmanfaL2QLcoPyioGPd12USBcFAsibtJnP': '100 bytes (sign_seed)',
  '94ZeSmg21ktsHWPbRSYqtu77T4SUKNoEj9qn8c6zjLxH': '80 bytes (exec_pool)',
  'AEw7wNnzB5zPpj92FHgqf3Pwyd5cqdG5Cus4pofCnbk9': '152 bytes',
  'CaTxKKfdaoCM7ZzLj5dLzrrmnsg9GJb5iYzRzCk8VEu3': '8444 bytes (mempool)',
  'HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo': '102 bytes (MXE)'
};

if (knownAccounts[compDef.toBase58()]) {
  console.log('\n✅ MATCH! This is:', knownAccounts[compDef.toBase58()]);
} else {
  console.log('\n❌ Not in known accounts list');
}
