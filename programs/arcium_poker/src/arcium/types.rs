use anchor_lang::prelude::*;
use borsh::{BorshDeserialize, BorshSerialize};

/// Arcium Argument enum - represents inputs to MPC computations
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub enum Argument {
    PlaintextBool(bool),
    PlaintextU8(u8),
    PlaintextU16(u16),
    PlaintextU32(u32),
    PlaintextU64(u64),
    PlaintextU128(u128),
    PlaintextFloat(f64),
    EncryptedBool([u8; 32]),
    EncryptedU8([u8; 32]),
    EncryptedU16([u8; 32]),
    EncryptedU32([u8; 32]),
    EncryptedU64([u8; 32]),
    EncryptedU128([u8; 32]),
    EncryptedFloat([u8; 32]),
    ArcisPubkey([u8; 32]),
    ArcisSignature([u8; 64]),
    Account(Pubkey, u32, u32),
    ManticoreAlgo(String),
    InputDataset(String),
}

/// Arcium CallbackAccount - account metadata for callbacks
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct CallbackAccount {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

/// Arcium CallbackInstruction - custom callback after computation completes
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct CallbackInstruction {
    pub program_id: Pubkey,
    pub discriminator: Vec<u8>,
    pub accounts: Vec<CallbackAccount>,
}

/// Arguments for queue_computation instruction
#[derive(Clone, Debug, BorshSerialize, BorshDeserialize)]
pub struct QueueComputationArgs {
    pub comp_offset: u64,
    pub computation_definition_offset: u32,
    pub cluster_index: Option<u16>,
    pub args: Vec<Argument>,
    pub mxe_program: Pubkey,
    pub callback_url: Option<String>,
    pub custom_callback_instructions: Vec<CallbackInstruction>,
    pub input_delivery_fee: u64,
    pub output_delivery_fee: u64,
    pub cu_price_micro: u64,
}
