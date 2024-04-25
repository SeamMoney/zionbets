module zion::z_apt {
  
  use std::signer;
  use std::string::utf8;
  use aptos_framework::object;
  use aptos_framework::option;
  use aptos_framework::account;
  use aptos_framework::string_utils;
  use aptos_framework::object::Object;
  use aptos_framework::resource_account;
  use aptos_framework::primary_fungible_store;
  use aptos_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata, FungibleStore, FungibleAsset};

  const SEED: vector<u8> = b"zion-apt";
  const COIN_DECIMALS: u8 = 8;
  const ASSET_SYMBOL: vector<u8> = b"zAPT";
  const ASSET_NAME: vector<u8> = b"Zion Bets Game Coin";
  const ASSET_URI: vector<u8> = b"https://zion.bet";
  const PROJECT_URI: vector<u8> = b"https://zion.bet";

  // struct AdminCap has key {}

  struct State has key {
    signer_cap: account::SignerCapability,
    mint_ref: MintRef, 
    transfer_ref: TransferRef,
    burn_ref: BurnRef
  }

  fun init_module(admin: &signer) {

    let (resource_account_signer, signer_cap) = account::create_resource_account(admin, SEED);

    let constructor_ref = &object::create_named_object(&resource_account_signer, ASSET_SYMBOL);
    primary_fungible_store::create_primary_store_enabled_fungible_asset(
      constructor_ref,
      option::none(),
      utf8(ASSET_NAME),
      utf8(ASSET_SYMBOL),
      COIN_DECIMALS,
      utf8(ASSET_URI),
      utf8(PROJECT_URI)
    );

    let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
    let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
    let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
    move_to(
      &resource_account_signer,
      State {
        signer_cap,
        mint_ref: mint_ref,
        transfer_ref: transfer_ref,
        burn_ref: burn_ref
      }
    );
  }

  public entry fun mint(
    admin: &signer, 
    to: address,
    amount: u64
  ) acquires State {
    let mint_ref = &borrow_global_mut<State>(get_resource_address()).mint_ref;
    let metadata = get_metadata();
    let primary_store = primary_fungible_store::ensure_primary_store_exists(to, metadata);
    fungible_asset::mint_to(mint_ref, primary_store, amount);
  }

  public fun create_fungible_store(): Object<FungibleStore> acquires State {
    fungible_asset::create_store(
      &object::create_named_object(&get_resource_signer(), ASSET_SYMBOL),
      get_metadata()
    )
  }

  public fun transfer(
    admin: &signer, 
    from: address, 
    to: address, 
    amount: u64
  ) acquires State {
    let metadata = get_metadata();
    let sender_primary_store = primary_fungible_store::primary_store(from, metadata);
    let receiver_primary_store = primary_fungible_store::ensure_primary_store_exists(to, metadata);
    let transfer_ref = &borrow_global_mut<State>(get_resource_address()).transfer_ref;
    fungible_asset::transfer(transfer_ref, sender_primary_store, receiver_primary_store, amount);
  }

  public(friend) fun withdraw(
    
  )

  #[view]
  public fun get_metadata(): Object<Metadata> {
    let metadata_address = object::create_object_address(&get_resource_address(), ASSET_SYMBOL);
    object::address_to_object<Metadata>(metadata_address)
  }

  /* 
    Create and return the address of the module's resource account
    @return - address of the module's resource account
  */ 
  inline fun get_resource_address(): address {
    account::create_resource_address(&@zion, SEED)
  }

  inline fun get_resource_signer(): signer {
    let signer_cap = &borrow_global<State>(get_resource_address()).signer_cap;
    account::create_signer_with_capability(signer_cap)
  }
}