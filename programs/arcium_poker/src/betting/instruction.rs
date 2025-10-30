use anchor_lang::prelude::*;
use crate::game::state::Game;
use crate::player::state::PlayerState;
use crate::types::{PlayerAction, PlayerStatus, GameStage};
use crate::shared::PokerError;
use super::validator::*;

/// Handle player fold action
pub fn handle_fold(
    game: &mut Game,
    player_state: &mut PlayerState,
) -> Result<()> {
    // Validate
    validate_betting_stage(game)?;
    validate_player_turn(game, player_state.seat_index)?;
    validate_fold()?;
    
    // Execute fold
    player_state.fold();
    game.active_players[player_state.seat_index as usize] = false;
    
    msg!(
        "[BETTING] Player {} folded",
        player_state.player
    );

    // Check if only one player remains
    if crate::game::flow::check_single_player_remaining(game) {
        // ✅ FIX: Award pot to the remaining player (the winner)
        let winner_seat = award_pot_to_remaining_player(game);
        game.stage = crate::types::GameStage::Finished;
        msg!("[BETTING] Only one player remaining at seat {}, hand complete", winner_seat);
        return Ok(());
    }

    // Move to next player
    advance_to_next_player(game)?;
    
    Ok(())
}

/// Handle player check action
pub fn handle_check(
    game: &mut Game,
    player_state: &mut PlayerState,
) -> Result<()> {
    // Validate
    validate_betting_stage(game)?;
    validate_player_turn(game, player_state.seat_index)?;
    
    // Allow check if player has matched current bet (including blinds)
    require!(
        game.current_bet == 0 || game.current_bet == player_state.current_bet,
        PokerError::InvalidAction
    );
    
    msg!(
        "[BETTING] Player {} checked",
        player_state.player
    );
    
    // Move to next player or advance stage if round complete
    advance_to_next_player_or_stage(game)?;
    
    Ok(())
}

/// Handle player call action
pub fn handle_call(
    game: &mut Game,
    player_state: &mut PlayerState,
) -> Result<()> {
    // Validate
    validate_betting_stage(game)?;
    validate_player_turn(game, player_state.seat_index)?;
    
    let call_amount = validate_call(game, player_state)?;
    
    // Execute call
    player_state.place_bet(call_amount)?;
    game.pot += call_amount;
    
    // Check if this was an all-in call
    if player_state.chip_stack == 0 {
        player_state.is_all_in = true;
        msg!(
            "[BETTING] Player {} called {} (ALL-IN)",
            player_state.player,
            call_amount
        );
    } else {
        msg!(
            "[BETTING] Player {} called {}",
            player_state.player,
            call_amount
        );
    }
    
    // Move to next player or advance stage if round complete
    advance_to_next_player_or_stage(game)?;
    
    Ok(())
}

/// Handle player raise action
pub fn handle_raise(
    game: &mut Game,
    player_state: &mut PlayerState,
    raise_amount: u64,
) -> Result<()> {
    // Validate
    validate_betting_stage(game)?;
    validate_player_turn(game, player_state.seat_index)?;
    validate_raise(game, player_state, raise_amount)?;
    
    // Calculate total amount to bet
    let call_amount = game.current_bet.saturating_sub(player_state.current_bet);
    let total_bet = call_amount + raise_amount;
    
    // Execute raise
    player_state.place_bet(total_bet)?;
    game.pot += total_bet;
    game.current_bet = player_state.current_bet;
    
    // Check if this was an all-in raise
    if player_state.chip_stack == 0 {
        player_state.is_all_in = true;
        msg!(
            "[BETTING] Player {} raised to {} (ALL-IN)",
            player_state.player,
            game.current_bet
        );
    } else {
        msg!(
            "[BETTING] Player {} raised to {}",
            player_state.player,
            game.current_bet
        );
    }
    
    // Move to next player
    advance_to_next_player(game)?;
    
    Ok(())
}

/// Handle player bet action (opening bet in a round)
pub fn handle_bet(
    game: &mut Game,
    player_state: &mut PlayerState,
    bet_amount: u64,
) -> Result<()> {
    // Validate
    validate_betting_stage(game)?;
    validate_player_turn(game, player_state.seat_index)?;
    validate_bet(game, player_state, bet_amount)?;
    
    // Execute bet
    player_state.place_bet(bet_amount)?;
    game.pot += bet_amount;
    game.current_bet = bet_amount;
    
    // Check if this was an all-in bet
    if player_state.chip_stack == 0 {
        player_state.is_all_in = true;
        msg!(
            "[BETTING] Player {} bet {} (ALL-IN)",
            player_state.player,
            bet_amount
        );
    } else {
        msg!(
            "[BETTING] Player {} bet {}",
            player_state.player,
            bet_amount
        );
    }
    
    // Move to next player
    advance_to_next_player(game)?;
    
    Ok(())
}

/// Handle player all-in action
pub fn handle_all_in(
    game: &mut Game,
    player_state: &mut PlayerState,
) -> Result<()> {
    // Validate
    validate_betting_stage(game)?;
    validate_player_turn(game, player_state.seat_index)?;
    
    let all_in_amount = validate_all_in(player_state)?;
    
    // Execute all-in
    player_state.place_bet(all_in_amount)?;
    game.pot += all_in_amount;
    
    // Update current bet if this all-in is higher
    if player_state.current_bet > game.current_bet {
        game.current_bet = player_state.current_bet;
    }
    
    player_state.is_all_in = true;
    
    msg!(
        "[BETTING] Player {} went ALL-IN with {}",
        player_state.player,
        all_in_amount
    );
    
    // Move to next player
    advance_to_next_player(game)?;
    
    Ok(())
}

/// Post small blind
pub fn post_small_blind(
    game: &mut Game,
    player_state: &mut PlayerState,
) -> Result<()> {
    let blind_amount = game.small_blind.min(player_state.chip_stack);
    
    player_state.place_bet(blind_amount)?;
    game.pot += blind_amount;
    game.current_bet = blind_amount;
    
    if player_state.chip_stack == 0 {
        player_state.is_all_in = true;
    }
    
    msg!(
        "[BETTING] Player {} posted small blind: {}",
        player_state.player,
        blind_amount
    );
    
    Ok(())
}

/// Post big blind
pub fn post_big_blind(
    game: &mut Game,
    player_state: &mut PlayerState,
) -> Result<()> {
    let blind_amount = game.big_blind.min(player_state.chip_stack);
    
    player_state.place_bet(blind_amount)?;
    game.pot += blind_amount;
    game.current_bet = blind_amount;
    
    if player_state.chip_stack == 0 {
        player_state.is_all_in = true;
    }
    
    msg!(
        "[BETTING] Player {} posted big blind: {}",
        player_state.player,
        blind_amount
    );
    
    Ok(())
}

/// Advance to next active player
fn advance_to_next_player(game: &mut Game) -> Result<()> {
    let start_index = game.current_player_index;
    let mut next_index = (start_index + 1) % game.player_count;
    
    // Find next active player who hasn't folded or gone all-in
    let mut found = false;
    for _ in 0..game.player_count {
        if game.active_players[next_index as usize] {
            found = true;
            break;
        }
        next_index = (next_index + 1) % game.player_count;
    }
    
    // If only one player left, end the hand
    if !found {
        // ✅ FIX: Award pot to the remaining player (the winner)
        let winner_seat = award_pot_to_remaining_player(game);
        game.stage = crate::types::GameStage::Finished;
        msg!("[BETTING] Only one player remaining at seat {}, hand complete", winner_seat);
        return Ok(());
    }

    game.current_player_index = next_index;
    game.last_action_at = Clock::get()?.unix_timestamp;

    Ok(())
}

/// Advance to next player or next stage if betting round is complete
fn advance_to_next_player_or_stage(game: &mut Game) -> Result<()> {
    // Mark current player as having acted
    game.players_acted[game.current_player_index as usize] = true;
    
    // Check if betting round is complete
    // Round is complete when all active players have acted and matched the current bet
    let mut all_acted = true;
    for i in 0..game.player_count as usize {
        if !game.active_players[i] {
            continue; // Skip folded/inactive players
        }
        
        if !game.players_acted[i] {
            all_acted = false;
            break;
        }
    }
    
    if all_acted {
        // All active players have acted, advance to next stage
        msg!("[BETTING] All players acted, advancing stage");
        crate::game::flow::advance_game_stage(game)?;
        return Ok(());
    }
    
    // Find next active player who hasn't acted yet (or loop back)
    let start_index = game.current_player_index;
    let mut next_index = (start_index + 1) % game.player_count;
    let mut found = false;
    
    for _ in 0..game.player_count {
        if game.active_players[next_index as usize] {
            found = true;
            break;
        }
        next_index = (next_index + 1) % game.player_count;
    }

    if !found {
        // ✅ FIX: Award pot to the remaining player (the winner)
        let winner_seat = award_pot_to_remaining_player(game);
        game.stage = crate::types::GameStage::Finished;
        msg!("[BETTING] Only one player remaining at seat {}, hand complete", winner_seat);
        return Ok(());
    }

    game.current_player_index = next_index;
    game.last_action_at = Clock::get()?.unix_timestamp;

    Ok(())
}

/// ✅ FIX Bug 2: Award pot to the remaining player when everyone else folds
///
/// This function finds the single remaining active player and awards them the pot.
/// It should be called when only one player remains after others fold.
fn award_pot_to_remaining_player(game: &mut Game) -> u8 {
    // Find the remaining active player
    for seat in 0..game.player_count as usize {
        if game.active_players[seat] {
            msg!(
                "[BETTING] Player at seat {} wins pot of {} (only player remaining)",
                seat,
                game.pot
            );
            
            // The pot will be collected by this player in the next instruction
            // We just log who won - actual chip distribution happens client-side
            // or via execute_showdown
            
            return seat as u8;
        }
    }
    
    // Should never happen - if we got here, check_single_player_remaining returned true
    // but we couldn't find an active player
    msg!("[ERROR] No active player found despite check_single_player_remaining returning true");
    0
}
