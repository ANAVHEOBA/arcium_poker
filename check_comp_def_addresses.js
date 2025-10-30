const { PublicKey } = require('@solana/web3.js');

// MXE program ID
const MXE_PROGRAM_ID = new PublicKey('BKck65TgoKRokMjQM3datB9oRwJ8rAj2jxPXvHXUvcL6');
const MXE_ACCOUNT = new PublicKey('HyEnFUXebxGdJLoaTq2cfRtKht7Ke6gkMNrsBx8vBHMo');

// Old cluster offset (wrong)
const OLD_CLUSTER_OFFSET = 1078779259;
// New cluster offset (correct)
const NEW_CLUSTER_OFFSET = 2326510165;

function deriveCompDefPDA(mxeProgramId, mxeAccount, clusterOffset, compDefOffset) {
    const [pda, bump] = PublicKey.findProgramAddressSync(
        [
            Buffer.from('comp_def'),
            mxeAccount.toBuffer(),
            Buffer.from(clusterOffset.toString()),
            Buffer.from(compDefOffset.toString()),
        ],
        mxeProgramId
    );
    return { pda: pda.toBase58(), bump };
}

console.log('\n=== COMP_DEF ADDRESSES WITH DIFFERENT CLUSTER OFFSETS ===\n');

console.log('OLD Cluster Offset:', OLD_CLUSTER_OFFSET);
const oldShufflePDA = deriveCompDefPDA(MXE_PROGRAM_ID, MXE_ACCOUNT, OLD_CLUSTER_OFFSET, 1);
console.log('  shuffle_deck comp_def:', oldShufflePDA.pda);

console.log('\nNEW Cluster Offset:', NEW_CLUSTER_OFFSET);
const newShufflePDA = deriveCompDefPDA(MXE_PROGRAM_ID, MXE_ACCOUNT, NEW_CLUSTER_OFFSET, 1);
console.log('  shuffle_deck comp_def:', newShufflePDA.pda);

console.log('\n=== COMPARISON ===');
if (oldShufflePDA.pda === newShufflePDA.pda) {
    console.log('✅ SAME ADDRESS - Cluster offset doesn\'t matter for comp_def PDA');
} else {
    console.log('❌ DIFFERENT ADDRESSES - This is the problem!');
    console.log('   The comp_def PDA changed because we changed the cluster offset.');
}
