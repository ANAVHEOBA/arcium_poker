// Arcium MPC integration module - Module 2 (CRITICAL)
pub mod types;
pub mod mpc_shuffle;
pub mod mpc_deal;
pub mod mpc_reveal;
pub mod integration;

// Export specific types only, not glob
pub use mpc_shuffle::{ShuffleResult, ShuffleParams, mpc_shuffle_deck, verify_shuffle};
pub use mpc_deal::{EncryptedCard, DealParams, mpc_deal_card, mpc_deal_cards};
pub use mpc_reveal::{RevealParams, mpc_reveal_card, mpc_reveal_cards, verify_reveal};

// Export real Arcium integration (for production use)
pub use integration::{
    MxeInstructionData,
    MxeCallbackData,
    EncryptedData,
    ArciumConfig,
    queue_mxe_computation,
    handle_shuffle_callback,
    init_computation_definition,
    verify_mxe_proof,
};