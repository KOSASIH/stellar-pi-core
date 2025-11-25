#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Env, Symbol, Map, Address, Val, log, panic_with_error};
use soroban_sdk::xdr::ScError;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    LockedValues(Symbol),  // Locked value for each Pi Coin
    RejectedCoins(Symbol),
    ValidSources,
}

#[contract]
pub struct ValueLockContract;

#[contractimpl]
impl ValueLockContract {
    // Hyper-tech constants
    const STABLE_VALUE: i128 = 314159;  // 1 PI = $314,159 (in stroops)

    pub fn init(env: Env) {
        // Initialize valid sources
        let mut valid_sources = Map::new(&env);
        valid_sources.set(Symbol::from_str(&env, "mining"), true);
        valid_sources.set(Symbol::from_str(&env, "rewards"), true);
        valid_sources.set(Symbol::from_str(&env, "p2p"), true);
        env.storage().set(&DataKey::ValidSources, &valid_sources);
    }

    pub fn lock_value(env: Env, pi_coin_id: Symbol, source: Symbol) {
        Self::check_valid_source(&env, &source);
        if Self::is_rejected(&env, pi_coin_id.clone()) {
            log!(&env, "Rejected Pi Coin lock: {} due to exchange/third-party", pi_coin_id);
            panic_with_error!(&env, ScError::InvalidAction);
        }
        // Lock value at stable amount
        env.storage().set(&DataKey::LockedValues(pi_coin_id.clone()), &Self::STABLE_VALUE);
        log!(&env, "Locked Pi Coin {} at stable value {}", pi_coin_id, Self::STABLE_VALUE);
    }

    pub fn get_locked_value(env: Env, pi_coin_id: Symbol) -> i128 {
        env.storage().get(&DataKey::LockedValues(pi_coin_id)).unwrap_or(0)
    }

    pub fn mark_rejected(env: Env, pi_coin_id: Symbol) {
        // Integrate with coin_validation_engine.py for AI checks
        env.storage().set(&DataKey::RejectedCoins(pi_coin_id.clone()), &true);
        log!(&env, "Marked Pi Coin {} as rejected", pi_coin_id);
    }

    pub fn is_rejected(env: &Env, pi_coin_id: Symbol) -> bool {
        // Quantum-inspired hash check
        let hash = env.crypto().sha256(env, &Val::from_symbol(env, &pi_coin_id));
        env.storage().get(&DataKey::RejectedCoins(Symbol::from_val(env, &hash))).unwrap_or(false) ||
        env.storage().get(&DataKey::RejectedCoins(pi_coin_id)).unwrap_or(false)
    }

    pub fn transfer_locked(env: Env, from_coin: Symbol, to_coin: Symbol, source: Symbol) {
        Self::check_valid_source(&env, &source);
        if Self::is_rejected(&env, from_coin.clone()) || Self::is_rejected(&env, to_coin.clone()) {
            panic_with_error!(&env, ScError::InvalidAction);
        }
        let value = Self::get_locked_value(env.clone(), from_coin.clone());
        if value != Self::STABLE_VALUE {
            panic_with_error!(&env, ScError::InvalidAction);
        }
        // Transfer lock
        env.storage().set(&DataKey::LockedValues(to_coin.clone()), &value);
        env.storage().set(&DataKey::LockedValues(from_coin), &0);  // Clear from
        log!(&env, "Transferred locked value from {} to {}", from_coin, to_coin);
    }

    pub fn unlock_for_governance(env: Env, pi_coin_id: Symbol) {
        // Only for DAO governance (integrate with governance_dao.py)
        // Placeholder: In real impl, check DAO approval
        env.storage().set(&DataKey::LockedValues(pi_coin_id.clone()), &0);
        log!(&env, "Unlocked Pi Coin {} for governance", pi_coin_id);
    }

    // Helper: Quantum verify for locking
    pub fn quantum_lock_verify(env: Env, data: Val) -> Val {
        env.crypto().sha256(&env, &data)
    }

    fn check_valid_source(env: &Env, source: &Symbol) {
        let valid_sources: Map<Symbol, bool> = env.storage().get(&DataKey::ValidSources).unwrap();
        if !valid_sources.get(source).unwrap_or(false) {
            panic_with_error!(env, ScError::InvalidAction);
        }
    }
}
