const { PublicKey } = require('@solana/web3.js');

const MXE_PROGRAM = new PublicKey('BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6');
const OUR_PROGRAM = new PublicKey('B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W');
const COMP_DEF_OFFSET = 1;

// Convert offset to bytes (little endian, u32)
const offsetBytes = Buffer.alloc(4);
offsetBytes.writeUInt32LE(COMP_DEF_OFFSET);

const [compDef, bump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('ComputationDefinitionAccount'),
    OUR_PROGRAM.toBuffer(),
    offsetBytes
  ],
  MXE_PROGRAM
);

console.log('Derived Comp Def PDA:', compDef.toBase58());
console.log('Seeds:');
console.log('  1. "ComputationDefinitionAccount"');
console.log('  2. mxe_program (our program):', OUR_PROGRAM.toBase58());
console.log('  3. comp_def_offset (1):', offsetBytes.toString('hex'));
console.log('Bump:', bump);
