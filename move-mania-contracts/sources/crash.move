module zion::crash {

  use std::bcs;
  use std::hash;
  use std::signer;
  use std::vector;
  use zion::liquidity_pool;
  use aptos_framework::account;
  use aptos_framework::timestamp;
  use std::option::{Self, Option};
  use std::string::{Self, String};
  use std::simple_map::{Self, SimpleMap};
  use aptos_framework::coin::{Self, Coin};
  use aptos_framework::aptos_coin::{AptosCoin};
  use aptos_framework::event::{Self, EventHandle};
  use aptos_framework::randomness::{Self, PerBlockRandomness};
  use aptos_framework::math128;
  use aptos_framework::string_utils;

  use std::debug::print;
  
  const SEED: vector<u8> = b"zion-crash";
  const MAX_CRASH_POINT: u128 = 340282366920938463463374607431768211455; // 2^64 - 1
  const COUNTDOWN_MS: u64 = 20 * 1_000_000;
  
  struct State has key {
    signer_cap: account::SignerCapability,
    current_game: Option<Game>,
  }

  struct Game has store {
    // id: u64, 
    start_time_ms: u64,
    house_secret_hash: vector<u8>,
    salt_hash: vector<u8>,
    randomness: u64,
    bets: SimpleMap<address, Bet>,
    // crash_point_ms: Option<u64>
  }

  struct Bet has store {
    player: address, 
    bet_amount: u64, 
    cash_out: Option<u64>
  }

  /**
  * Initializes the module by creating the module's resource account and initializing the state 
  * resource. 
  * @param admin - the signer of the admin account
  */
  fun init_module(admin: &signer) {
    let (resource_account_signer, signer_cap) = account::create_resource_account(admin, SEED);

    coin::register<AptosCoin>(&resource_account_signer);

    move_to<State>(
      &resource_account_signer,
      State {
        signer_cap: signer_cap,
        current_game: option::none()
      }
    );
  }

  /**
  * Starts a new game of crash. This is to be called by the server via the admin account. The server
  * will generate a house secret and salt, hash them, and pass the hashes to this function as proof 
  * that the server generates the house secret and salt fairly and before the ranomness is revealed.
  * @param admin - the signer of the admin account
  * @param start_time_ms - the time in milliseconds when the game will start
  * @param house_secret_hash - the hash of the house secret
  * @param salt_hash - the hash of the salt
  */
  entry fun start_game(
    admin: &signer, 
    house_secret_hash: vector<u8>, 
    salt_hash: vector<u8>
  ) acquires State {
    // assume this is the admin account
    let state = borrow_global_mut<State>(get_resource_address());

    assert!(
      option::is_none(&state.current_game),
      1
    );

    let new_randomness = randomness::u64_integer();

    print(&house_secret_hash);

    let new_game = Game {
      start_time_ms: timestamp::now_microseconds() + COUNTDOWN_MS, 
      house_secret_hash,
      salt_hash,
      bets: simple_map::new(),
      randomness: new_randomness,
      // crash_point_ms: option::none()
    };
    option::fill(&mut state.current_game, new_game);
  }

  public entry fun hackathon_remove_game() acquires State {
    let state = borrow_global_mut<State>(get_resource_address());
    let game = option::extract(&mut state.current_game);
    let Game {
      start_time_ms: _,
      house_secret_hash: _,
      salt_hash: _,
      randomness: _,
      bets: game_bets,
      // crash_point_ms: _
    } = game;

    let (betters, bets) = simple_map::to_vec_pair(game_bets);

    let number_of_bets = vector::length(&betters);
    let cleared_betters = 0;

    while (cleared_betters < number_of_bets) {
      let better = vector::pop_back(&mut betters);
      let bet = vector::pop_back(&mut bets);
      let Bet {
        player: _,
        bet_amount: _,
        cash_out: _
      } = bet;
      cleared_betters = cleared_betters + 1;
    };

    vector::destroy_empty(betters);
    vector::destroy_empty(bets);
  }

  /**
  * Places a bet in the current game of crash. To be used by players via the client.
  * @param player - the signer of the player
  * @param bet_amount - the amount of the bet
  */
  public entry fun place_bet(
    player: &signer,
    bet_amount: u64
  ) acquires State {
    let state = borrow_global_mut<State>(get_resource_address());

    assert!(option::is_some(&state.current_game), 1);

    let game_mut_ref = option::borrow_mut(&mut state.current_game);
    assert!(timestamp::now_microseconds() > game_mut_ref.start_time_ms, 2);

    let new_bet = Bet {
      player: signer::address_of(player),
      bet_amount,
      cash_out: option::none()
    };
    simple_map::add(&mut game_mut_ref.bets, signer::address_of(player), new_bet);
    
    let bet_coin = coin::withdraw(player, bet_amount);
    liquidity_pool::put_reserve_coins(bet_coin);
  }


  /**
  * Allows a player to cash out their bet in the current game of crash. To be used by players via the client.
  * @param player - the signer of the player
  */
  public entry fun cash_out(
    player: &signer,
    cash_out: u64
  ) acquires State {
    let state = borrow_global_mut<State>(get_resource_address());
    assert!(option::is_some(&state.current_game), 1);

    let game_mut_ref = option::borrow_mut(&mut state.current_game);
    assert!(timestamp::now_microseconds() > game_mut_ref.start_time_ms, 2);

    let bet = simple_map::borrow_mut(&mut game_mut_ref.bets, &signer::address_of(player));
    assert!(option::is_none(&bet.cash_out), 3);
  
    bet.cash_out = option::some(cash_out);
  }


  fun calculate_cash_out_point_from_time_elapsed(
    start_time_ms: u64, 
    current_time_ms: u64
  ): u64 {
    let difference = current_time_ms - start_time_ms;

    if (difference == 0) {
      return 0
    };

    let seconds_elapsed = difference / 1000;
    let i = 1;
    let current_cash_out = 106000000;
    while (i < seconds_elapsed) {
      current_cash_out = current_cash_out * 106000000 / 1_0000_0000;
      i = i + 1;
    };

    current_cash_out
  }

  public entry fun reveal_crashpoint_and_distribute_winnings(
    salted_house_secret: vector<u8>, 
    salt: vector<u8>
  ) acquires State {
    let state = borrow_global_mut<State>(get_resource_address());
    assert!(option::is_some(&state.current_game), 1);

    let game_mut_ref = option::borrow_mut(&mut state.current_game);
    assert!(timestamp::now_microseconds() > game_mut_ref.start_time_ms, 2);

    assert!(
      verify_hashes(
        salted_house_secret, 
        salt, 
        &game_mut_ref.house_secret_hash, 
        &game_mut_ref.salt_hash
      ), 
      3
    );

    let game = option::extract(&mut state.current_game);
    let Game {
      start_time_ms: _,
      house_secret_hash: _,
      salt_hash: _,
      randomness,
      bets: game_bets,
      // crash_point_ms: _
    } = game;
    let (betters, bets) = simple_map::to_vec_pair(game_bets);

    let number_of_bets = vector::length(&betters);
    let cleared_betters = 0;

    let crash_point = calculate_crash_point_with_randomness(randomness, string_utils::to_string(&salted_house_secret));

    while (cleared_betters < number_of_bets) {
      let better = vector::pop_back(&mut betters);
      let bet = vector::pop_back(&mut bets);

      let winnings = determine_win(bet, crash_point);

      if (winnings > 0) {
        let winnings_coin = liquidity_pool::extract_reserve_coins(winnings);
        coin::deposit(better, winnings_coin);
      };

      cleared_betters = cleared_betters + 1;
    };

    vector::destroy_empty(betters);
    vector::destroy_empty(bets);
  }

  fun calculate_crash_point_with_randomness(
    randomness: u64, 
    house_secret: String
  ): u64 {
    let randomness_string = string_utils::to_string(&randomness);
    // print(&randomness_string);
    // print(&house_secret);
    string::append(&mut randomness_string, house_secret);
    // print(&randomness_string);


    let hash = hash::sha3_256(*string::bytes(&randomness_string));

    // print(&hash);
    // print(&parse_hex(hash, false));
    // print(&(parse_hex(hash, false) % 33));
    if (parse_hex(hash, false) % 33 == 0) {
      0
    } else {
      vector::trim(&mut hash, 7);
      let value = parse_hex(hash, true);
      // print(&value);
      let e = pow(2, 52);
      // print(&e);
      (((100 * e - value) / (e - value)) as u64)
    }
  }

  fun parse_hex(hex: vector<u8>, ignore_first: bool): u256 {

    // print(&hex);

    let exponent = 0;
    let sum = 0;

    while (vector::length(&hex) > 0) {
      if (ignore_first && exponent == 0) {
        let byte = (vector::pop_back(&mut hex) as u256);
        sum = sum + (byte / 16) * pow(16, exponent);
        exponent = exponent + 1;
        continue;
      };
      let byte = (vector::pop_back(&mut hex) as u256);
      sum = sum + (byte % 16) * pow(16, exponent) + (byte / 16) * pow(16, exponent + 1);
      exponent = exponent + 2;
    };

    // print(&sum);

    sum
  }

  public fun pow(n: u256, e: u256): u256 {
    if (e == 0) {
        1
    } else {
        let p = 1;
        while (e > 1) {
            if (e % 2 == 1) {
                p = p * n;
            };
            e = e / 2;
            n = n * n;
        };
        p * n
    }
}

  /* 
    Create and return the address of the module's resource account
    @return - address of the module's resource account
  */ 
  inline fun get_resource_address(): address {
    account::create_resource_address(&@zion, SEED)
  }

  inline fun verify_hashes(
    house_secret: vector<u8>, 
    salt: vector<u8>, 
    house_secret_hash: &vector<u8>,
    salt_hash: &vector<u8>
  ): bool {

    let actual_house_secret_hash = hash::sha3_256(house_secret);
    let actual_salt_hash = hash::sha3_256(salt);

    &actual_house_secret_hash == house_secret_hash && &actual_salt_hash == salt_hash
  }

  inline fun determine_win(
    bet: Bet, 
    crash_point: u64
  ): u64 {
    let Bet {
      player: _,
      bet_amount,
      cash_out: player_cash_out_option
    } = bet;

    if (option::is_none(&player_cash_out_option)) {
      0
    } else {
      let player_cash_out = option::extract(&mut player_cash_out_option);
      if (player_cash_out < crash_point) {
        let winnings = bet_amount * player_cash_out / 100; 
        winnings
      } else {
        0
      }
    }
  }

  #[test]
  fun test_calculate_crash_point_with_randomness() {
    let house_secret = string::utf8(b"test");

    let index = 0;
    while (index < 100) {
      let randomness = index;
      let crash_point = calculate_crash_point_with_randomness(randomness, house_secret);
      // print(&randomness);
      // print(&house_secret);
      // print(&crash_point);
      index = index + 1;
    };
  }

  #[test]
  fun test_calculate_cash_out_point_from_time_elapsed() {
    let i = 0;

    while (i < 100) {
      // print(&i);
      let start_time_ms = 1000;
      let current_time_ms = 1000 * (i + 1);
      let cash_out = calculate_cash_out_point_from_time_elapsed(start_time_ms, current_time_ms);
      // print(&cash_out);
      i = i + 1;
    }
  }

  #[test(user = @0xA)]
  fun test_verify_hashes(
    user: &signer
  ) {
    let house_secret = string::utf8(b"house_secret");
    let salt = string::utf8(b"salt");
    let salted_house_secret = string::utf8(b"house_secretsalt");

    let salted_house_secret_hash = hash::sha3_256(*string::bytes(&salted_house_secret));
    let salt_hash = hash::sha3_256(*string::bytes(&salt));

    print(&salted_house_secret_hash);

    // start_game(
    //   user, 
    //   b"ddb5f6080d454e8696d3362d4669f2216642c678b95c17afdfcbfdde1b58ad6d", 
    //   b"ddb5f6080d454e8696d3362d4669f2216642c678b95c17afdfcbfdde1b58ad6d"
    // );

    // let result = verify_hashes(house_secret, salt, &salted_house_secret_hash, &salt_hash);
    // assert!(result, 1);
  }
}

module zion::liquidity_pool {

  use std::type_info;
  use std::signer;
  use aptos_framework::event;
  use aptos_framework::option;
  use aptos_framework::math128;
  use aptos_framework::account;
  use aptos_framework::timestamp;
  use std::string::{Self, String};
  use aptos_framework::string_utils;
  use aptos_framework::resource_account;
  use aptos_framework::coin::{Self, Coin};
  use aptos_std::comparator::{Self, Result};
  use aptos_framework::aptos_coin::{Self, AptosCoin};

  friend zion::crash;

  const LP_COIN_DECIMALS: u8 = 8;
  const SEED: vector<u8> = b"zion-liquidity-pool";

  struct LPCoin {}

  struct LiquidityPool has key {
    reserve_coin: Coin<AptosCoin>,
    locked_liquidity: Coin<LPCoin>,
    // mint cap of the specific pool's LP token
    lp_coin_mint_cap: coin::MintCapability<LPCoin>,
    // burn cap of the specific pool's LP token
    lp_coin_burn_cap: coin::BurnCapability<LPCoin>
  }

  struct State has key {
    // signer cap of the module's resource account
    signer_cap: account::SignerCapability
  }

  fun init_module(admin: &signer) {
    let (resource_account_signer, signer_cap) = account::create_resource_account(admin, SEED);

    let (lp_coin_burn_cap, lp_coin_freeze_cap, lp_coin_mint_cap) = 
      coin::initialize<LPCoin>(
        admin, 
        string::utf8(b"Zion bets LP coin"),
        string::utf8(b"ZBET"),
        LP_COIN_DECIMALS,
        true
      );
    coin::destroy_freeze_cap(lp_coin_freeze_cap);

    move_to(
      &resource_account_signer,
      LiquidityPool {
        reserve_coin: coin::zero<AptosCoin>(),
        locked_liquidity: coin::zero<LPCoin>(),
        lp_coin_mint_cap,
        lp_coin_burn_cap
      }
    );

    move_to<State>(
      &resource_account_signer,
      State {
        signer_cap: signer_cap
      }
    );
  }

  public entry fun supply_liquidity(
    supplier: &signer,
    supply_amount: u64,
  ) acquires LiquidityPool {
    let liquidity_pool = borrow_global_mut<LiquidityPool>(get_resource_address());

    let reserve_amount = coin::value(&liquidity_pool.reserve_coin);
    let lp_coin_supply = *option::borrow(&coin::supply<LPCoin>());

    let amount_lp_coins_to_mint = if (lp_coin_supply == 0) {
      supply_amount
    } else {
      (math128::mul_div((supply_amount as u128), lp_coin_supply, (reserve_amount as u128)) as u64)
    };

    let supplied_coin = coin::withdraw(supplier, supply_amount);
    coin::merge(&mut liquidity_pool.reserve_coin, supplied_coin);

    let lp_coin = coin::mint(amount_lp_coins_to_mint, &liquidity_pool.lp_coin_mint_cap);
    coin::register<LPCoin>(supplier);
    coin::deposit(signer::address_of(supplier), lp_coin);
  }

  public entry fun remove_liquidity(
    supplier: &signer, 
    lp_coin_amount: u64
  ) acquires LiquidityPool {
    let liquidity_pool = borrow_global_mut<LiquidityPool>(get_resource_address());


    let reserve_amount = coin::value(&liquidity_pool.reserve_coin);
    let lp_coin_supply = *option::borrow(&coin::supply<LPCoin>());

    let amount_reserve_to_remove = (math128::mul_div((lp_coin_amount as u128), (reserve_amount as u128), lp_coin_supply) as u64);
    let remove_reserve_coin = coin::extract(&mut liquidity_pool.reserve_coin, amount_reserve_to_remove);
    coin::deposit(signer::address_of(supplier), remove_reserve_coin);

    let lp_coin_to_remove = coin::withdraw(supplier, lp_coin_amount);
    coin::burn(lp_coin_to_remove, &liquidity_pool.lp_coin_burn_cap);
  }

  public entry fun lock_lp_coins(
    owner: &signer, 
    lp_coin_amount: u64
  ) acquires LiquidityPool {
    let liquidity_pool = borrow_global_mut<LiquidityPool>(get_resource_address());  
    let lp_coin_to_lock = coin::withdraw(owner, lp_coin_amount);
    coin::merge(&mut liquidity_pool.locked_liquidity, lp_coin_to_lock);
  } 

  public(friend) fun extract_reserve_coins(
    amount: u64
  ): Coin<AptosCoin> acquires LiquidityPool {
    let liquidity_pool = borrow_global_mut<LiquidityPool>(get_resource_address());
    coin::extract(&mut liquidity_pool.reserve_coin, amount)
  }

  public(friend) fun put_reserve_coins(
    coin: Coin<AptosCoin>
  ) acquires LiquidityPool {
    let liquidity_pool = borrow_global_mut<LiquidityPool>(get_resource_address());
    coin::merge(&mut liquidity_pool.reserve_coin, coin);
  }

  /* 
    Create and return the address of the module's resource account
    @return - address of the module's resource account
  */ 
  inline fun get_resource_address(): address {
    account::create_resource_address(&@zion, SEED)
  }

  #[test(admin = @zion, user = @0xA)]
  fun test_init_module_success_resources_created(
      admin: &signer, 
  ) acquires State, LiquidityPool {
    let admin_address = signer::address_of(admin);
    account::create_account_for_test(admin_address);
    
    init_module(admin);

    let resource_account_address = get_resource_address();

    let state = borrow_global<State>(resource_account_address);
    assert!(
      account::get_signer_capability_address(&state.signer_cap) == 
        resource_account_address, 
      0
    );

    let liquidity_pool = borrow_global<LiquidityPool>(resource_account_address);
    assert!(
      coin::value(&liquidity_pool.reserve_coin) == 0, 
      1
    );
  }

  #[test(admin = @zion, user = @0xA)]
  fun test_supply_liquidity_success_initial_liquidity(
    admin: &signer, 
    user: &signer
  ) acquires LiquidityPool {
    let admin_address = signer::address_of(admin);
    account::create_account_for_test(admin_address);

    let user_address = signer::address_of(user);
    account::create_account_for_test(user_address);

    let aptos_framework = account::create_account_for_test(@aptos_framework);
    let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
    coin::register<AptosCoin>(admin);
    coin::register<AptosCoin>(user);

    init_module(admin);

    let supply_amount = 1_0000_0000;
    coin::deposit(user_address, coin::mint(supply_amount, &mint_cap));
    supply_liquidity(user, supply_amount);

    let resource_account_address = get_resource_address();
    let liquidity_pool = borrow_global<LiquidityPool>(resource_account_address);
    assert!(
      coin::value(&liquidity_pool.reserve_coin) == supply_amount, 
      0
    );

    let lp_coin_supply = *option::borrow(&coin::supply<LPCoin>());
    assert!(
      lp_coin_supply == (supply_amount as u128), 
      1
    );

    coin::destroy_burn_cap(burn_cap);
    coin::destroy_mint_cap(mint_cap);
  }

  #[test(admin = @zion, user = @0xA)]
  fun test_supply_liquidity_success_additional_liquidity_100_percent(
    admin: &signer, 
    user: &signer
  ) acquires LiquidityPool {
    let admin_address = signer::address_of(admin);
    account::create_account_for_test(admin_address);

    let user_address = signer::address_of(user);
    account::create_account_for_test(user_address);

    let aptos_framework = account::create_account_for_test(@aptos_framework);
    let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
    coin::register<AptosCoin>(admin);
    coin::register<AptosCoin>(user);

    init_module(admin);

    let supply_amount = 1_0000_0000;
    coin::deposit(admin_address, coin::mint(supply_amount, &mint_cap));
    supply_liquidity(admin, supply_amount);

    let additional_supply_amount = 1_0000_0000;
    coin::deposit(user_address, coin::mint(additional_supply_amount, &mint_cap));
    supply_liquidity(user, additional_supply_amount);

    let resource_account_address = get_resource_address();
    let liquidity_pool = borrow_global<LiquidityPool>(resource_account_address);
    assert!(
      coin::value(&liquidity_pool.reserve_coin) == (supply_amount + additional_supply_amount), 
      0
    );

    let lp_coin_supply = *option::borrow(&coin::supply<LPCoin>());
    assert!(
      lp_coin_supply == ((supply_amount + additional_supply_amount) as u128), 
      1
    );

    coin::destroy_burn_cap(burn_cap);
    coin::destroy_mint_cap(mint_cap);
  }

  #[test(admin = @zion, user = @0xA)]
  fun test_supply_liquidity_success_additional_liquidity_50_percent(
    admin: &signer, 
    user: &signer
  ) acquires LiquidityPool {
    let admin_address = signer::address_of(admin);
    account::create_account_for_test(admin_address);

    let user_address = signer::address_of(user);
    account::create_account_for_test(user_address);

    let aptos_framework = account::create_account_for_test(@aptos_framework);
    let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
    coin::register<AptosCoin>(admin);
    coin::register<AptosCoin>(user);

    init_module(admin);

    let supply_amount = 1_0000_0000;
    coin::deposit(user_address, coin::mint(supply_amount, &mint_cap));
    supply_liquidity(user, supply_amount);

    let additional_supply_amount = 5000_0000;
    coin::deposit(user_address, coin::mint(additional_supply_amount, &mint_cap));
    supply_liquidity(user, additional_supply_amount);

    let resource_account_address = get_resource_address();
    let liquidity_pool = borrow_global<LiquidityPool>(resource_account_address);
    assert!(
      coin::value(&liquidity_pool.reserve_coin) == (supply_amount + additional_supply_amount), 
      0
    );

    let lp_coin_supply = *option::borrow(&coin::supply<LPCoin>());
    assert!(
      lp_coin_supply == ((supply_amount + additional_supply_amount) as u128), 
      1
    );

    coin::destroy_burn_cap(burn_cap);
    coin::destroy_mint_cap(mint_cap);
  }

  #[test(admin = @zion, user = @0xA)]
  fun test_remove_liquidity_success_remove_50_percent(
    admin: &signer, 
    user: &signer
  ) acquires LiquidityPool {
    let admin_address = signer::address_of(admin);
    account::create_account_for_test(admin_address);

    let user_address = signer::address_of(user);
    account::create_account_for_test(user_address);

    let aptos_framework = account::create_account_for_test(@aptos_framework);
    let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
    coin::register<AptosCoin>(admin);
    coin::register<AptosCoin>(user);

    init_module(admin);

    let supply_amount = 1_0000_0000;
    coin::deposit(user_address, coin::mint(supply_amount, &mint_cap));
    supply_liquidity(user, supply_amount);

    let additional_supply_amount = 5000_0000;
    coin::deposit(user_address, coin::mint(additional_supply_amount, &mint_cap));
    supply_liquidity(user, additional_supply_amount);

    let lp_coin_supply = *option::borrow(&coin::supply<LPCoin>());
    let lp_coin_amount_to_remove = ((lp_coin_supply / 2) as u64);
    remove_liquidity(user, lp_coin_amount_to_remove);

    let resource_account_address = get_resource_address();
    let liquidity_pool = borrow_global<LiquidityPool>(resource_account_address);
    assert!(
      coin::value(&liquidity_pool.reserve_coin) == (supply_amount + additional_supply_amount) / 2, 
      0
    );

    let lp_coin_supply_after_removal = *option::borrow(&coin::supply<LPCoin>());
    assert!(
      lp_coin_supply_after_removal == lp_coin_supply / 2, 
      1
    );

    coin::destroy_burn_cap(burn_cap);
    coin::destroy_mint_cap(mint_cap);
  }

  #[test(admin = @zion, user = @0xA)]
  fun test_lock_lp_coins_success(
    admin: &signer, 
    user: &signer
  ) acquires LiquidityPool {
    let admin_address = signer::address_of(admin);
    account::create_account_for_test(admin_address);

    let user_address = signer::address_of(user);
    account::create_account_for_test(user_address);

    let aptos_framework = account::create_account_for_test(@aptos_framework);
    let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
    coin::register<AptosCoin>(admin);
    coin::register<AptosCoin>(user);

    init_module(admin);

    let supply_amount = 1_0000_0000;
    coin::deposit(user_address, coin::mint(supply_amount, &mint_cap));
    supply_liquidity(user, supply_amount);

    let lp_coin_supply = *option::borrow(&coin::supply<LPCoin>());
    lock_lp_coins(user, (lp_coin_supply as u64));

    let resource_account_address = get_resource_address();
    let liquidity_pool = borrow_global<LiquidityPool>(resource_account_address);
    assert!(
      coin::value(&liquidity_pool.reserve_coin) == supply_amount, 
      0
    );

    let lp_coin_supply_after_burn = *option::borrow(&coin::supply<LPCoin>());
    assert!(
      (lp_coin_supply_after_burn as u64) == supply_amount, 
      1
    );

    assert!(
      coin::value(&liquidity_pool.locked_liquidity) == (lp_coin_supply as u64), 
      2
    );

    coin::destroy_burn_cap(burn_cap);
    coin::destroy_mint_cap(mint_cap);
  }

  #[test(admin = @zion, user = @0xA)]
  fun test_extract_reserve_coins_success(
    admin: &signer, 
    user: &signer
  ) acquires LiquidityPool {
    let admin_address = signer::address_of(admin);
    account::create_account_for_test(admin_address);

    let user_address = signer::address_of(user);
    account::create_account_for_test(user_address);

    let aptos_framework = account::create_account_for_test(@aptos_framework);
    let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
    coin::register<AptosCoin>(admin);
    coin::register<AptosCoin>(user);

    init_module(admin);

    let supply_amount = 1_0000_0000;
    coin::deposit(user_address, coin::mint(supply_amount, &mint_cap));
    supply_liquidity(user, supply_amount);

    let resource_account_address = get_resource_address();
    let reserve_coin = extract_reserve_coins(supply_amount);
    let liquidity_pool = borrow_global<LiquidityPool>(resource_account_address);

    assert!(
      coin::value(&liquidity_pool.reserve_coin) == 0, 
      0
    );

    assert!(
      coin::value(&reserve_coin) == supply_amount, 
      1
    );

    coin::burn(reserve_coin, &burn_cap);

    coin::destroy_burn_cap(burn_cap);
    coin::destroy_mint_cap(mint_cap);
  }

  #[test(admin = @zion, user = @0xA)]
  fun test_put_reserve_coins_success(
    admin: &signer, 
    user: &signer
  ) acquires LiquidityPool {
    let admin_address = signer::address_of(admin);
    account::create_account_for_test(admin_address);

    let user_address = signer::address_of(user);
    account::create_account_for_test(user_address);

    let aptos_framework = account::create_account_for_test(@aptos_framework);
    let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
    coin::register<AptosCoin>(admin);
    coin::register<AptosCoin>(user);

    init_module(admin);

    let supply_amount = 1_0000_0000;
    coin::deposit(user_address, coin::mint(supply_amount, &mint_cap));
    supply_liquidity(user, supply_amount);

    let new_reserve_coin = coin::mint(supply_amount, &mint_cap);
    put_reserve_coins(new_reserve_coin);

    let resource_account_address = get_resource_address();
    let liquidity_pool = borrow_global<LiquidityPool>(resource_account_address);
    assert!(
      coin::value(&liquidity_pool.reserve_coin) == supply_amount * 2, 
      0
    );

    assert!(
      option::borrow(&coin::supply<LPCoin>()) == &(supply_amount as u128),
      1
    );

    coin::destroy_burn_cap(burn_cap);
    coin::destroy_mint_cap(mint_cap);
  }

}