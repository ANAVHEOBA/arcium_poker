const { Connection, PublicKey, Keypair, SystemProgram, Transaction, TransactionInstruction } = require('@solana/web3.js');
const borsh = require('borsh');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Configuration
const MXE_PROGRAM = new PublicKey('BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6');
const COMP_DEF_OFFSET = 1;

// Discriminator for initComputationDefinition instruction
const INIT_COMP_DEF_DISCRIMINATOR = Buffer.from([45, 185, 155, 17, 97, 77, 230, 73]);

// Borsh schema for the arguments
class InitCompDefArgs {
  constructor(fields) {
    this.mxeProgram = fields.mxeProgram;
    this.compOffset = fields.compOffset;
  }
}

const initCompDefSchema = new Map([
  [InitCompDefArgs, {
    kind: 'struct',
    fields: [
      ['mxeProgram', [32]],  // Pubkey as 32-byte array
      ['compOffset', 'u32']
    ]
  }]
]);

async function initCompDef() {
  console.log('🔧 Initializing Computation Definition Account...\n');

  // Load keypair
  const keypairPath = path.join(os.homedir(), '.config', 'solana', 'id.json');
  const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
  console.log('📝 Signer:', keypair.publicKey.toBase58());

  // Connect to devnet
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Use the actual MXE account (created by init-mxe)
  const mxeAccount = new PublicKey('HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo');
  console.log('📦 MXE Account:', mxeAccount.toBase58());

  // Derive Comp Def PDA
  const compDefOffsetBytes = Buffer.alloc(4);
  compDefOffsetBytes.writeUInt32LE(COMP_DEF_OFFSET);

  const [compDefAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('ComputationDefinitionAccount'),
      MXE_PROGRAM.toBuffer(),
      compDefOffsetBytes
    ],
    MXE_PROGRAM
  );
  console.log('🎯 Comp Def Account (to create):', compDefAccount.toBase58());

  // Check if it already exists
  const accountInfo = await connection.getAccountInfo(compDefAccount);
  if (accountInfo) {
    console.log('\n✅ Comp Def account already exists!');
    console.log('   Size:', accountInfo.data.length, 'bytes');
    console.log('   Owner:', accountInfo.owner.toBase58());
    return;
  }

  console.log('\n📝 Creating Comp Def account...');

  // Build instruction data with Borsh serialization
  const args = new InitCompDefArgs({
    mxeProgram: Array.from(MXE_PROGRAM.toBytes()),
    compOffset: COMP_DEF_OFFSET
  });

  const argsData = borsh.serialize(initCompDefSchema, args);
  const instructionData = Buffer.concat([
    INIT_COMP_DEF_DISCRIMINATOR,
    Buffer.from(argsData)
  ]);

  // Build instruction
  const ix = new TransactionInstruction({
    programId: MXE_PROGRAM,
    keys: [
      { pubkey: keypair.publicKey, isSigner: true, isWritable: true },    // signer
      { pubkey: mxeAccount, isSigner: false, isWritable: true },          // mxe
      { pubkey: compDefAccount, isSigner: false, isWritable: true },      // compDefAcc
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }, // systemProgram
    ],
    data: instructionData,
  });

  // Send transaction
  const tx = new Transaction().add(ix);
  tx.feePayer = keypair.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  console.log('📤 Sending transaction...');
  const signature = await connection.sendTransaction(tx, [keypair], {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });

  console.log('⏳ Confirming...');
  await connection.confirmTransaction(signature, 'confirmed');

  console.log('\n✅ SUCCESS!');
  console.log('   Transaction:', signature);
  console.log('   Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  console.log('   Comp Def Account:', compDefAccount.toBase58());

  // Verify account was created
  const newAccountInfo = await connection.getAccountInfo(compDefAccount);
  if (newAccountInfo) {
    console.log('\n✅ Verified: Comp Def account created');
    console.log('   Size:', newAccountInfo.data.length, 'bytes');
    console.log('   Owner:', newAccountInfo.owner.toBase58());
  } else {
    console.log('\n❌ WARNING: Account not found after creation');
  }
}

initCompDef()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Error:', err);
    process.exit(1);
  });
