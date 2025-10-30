use anchor_lang::prelude::*;
use super::state::Game;
use crate::player::state::PlayerState;
use crate::arcium::mpc_shuffle::{mpc_shuffle_deck, ShuffleParams};
use crate::arcium::mpc_deal::{mpc_deal_card, DealParams};
use crate::types::GameStage;
use crate::shared::{constants::*, PokerError};

/// Start the poker game - triggers MPC shuffle and deals hole cards
pub fn handler(
    ctx: Context<crate::StartGame>,
    player_entropy: Vec<[u8; 32]>, // Each player provides randomness
) -> Result<()> {
    let game = &mut ctx.accounts.game;
    
    // Validate game can start
    require!(
        game.stage == GameStage::Waiting,
        PokerError::GameAlreadyStarted
    );
    require!(
        game.player_count >= MIN_PLAYERS as u8,
        PokerError::NotEnoughPlayers
    );
    require!(
        player_entropy.len() == game.player_count as usize,
        PokerError::InvalidGameConfig
    );
    
    msg!("[GAME START] Starting game {} with {} players", game.game_id, game.player_count);
    
    // ========================================================================
    // STEP 1: ARCIUM MPC SHUFFLE 🔐
    // ========================================================================
    msg!("[ARCIUM MPC] Initiating secure shuffle...");
    
    // Collect all player pubkeys
    let players: Vec<Pubkey> = game.players[..game.player_count as usize]
        .iter()
        .copied()
        .collect();
    
    // Perform MPC shuffle with all players contributing entropy
    // Use REAL Arcium MPC with MXE accounts
    use crate::arcium::mpc_shuffle::MxeShuffleParams;
    
    // Generate computation offset (unique ID for this computation)
    let computation_offset = game.game_id;

    // Computation definition offset (from init-mxe)
    let comp_def_offset = 1u32; // Using offset 1 (initialized in MXE)

    let mxe_shuffle_params = MxeShuffleParams {
        mxe_program: Some(ctx.accounts.mxe_program.clone()),
        mxe_account: Some(ctx.accounts.mxe_account.clone()),
        comp_def: Some(ctx.accounts.comp_def_account.clone()),
        mempool: Some(ctx.accounts.mempool_account.clone()),
        cluster: Some(ctx.accounts.cluster_account.clone()),
        computation_account: Some(ctx.accounts.computation_account.clone()),
        authority: Some(ctx.accounts.authority.to_account_info()),
        sign_seed: Some(ctx.accounts.sign_seed.clone()),
        executing_pool: Some(ctx.accounts.executing_pool_account.clone()),
        staking_pool: Some(ctx.accounts.staking_pool.clone()),
        system_program: Some(ctx.accounts.system_program.to_account_info()),
        clock: Some(ctx.accounts.clock.clone()),
        encrypted_entropy: player_entropy.clone(),
        computation_offset,
        comp_def_offset,
        player_pubkeys: players.clone(),
        game_id: game.game_id,
    };
    
    let shuffle_result = crate::arcium::mpc_shuffle::mpc_shuffle_deck_with_mxe(mxe_shuffle_params)?;
    
    msg!(
        "[ARCIUM MPC] Shuffle complete! Session ID: {:?}",
        &shuffle_result.session_id[..8]
    );
    msg!(
        "[ARCIUM MPC] Commitment: {:?}",
        &shuffle_result.commitment[..8]
    );
    
    // Store shuffle result in game state
    game.encrypted_deck = shuffle_result.session_id;
    game.deck_initialized = true;
    
    // ========================================================================
    // STEP 2: DEAL ENCRYPTED HOLE CARDS 🎴
    // ========================================================================
    msg!("[DEALING] Dealing encrypted hole cards to all players...");
    
    // Deal 2 hole cards to each player (encrypted via Arcium MPC)
    let mut card_index = 0u8;

    for (i, player_account) in ctx.remaining_accounts.iter().enumerate() {
        if i >= game.player_count as usize {
            break;
        }

        let player_pubkey = game.players[i];
        msg!("[DEALING] Dealing to player {} at seat {}", player_pubkey, i);

        // Borrow and deserialize player state to update encrypted_hole_cards
        let mut data = player_account.try_borrow_mut_data()?;
        let mut player_data = &data[..];
        let mut player_state = PlayerState::try_deserialize(&mut player_data)?;

        // Deal hole cards using Arcium MPC
        for hole_card_num in 0..HOLE_CARDS {
            let deal_params = DealParams {
                card_index: shuffle_result.shuffled_indices[card_index as usize],
                player: player_pubkey,
                session_id: shuffle_result.session_id,
                game_id: game.game_id,
            };

            let encrypted_card = mpc_deal_card(deal_params)?;

            // ✅ FIX: Store encrypted card in PlayerState
            player_state.encrypted_hole_cards[hole_card_num as usize] = encrypted_card.encrypted_index;

            msg!(
                "[DEALING] Card {}/{} dealt to seat {} (encrypted index: {})",
                hole_card_num + 1,
                HOLE_CARDS,
                i,
                encrypted_card.encrypted_index
            );

            card_index += 1;
        }

        // ✅ FIX: Serialize updated player state back to account
        let mut writer = &mut data[..];
        player_state.try_serialize(&mut writer)?;

        msg!("[DEALING] Updated PlayerState for seat {} with encrypted hole cards", i);
    }
    
    // ========================================================================
    // STEP 3: INITIALIZE GAME STATE & POST BLINDS
    // ========================================================================
    
    // Set game stage to PreFlop
    game.stage = GameStage::PreFlop;
    
    // Set dealer button (starts at position 0)
    game.dealer_position = 0;
    
    // Calculate blind positions
    let small_blind_seat = (game.dealer_position + 1) % game.player_count;
    let big_blind_seat = (game.dealer_position + 2) % game.player_count;
    
    // First player after big blind acts first
    game.current_player_index = (game.dealer_position + 3) % game.player_count;
    
    // Set timestamp
    game.started_at = Clock::get()?.unix_timestamp;
    game.last_action_at = game.started_at;
    
    // Reset pot and bets
    game.pot = 0;
    game.current_bet = game.big_blind;
    
    msg!("[GAME START] Game initialized!");
    msg!("[GAME START] Dealer button at seat {}", game.dealer_position);
    msg!("[GAME START] Small blind seat: {}, Big blind seat: {}", small_blind_seat, big_blind_seat);
    msg!("[GAME START] Current player: seat {}", game.current_player_index);
    msg!("[GAME START] Stage: {:?}", game.stage);
    
    // ========================================================================
    // STEP 4: POST BLINDS AUTOMATICALLY
    // ========================================================================
    msg!("[BLINDS] Posting blinds automatically...");
    
    // Post blinds if player accounts are provided in remaining_accounts
    if ctx.remaining_accounts.len() >= game.player_count as usize {
        post_blind(
            &ctx.remaining_accounts[small_blind_seat as usize],
            game.small_blind,
            small_blind_seat,
            &mut game.pot,
        )?;
        
        post_blind(
            &ctx.remaining_accounts[big_blind_seat as usize],
            game.big_blind,
            big_blind_seat,
            &mut game.pot,
        )?;
        
        msg!("[BLINDS] Blinds posted successfully. Pot: {}", game.pot);
    } else {
        msg!("[BLINDS] No player accounts - blinds enforced via current_bet");
        msg!("[BLINDS] Players must call {} to match big blind", game.current_bet);
    }
    
    Ok(())
}

/// Helper function to post a blind
fn post_blind<'info>(
    player_account_info: &AccountInfo<'info>,
    blind_amount: u64,
    seat_index: u8,
    pot: &mut u64,
) -> Result<()> {
    // Borrow and deserialize player state
    let mut data = player_account_info.try_borrow_mut_data()?;
    
    // Deserialize (try_deserialize handles discriminator automatically)
    let mut player_data = &data[..];
    let mut player_state = crate::player::state::PlayerState::try_deserialize(&mut player_data)?;
    
    // Verify seat
    require!(
        player_state.seat_index == seat_index,
        PokerError::InvalidAction
    );
    
    // Post blind
    player_state.place_bet(blind_amount)?;
    *pot += blind_amount;
    
    // Serialize back (includes discriminator)
    let mut writer = &mut data[..];
    player_state.try_serialize(&mut writer)?;
    
    msg!("[BLINDS] Posted {} chips from seat {}", blind_amount, seat_index);
    
    Ok(())
}

// StartGame struct moved to lib.rs at crate root (required by Anchor)