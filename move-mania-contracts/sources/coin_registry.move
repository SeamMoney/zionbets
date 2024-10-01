module zion::coin_registry {
    use std::signer;
    use std::vector;
    use aptos_framework::type_info::{Self, TypeInfo, type_of};

    const E_NOT_MODULE_OWNER: u64 = 1001;
    const E_COIN_ALREADY_ADDED: u64 = 1002;
    const E_COIN_NOT_FOUND: u64 = 1003;

    struct CoinRegistry has key {
        allowed_coins: vector<TypeInfo>
    }

    public entry fun init_registry(admin: &signer) {
        assert!(signer::address_of(admin) == @zion, E_NOT_MODULE_OWNER);

        move_to<CoinRegistry>(
            admin,
            CoinRegistry { allowed_coins: vector::empty() }
        );
    }

    public entry fun add_coin<CoinType>(admin: &signer) acquires CoinRegistry {
        assert!(signer::address_of(admin) == @zion, E_NOT_MODULE_OWNER);

        let registry = borrow_global_mut<CoinRegistry>(signer::address_of(admin));

        let coin_info = type_of<CoinType>();
        let index = vector::index_of<TypeInfo>(&registry.allowed_coins, &coin_info);
        assert!(option::is_none(&index), E_COIN_ALREADY_ADDED);

        vector::push_back(&mut registry.allowed_coins, coin_info);
    }

    public entry fun remove_coin<CoinType>(admin: &signer) acquires CoinRegistry {
        assert!(signer::address_of(admin) == @zion, E_NOT_MODULE_OWNER);

        let registry = borrow_global_mut<CoinRegistry>(signer::address_of(admin));

        let coin_info = type_of<CoinType>();
        let index = vector::index_of<TypeInfo>(&registry.allowed_coins, &coin_info);
        assert!(option::is_some(&index), E_COIN_NOT_FOUND);

        vector::remove(&mut registry.allowed_coins, option::extract(&index));
    }

    public fun is_allowed_coin(coin_info: &TypeInfo): bool acquires CoinRegistry {
        if (!exists<CoinRegistry>(@zion)) { false }
        else {
            let registry = borrow_global<CoinRegistry>(@zion);
            vector::contains<TypeInfo>(&registry.allowed_coins, coin_info)
        }
    }
}
