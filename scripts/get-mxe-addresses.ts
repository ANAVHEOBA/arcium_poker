#!/usr/bin/env ts-node

/**
 * Get Arcium MXE Account Addresses
 *
 * This script computes all the PDA addresses needed for Arcium MPC integration.
 * Run this after initializing MXE with `arcium init-mxe` to get the addresses
 * for your frontend.
 */

import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROGRAM_ID = new PublicKey('B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W');
const MXE_PROGRAM = new PublicKey('BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6');
const CLUSTER_OFFSET = 1078779259;
const COMP_DEF_OFFSET = 1; // For shuffle computation

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                   ARCIUM MXE ACCOUNT ADDRESSES                               ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('📝 Configuration:');
console.log(`   • Program ID:        ${PROGRAM_ID.toBase58()}`);
console.log(`   • MXE Program:       ${MXE_PROGRAM.toBase58()}`);
console.log(`   • Cluster Offset:    ${CLUSTER_OFFSET}`);
console.log(`   • Comp Def Offset:   ${COMP_DEF_OFFSET}`);
console.log('');

// ============================================================================
// DERIVE PDA ADDRESSES
// ============================================================================

console.log('🔑 Computing PDA addresses...');
console.log('');

// 1. MXE Account (main account)
const [mxeAccount, mxeBump] = PublicKey.findProgramAddressSync(
  [Buffer.from('mxe'), PROGRAM_ID.toBuffer()],
  MXE_PROGRAM
);

console.log('✅ MXE Account:');
console.log(`   Address: ${mxeAccount.toBase58()}`);
console.log(`   Bump:    ${mxeBump}`);
console.log('');

// 2. Computation Definition
const [compDef, compDefBump] = PublicKey.findProgramAddressSync(
  [
    Buffer.from('comp_def'),
    mxeAccount.toBuffer(),
    new anchor.BN(COMP_DEF_OFFSET).toArrayLike(Buffer, 'le', 4)
  ],
  MXE_PROGRAM
);

console.log('✅ Computation Definition:');
console.log(`   Address: ${compDef.toBase58()}`);
console.log(`   Bump:    ${compDefBump}`);
console.log('');

// 3. Mempool
const [mempool, mempoolBump] = PublicKey.findProgramAddressSync(
  [Buffer.from('mempool'), mxeAccount.toBuffer()],
  MXE_PROGRAM
);

console.log('✅ Mempool:');
console.log(`   Address: ${mempool.toBase58()}`);
console.log(`   Bump:    ${mempoolBump}`);
console.log('');

// 4. Executing Pool
const [executingPool, executingPoolBump] = PublicKey.findProgramAddressSync(
  [Buffer.from('executing_pool'), mxeAccount.toBuffer()],
  MXE_PROGRAM
);

console.log('✅ Executing Pool:');
console.log(`   Address: ${executingPool.toBase58()}`);
console.log(`   Bump:    ${executingPoolBump}`);
console.log('');

// 5. Cluster
const [cluster, clusterBump] = PublicKey.findProgramAddressSync(
  [Buffer.from('cluster'), new anchor.BN(CLUSTER_OFFSET).toArrayLike(Buffer, 'le', 8)],
  MXE_PROGRAM
);

console.log('✅ Cluster:');
console.log(`   Address: ${cluster.toBase58()}`);
console.log(`   Bump:    ${clusterBump}`);
console.log('');

// 6. Sign Seed
const [signSeed, signSeedBump] = PublicKey.findProgramAddressSync(
  [Buffer.from('sign_seed'), mxeAccount.toBuffer()],
  MXE_PROGRAM
);

console.log('✅ Sign Seed:');
console.log(`   Address: ${signSeed.toBase58()}`);
console.log(`   Bump:    ${signSeedBump}`);
console.log('');

// 7. Staking Pool
const [stakingPool, stakingPoolBump] = PublicKey.findProgramAddressSync(
  [Buffer.from('staking_pool')],
  MXE_PROGRAM
);

console.log('✅ Staking Pool:');
console.log(`   Address: ${stakingPool.toBase58()}`);
console.log(`   Bump:    ${stakingPoolBump}`);
console.log('');

// ============================================================================
// COMPUTATION ACCOUNT (Dynamic per game)
// ============================================================================

console.log('📝 Note about Computation Account:');
console.log('   The computation account is derived PER GAME using:');
console.log('   - Seeds: ["computation", mxeAccount, comp_offset]');
console.log('   - comp_offset = game_id (unique for each game)');
console.log('');
console.log('   Your frontend should derive it dynamically:');
console.log('');
console.log('   const [computationAccount] = PublicKey.findProgramAddressSync(');
console.log('     [');
console.log('       Buffer.from("computation"),');
console.log('       mxeAccount.toBuffer(),');
console.log('       new anchor.BN(gameId).toArrayLike(Buffer, "le", 8)');
console.log('     ],');
console.log('     MXE_PROGRAM');
console.log('   );');
console.log('');

// ============================================================================
// TYPESCRIPT CODE FOR FRONTEND
// ============================================================================

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                    FRONTEND INTEGRATION CODE                                 ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('Copy this into your frontend code (e.g., hooks/useStartGame.ts):');
console.log('');
console.log('```typescript');
console.log('import { PublicKey } from "@solana/web3.js";');
console.log('import * as anchor from "@coral-xyz/anchor";');
console.log('');
console.log('// Arcium MXE Configuration');
console.log('const MXE_PROGRAM = new PublicKey("' + MXE_PROGRAM.toBase58() + '");');
console.log('const PROGRAM_ID = new PublicKey("' + PROGRAM_ID.toBase58() + '");');
console.log('const CLUSTER_OFFSET = ' + CLUSTER_OFFSET + ';');
console.log('');
console.log('// Static MXE accounts (computed once)');
console.log('const MXE_ACCOUNT = new PublicKey("' + mxeAccount.toBase58() + '");');
console.log('const COMP_DEF = new PublicKey("' + compDef.toBase58() + '");');
console.log('const MEMPOOL = new PublicKey("' + mempool.toBase58() + '");');
console.log('const EXECUTING_POOL = new PublicKey("' + executingPool.toBase58() + '");');
console.log('const CLUSTER = new PublicKey("' + cluster.toBase58() + '");');
console.log('const SIGN_SEED = new PublicKey("' + signSeed.toBase58() + '");');
console.log('const STAKING_POOL = new PublicKey("' + stakingPool.toBase58() + '");');
console.log('');
console.log('// Dynamic computation account (per game)');
console.log('function getComputationAccount(gameId: number): PublicKey {');
console.log('  const [computationAccount] = PublicKey.findProgramAddressSync(');
console.log('    [');
console.log('      Buffer.from("computation"),');
console.log('      MXE_ACCOUNT.toBuffer(),');
console.log('      new anchor.BN(gameId).toArrayLike(Buffer, "le", 8)');
console.log('    ],');
console.log('    MXE_PROGRAM');
console.log('  );');
console.log('  return computationAccount;');
console.log('}');
console.log('```');
console.log('');

// ============================================================================
// JSON OUTPUT
// ============================================================================

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                          JSON OUTPUT                                         ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');

const output = {
  programId: PROGRAM_ID.toBase58(),
  mxeProgram: MXE_PROGRAM.toBase58(),
  clusterOffset: CLUSTER_OFFSET,
  compDefOffset: COMP_DEF_OFFSET,
  accounts: {
    mxeAccount: mxeAccount.toBase58(),
    compDef: compDef.toBase58(),
    mempool: mempool.toBase58(),
    executingPool: executingPool.toBase58(),
    cluster: cluster.toBase58(),
    signSeed: signSeed.toBase58(),
    stakingPool: stakingPool.toBase58(),
  },
};

console.log(JSON.stringify(output, null, 2));
console.log('');

// ============================================================================
// INSTRUCTIONS
// ============================================================================

console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
console.log('║                            NEXT STEPS                                        ║');
console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('1. ✅ Copy the addresses above into your frontend code');
console.log('');
console.log('2. Initialize the computation definition (if not done):');
console.log('   $ arcium init-comp-def \\');
console.log('       --mxe-account ' + mxeAccount.toBase58() + ' \\');
console.log('       --comp-def-offset 1 \\');
console.log('       --keypair-path ~/.config/solana/id.json \\');
console.log('       --url https://api.devnet.solana.com');
console.log('');
console.log('3. Update your frontend to use these addresses');
console.log('');
console.log('4. Test the start game function!');
console.log('');
console.log('═══════════════════════════════════════════════════════════════════════════════');
