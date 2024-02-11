module move_mania::crash {

  use std::bcs;
  use std::hash;
  use std::signer;
  use std::vector;
  use aptos_framework::account;
  use aptos_framework::timestamp;
  use std::option::{Self, Option};
  use std::string::{Self, String};
  use std::simple_map::{Self, SimpleMap};
  use aptos_framework::coin::{Self, Coin};
  use aptos_framework::aptos_coin::{AptosCoin};
  use aptos_framework::event::{Self, EventHandle};
  use aptos_framework::randomness::{Self, PerBlockRandomness};
  
  const SEED: vector<u8> = b"move-mania-crash";
  const MAX_CRASH_POINT: u64 = 100_000; // 100 seconds in milliseconds
  
  struct State has key {
    signer_cap: account::SignerCapability,
    current_game: Option<Game>,
    house_pool: Coin<AptosCoin>
  }

  struct Game has store {
    // id: u64, 
    start_time_ms: u64,
    house_secret_hash: vector<u8>,
    salt_hash: vector<u8>,
    randomness: u64,
    bets: SimpleMap<address, Bet>,
    crash_point_ms: Option<u64>
  }

  struct Bet has store {
    player: address, 
    bet_amount: u64, 
    cash_out: Option<u64>
  }

  fun init_module(admin: &signer) {
    let (resource_account_signer, signer_cap) = account::create_resource_account(admin, SEED);

    coin::register<AptosCoin>(&resource_account_signer);

    move_to<State>(
      &resource_account_signer,
      State {
        signer_cap: signer_cap,
        current_game: option::none(),
        house_pool: coin::zero<AptosCoin>()
      }
    );
  }

  entry fun start_game(
    admin: &signer, 
    start_time_ms: u64,
    house_secret_hash: vector<u8>, 
    salt_hash: vector<u8>
  ) acquires State {
    // assume this is the admin account
    let state = borrow_global_mut<State>(get_resource_address());

    // Check params

    if (option::is_some(&state.current_game)) {
      abort(1)
    } else {
      let new_game = Game {
        start_time_ms, 
        house_secret_hash,
        salt_hash,
        bets: simple_map::new(),
        randomness: randomness::u64_range(0, 100),
        crash_point_ms: option::none()
      };
      option::fill(&mut state.current_game, new_game);
    }
  }

  public entry fun place_bet(
    player: &signer,
    bet_amount: u64
  ) acquires State {
    let state = borrow_global_mut<State>(get_resource_address());

    assert!(option::is_some(&state.current_game), 1);

    let game_mut_ref = option::borrow_mut(&mut state.current_game);
    assert!(timestamp::now_microseconds() < game_mut_ref.start_time_ms, 2);

    let new_bet = Bet {
      player: signer::address_of(player),
      bet_amount,
      cash_out: option::none()
    };
    simple_map::add(&mut game_mut_ref.bets, signer::address_of(player), new_bet);
    
    let bet_coin = coin::withdraw(player, bet_amount);
    coin::merge(&mut state.house_pool, bet_coin);
  }

  public entry fun cash_out(
    player: &signer
  ) acquires State {
    let state = borrow_global_mut<State>(get_resource_address());
    assert!(option::is_some(&state.current_game), 1);

    let game_mut_ref = option::borrow_mut(&mut state.current_game);
    assert!(timestamp::now_microseconds() < game_mut_ref.start_time_ms, 2);

    let bet = simple_map::borrow_mut(&mut game_mut_ref.bets, &signer::address_of(player));
    assert!(option::is_none(&bet.cash_out), 3);
  
    let cash_out = timestamp::now_microseconds() - game_mut_ref.start_time_ms;
    bet.cash_out = option::some(cash_out);
  }

  public entry fun reveal_crashpoint_and_distribute_winnings(
    house_secret: u64, 
    salt: u64
  ) acquires State {
    let state = borrow_global_mut<State>(get_resource_address());
    assert!(option::is_some(&state.current_game), 1);

    let game_mut_ref = option::borrow_mut(&mut state.current_game);
    assert!(timestamp::now_microseconds() < game_mut_ref.start_time_ms, 2);

    assert!(
      verify_hashes(
        &house_secret, 
        &salt, 
        &game_mut_ref.house_secret_hash, 
        &game_mut_ref.salt_hash
      ), 
      3
    );

    let crash_point_ms = (game_mut_ref.randomness + house_secret) % MAX_CRASH_POINT;

    assert!(timestamp::now_microseconds() > crash_point_ms, 4);

    let game = option::extract(&mut state.current_game);
    let Game {
      start_time_ms: _,
      house_secret_hash: _,
      salt_hash: _,
      randomness: _,
      bets: game_bets,
      crash_point_ms: _
    } = game;
    let (betters, bets) = simple_map::to_vec_pair(game_bets);

    let number_of_bets = vector::length(&betters);
    let cleared_betters = 0;

    while (cleared_betters < number_of_bets) {
      let better = vector::pop_back(&mut betters);
      let bet = vector::pop_back(&mut bets);

      let winnings = determine_win(bet, crash_point_ms);

      if (winnings > 0) {
        let winnings_coin = coin::extract(&mut state.house_pool, winnings);
        coin::deposit(better, winnings_coin);
      };

      cleared_betters = cleared_betters + 1;
    };

    vector::destroy_empty(betters);
    vector::destroy_empty(bets);
  }

  /* 
    Create and return the address of the module's resource account
    @return - address of the module's resource account
  */ 
  inline fun get_resource_address(): address {
    account::create_resource_address(&@move_mania, SEED)
  }

  inline fun verify_hashes(
    house_secret: &u64, 
    salt: &u64, 
    house_secret_hash: &vector<u8>,
    salt_hash: &vector<u8>
  ): bool {
    let house_secret_bytes = bcs::to_bytes(house_secret);
    let salt_bytes = bcs::to_bytes(salt);
    vector::append(&mut house_secret_bytes, copy salt_bytes);

    let actual_house_secret_hash = hash::sha3_256(house_secret_bytes);
    let actual_salt_hash = hash::sha3_256(salt_bytes);

    &actual_house_secret_hash == house_secret_hash && &actual_salt_hash == salt_hash
  }

  inline fun determine_win(
    bet: Bet, 
    crash_point_ms: u64
  ): u64{
    let Bet {
      player: _,
      bet_amount,
      cash_out: player_cash_out_option
    } = bet;

    if (option::is_none(&player_cash_out_option)) {
      0
    } else {
      let player_cash_out = option::extract(&mut player_cash_out_option);
      if (player_cash_out < crash_point_ms) {
        let winnings = bet_amount * player_cash_out / 100; 
        winnings
      } else {
        0
      }
    }
  }
}