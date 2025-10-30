use anchor_lang::prelude::*;

// Module declarations MUST come before declare_id
pub mod types;
pub mod shared;
pub mod game;
pub mod player;
pub mod cards;
pub mod arcium;
pub mod betting;
pub mod showdown;
pub mod token;
pub mod security;
pub mod advanced;

declare_id!("B5E1V3DJsjMPzQb4QyMUuVhESqnWMXVcead4AEBvJB4W");

// Re-export account state structs for use in Account Context structs below
pub use game::state::Game;
pub use player::state::PlayerState;

#[program]
pub mod arcium_poker {
    use super::*;
    
    /// Initialize a new poker game
    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        game_id: u64,
        small_blind: Option<u64>,
        big_blind: Option<u64>,
        min_buy_in: Option<u64>,
        max_buy_in: Option<u64>,
        max_players: Option<u8>,
    ) -> Result<()> {
        game::initialize_handler(
            ctx,
            game_id,
            small_blind,
            big_blind,
            min_buy_in,
            max_buy_in,
            max_players,
        )
    }
    
    /// Player joins a game
    pub fn join_game(ctx: Context<JoinGame>, buy_in: u64) -> Result<()> {
        player::join_handler(ctx, buy_in)
    }
    
    /// Player leaves a game
    pub fn leave_game(ctx: Context<LeaveGame>) -> Result<()> {
        player::leave_handler(ctx)
    }
    
    /// Start the game - performs Arcium MPC shuffle and deals cards
    pub fn start_game(
        ctx: Context<StartGame>,
        player_entropy: Vec<[u8; 32]>,
    ) -> Result<()> {
        game::start_handler(ctx, player_entropy)
    }
    
    /// Player folds their hand
    pub fn player_fold(ctx: Context<PlayerAction>) -> Result<()> {
        betting::handle_fold(&mut ctx.accounts.game, &mut ctx.accounts.player_state)
    }
    
    /// Player checks (no bet)
    pub fn player_check(ctx: Context<PlayerAction>) -> Result<()> {
        betting::handle_check(&mut ctx.accounts.game, &mut ctx.accounts.player_state)
    }
    
    /// Player calls the current bet
    pub fn player_call(ctx: Context<PlayerAction>) -> Result<()> {
        betting::handle_call(&mut ctx.accounts.game, &mut ctx.accounts.player_state)
    }
    
    /// Player raises the bet
    pub fn player_raise(ctx: Context<PlayerAction>, raise_amount: u64) -> Result<()> {
        betting::handle_raise(&mut ctx.accounts.game, &mut ctx.accounts.player_state, raise_amount)
    }
    
    /// Player makes an opening bet
    pub fn player_bet(ctx: Context<PlayerAction>, bet_amount: u64) -> Result<()> {
        betting::handle_bet(&mut ctx.accounts.game, &mut ctx.accounts.player_state, bet_amount)
    }
    
    /// Player goes all-in
    pub fn player_all_in(ctx: Context<PlayerAction>) -> Result<()> {
        betting::handle_all_in(&mut ctx.accounts.game, &mut ctx.accounts.player_state)
    }
    
    /// Unified player action handler (for easier client integration)
    pub fn player_action(
        ctx: Context<PlayerAction>,
        action: types::PlayerActionParam,
    ) -> Result<()> {
        match action {
            types::PlayerActionParam::Fold => {
                betting::handle_fold(&mut ctx.accounts.game, &mut ctx.accounts.player_state)
            }
            types::PlayerActionParam::Check => {
                betting::handle_check(&mut ctx.accounts.game, &mut ctx.accounts.player_state)
            }
            types::PlayerActionParam::Call => {
                betting::handle_call(&mut ctx.accounts.game, &mut ctx.accounts.player_state)
            }
            types::PlayerActionParam::Bet { amount } => {
                betting::handle_bet(&mut ctx.accounts.game, &mut ctx.accounts.player_state, amount)
            }
            types::PlayerActionParam::Raise { amount } => {
                betting::handle_raise(&mut ctx.accounts.game, &mut ctx.accounts.player_state, amount)
            }
            types::PlayerActionParam::AllIn => {
                betting::handle_all_in(&mut ctx.accounts.game, &mut ctx.accounts.player_state)
            }
        }
    }
    
    /// Advance game to next stage (PreFlop -> Flop -> Turn -> River -> Showdown)
    pub fn advance_stage(ctx: Context<AdvanceStage>) -> Result<()> {
        game::advance_game_stage(&mut ctx.accounts.game)
    }
    
    /// Handle player timeout (auto-fold)
    pub fn timeout_player(ctx: Context<PlayerAction>) -> Result<()> {
        game::handle_player_timeout(&mut ctx.accounts.game, &mut ctx.accounts.player_state)
    }
    
    /// Start new hand (after previous hand completes)
    pub fn new_hand(ctx: Context<NewHand>) -> Result<()> {
        game::start_new_hand(&mut ctx.accounts.game)
    }
    
    /// End the game
    pub fn end_game(ctx: Context<EndGame>) -> Result<()> {
        game::end_game(&mut ctx.accounts.game)
    }
    
    /// Execute showdown - reveal cards and distribute winnings
    /// Note: This is a simplified version. Full implementation would handle
    /// encrypted card reveals via Arcium MPC
    pub fn execute_showdown(ctx: Context<ExecuteShowdown>) -> Result<()> {
        // Create pot manager from game state
        let mut pot_manager = betting::PotManager::new();
        pot_manager.main_pot = ctx.accounts.game.pot;
        // Side pots would be calculated from betting history
        
        // Load player states (simplified - would use remaining_accounts in production)
        let mut player_states = vec![(*ctx.accounts.player_state).clone()];
        
        showdown::handle_showdown(
            &mut ctx.accounts.game,
            &mut player_states,
            &pot_manager,
        )?;
        
        // Update player state
        *ctx.accounts.player_state = player_states[0].clone();
        
        Ok(())
    }
    
    /// Initialize computation definition for MPC shuffle
    /// Must be called once after deployment
    pub fn init_shuffle_comp_def(
        ctx: Context<InitCompDef>,
        comp_def_offset: u32,
    ) -> Result<()> {
        arcium::integration::init_computation_definition(
            &ctx.accounts.comp_def_account,
            &ctx.accounts.mxe_account,
            &ctx.accounts.authority,
            &ctx.accounts.system_program,
            comp_def_offset,
            0, // shuffle_deck instruction index
        )
    }
    
    /// Handle MXE callback with shuffle result
    /// Called by Arcium network after MPC computation completes
    pub fn handle_shuffle_callback(
        ctx: Context<MxeCallback>,
        computation_id: [u8; 32],
        encrypted_output: Vec<u8>,
    ) -> Result<()> {
        arcium::integration::handle_shuffle_callback(
            &mut ctx.accounts.game,
            computation_id,
            encrypted_output,
        )
    }
}

// ============================================================================
// Account Context Structs - MUST be at crate root for Anchor macro
// ============================================================================

#[derive(Accounts)]
#[instruction(game_id: u64)]
pub struct InitializeGame<'info> {
    #[account(
        init,
        payer = authority,
        space = Game::LEN,
        seeds = [b"game", authority.key().as_ref(), &game_id.to_le_bytes()],
        bump
    )]
    pub game: Account<'info, Game>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    /// Game authority (creator) must start the game
    #[account(constraint = authority.key() == game.authority @ shared::PokerError::InvalidAction)]
    pub authority: Signer<'info>,
    
    /// MXE program for encrypted computations
    /// CHECK: Arcium MXE program ID verified in handler
    pub mxe_program: AccountInfo<'info>,
    
    /// MXE account for this program
    /// CHECK: PDA derived from program ID
    #[account(mut)]
    pub mxe_account: AccountInfo<'info>,
    
    /// Computation definition account for shuffle
    /// CHECK: PDA derived from comp def offset
    #[account(mut)]
    pub comp_def_account: AccountInfo<'info>,
    
    /// Mempool account for queueing computations
    /// CHECK: PDA derived from program ID
    #[account(mut)]
    pub mempool_account: AccountInfo<'info>,
    
    /// Executing pool account
    /// CHECK: PDA derived from program ID
    #[account(mut)]
    pub executing_pool_account: AccountInfo<'info>,
    
    /// Cluster account
    /// CHECK: Verified cluster on Arcium network
    pub cluster_account: AccountInfo<'info>,
    
    /// Computation account (will be created)
    /// CHECK: PDA derived from computation offset
    #[account(mut)]
    pub computation_account: AccountInfo<'info>,

    /// Sign seed PDA
    /// CHECK: PDA derived from MXE program
    pub sign_seed: AccountInfo<'info>,

    /// Staking pool PDA
    /// CHECK: PDA derived from MXE program
    pub staking_pool: AccountInfo<'info>,

    pub system_program: Program<'info, System>,

    /// Clock sysvar
    /// CHECK: Clock sysvar account
    pub clock: AccountInfo<'info>,

    // Remaining accounts: PlayerState accounts for all players in order
    // These will be validated and updated during execution
}

#[derive(Accounts)]
pub struct JoinGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    #[account(
        init,
        payer = player,
        space = PlayerState::LEN,
        seeds = [b"player", game.key().as_ref(), player.key().as_ref()],
        bump
    )]
    pub player_state: Account<'info, PlayerState>,
    
    #[account(mut)]
    pub player: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LeaveGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    #[account(
        mut,
        close = player,
        seeds = [b"player", game.key().as_ref(), player.key().as_ref()],
        bump = player_state.bump,
        has_one = game,
        has_one = player
    )]
    pub player_state: Account<'info, PlayerState>,
    
    #[account(mut)]
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct PlayerAction<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    #[account(
        mut,
        seeds = [b"player", game.key().as_ref(), player.key().as_ref()],
        bump = player_state.bump,
        has_one = game,
        has_one = player
    )]
    pub player_state: Account<'info, PlayerState>,
    
    #[account(mut)]
    pub player: Signer<'info>,
}

#[derive(Accounts)]
pub struct AdvanceStage<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    /// Any player or authority can advance the stage
    pub signer: Signer<'info>,
    
    // Remaining accounts: PlayerState accounts for all players
}

#[derive(Accounts)]
pub struct NewHand<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    /// Game authority must start new hand
    #[account(constraint = authority.key() == game.authority @ shared::PokerError::InvalidAction)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct EndGame<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    /// Game authority must end the game
    #[account(constraint = authority.key() == game.authority @ shared::PokerError::InvalidAction)]
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteShowdown<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    #[account(
        mut,
        seeds = [b"player", game.key().as_ref(), player.key().as_ref()],
        bump = player_state.bump,
        has_one = game,
        has_one = player
    )]
    pub player_state: Account<'info, PlayerState>,
    
    pub player: Signer<'info>,
    
    // Remaining accounts: Other PlayerState accounts for all players in showdown
}

#[derive(Accounts)]
pub struct InitCompDef<'info> {
    /// MXE account
    /// CHECK: PDA derived from program ID
    #[account(mut)]
    pub mxe_account: AccountInfo<'info>,
    
    /// Computation definition account to initialize
    /// CHECK: Will be created by Arcium
    #[account(mut)]
    pub comp_def_account: AccountInfo<'info>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MxeCallback<'info> {
    #[account(mut)]
    pub game: Account<'info, Game>,
    
    /// MXE program calling back
    /// CHECK: Verified as MXE program
    pub mxe_program: AccountInfo<'info>,
    
    /// Computation account with results
    /// CHECK: Verified via computation ID
    pub computation_account: AccountInfo<'info>,
}
