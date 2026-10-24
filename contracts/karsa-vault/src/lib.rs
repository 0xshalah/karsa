#![no_std]

use soroban_sdk::{contract, contractimpl, panic_with_error, Address, Env, MuxedAddress, String};
use stellar_contract_utils::math::{i128_fixed_point::mul_div_with_rounding, Rounding};
use stellar_tokens::{
    fungible::{Base, FungibleToken},
    vault::{
        emit_deposit, emit_withdraw, FungibleVault, Vault, VaultTokenError,
    },
};

#[cfg(test)]
mod test;

/// Virtual reserve of underlying assets (1,000,000,000 stroops = 100 XLM)
/// used to anchor vault liquidity and prevent donation/inflation attacks on empty vaults.
pub const VIRTUAL_ASSETS: i128 = 1_000_000_000;

#[contract]
pub struct KarsaVault;

impl KarsaVault {
    /// Computes the virtual geometry (v_assets, v_shares) based on decimals_offset.
    /// For decimals_offset = 3:
    ///   v_assets = 1,000,000,000
    ///   v_shares = 1,000,000,000 * 10^3 = 1,000,000,000,000 (10^12)
    pub fn virtual_geometry(e: &Env) -> (i128, i128) {
        let offset = Vault::get_decimals_offset(e);
        let scale = 10_i128
            .checked_pow(offset)
            .unwrap_or_else(|| panic_with_error!(e, VaultTokenError::MathOverflow));
        let v_shares = VIRTUAL_ASSETS
            .checked_mul(scale)
            .unwrap_or_else(|| panic_with_error!(e, VaultTokenError::MathOverflow));
        (VIRTUAL_ASSETS, v_shares)
    }

    /// Internal conversion from assets to shares with rounding direction.
    /// Formula: assets * (total_supply + v_shares) / (total_assets + v_assets)
    pub fn convert_to_shares_with_rounding(e: &Env, assets: i128, rounding: Rounding) -> i128 {
        if assets < 0 {
            panic_with_error!(e, VaultTokenError::VaultInvalidAssetsAmount);
        }
        if assets == 0 {
            return 0;
        }
        let (v_assets, v_shares) = Self::virtual_geometry(e);
        let effective_supply = Base::total_supply(e)
            .checked_add(v_shares)
            .unwrap_or_else(|| panic_with_error!(e, VaultTokenError::MathOverflow));
        let effective_assets = Vault::total_assets(e)
            .checked_add(v_assets)
            .unwrap_or_else(|| panic_with_error!(e, VaultTokenError::MathOverflow));

        mul_div_with_rounding(e, assets, effective_supply, effective_assets, rounding)
    }

    /// Internal conversion from shares to assets with rounding direction.
    /// Formula: shares * (total_assets + v_assets) / (total_supply + v_shares)
    pub fn convert_to_assets_with_rounding(e: &Env, shares: i128, rounding: Rounding) -> i128 {
        if shares < 0 {
            panic_with_error!(e, VaultTokenError::VaultInvalidSharesAmount);
        }
        if shares == 0 {
            return 0;
        }
        let (v_assets, v_shares) = Self::virtual_geometry(e);
        let effective_assets = Vault::total_assets(e)
            .checked_add(v_assets)
            .unwrap_or_else(|| panic_with_error!(e, VaultTokenError::MathOverflow));
        let effective_supply = Base::total_supply(e)
            .checked_add(v_shares)
            .unwrap_or_else(|| panic_with_error!(e, VaultTokenError::MathOverflow));

        mul_div_with_rounding(e, shares, effective_assets, effective_supply, rounding)
    }
}

#[contractimpl]
impl KarsaVault {
    /// Initializer invoked once at deployment.
    pub fn __constructor(
        e: &Env,
        name: String,
        symbol: String,
        asset: Address,
        decimals_offset: u32,
    ) {
        Vault::set_asset(e, asset);
        Vault::set_decimals_offset(e, decimals_offset);
        Base::set_metadata(e, Self::decimals(e), name, symbol);
    }

    /// Convenience alias returning the underlying asset address.
    pub fn asset(e: &Env) -> Address {
        Vault::query_asset(e)
    }
}

#[contractimpl(contracttrait)]
impl FungibleToken for KarsaVault {
    type ContractType = Vault;

    fn decimals(e: &Env) -> u32 {
        Vault::decimals(e)
    }
}

#[contractimpl(contracttrait)]
impl FungibleVault for KarsaVault {
    fn query_asset(e: &Env) -> Address {
        Vault::query_asset(e)
    }

    fn total_assets(e: &Env) -> i128 {
        Vault::total_assets(e)
    }

    fn convert_to_shares(e: &Env, assets: i128) -> i128 {
        Self::convert_to_shares_with_rounding(e, assets, Rounding::Floor)
    }

    fn convert_to_assets(e: &Env, shares: i128) -> i128 {
        Self::convert_to_assets_with_rounding(e, shares, Rounding::Floor)
    }

    fn max_deposit(e: &Env, receiver: Address) -> i128 {
        Vault::max_deposit(e, receiver)
    }

    fn preview_deposit(e: &Env, assets: i128) -> i128 {
        Self::convert_to_shares_with_rounding(e, assets, Rounding::Floor)
    }

    fn deposit(e: &Env, assets: i128, receiver: Address, from: Address, operator: Address) -> i128 {
        operator.require_auth();

        let max_assets = Self::max_deposit(e, receiver.clone());
        if assets > max_assets {
            panic_with_error!(e, VaultTokenError::VaultExceededMaxDeposit);
        }

        let shares = Self::preview_deposit(e, assets);
        Vault::deposit_internal(e, &receiver, assets, shares, &from, &operator);
        emit_deposit(e, &operator, &from, &receiver, assets, shares);

        shares
    }

    fn max_mint(e: &Env, receiver: Address) -> i128 {
        Vault::max_mint(e, receiver)
    }

    fn preview_mint(e: &Env, shares: i128) -> i128 {
        Self::convert_to_assets_with_rounding(e, shares, Rounding::Ceil)
    }

    fn mint(e: &Env, shares: i128, receiver: Address, from: Address, operator: Address) -> i128 {
        operator.require_auth();

        let max_shares = Self::max_mint(e, receiver.clone());
        if shares > max_shares {
            panic_with_error!(e, VaultTokenError::VaultExceededMaxMint);
        }

        let assets = Self::preview_mint(e, shares);
        Vault::deposit_internal(e, &receiver, assets, shares, &from, &operator);
        emit_deposit(e, &operator, &from, &receiver, assets, shares);

        assets
    }

    fn max_withdraw(e: &Env, owner: Address) -> i128 {
        Self::convert_to_assets_with_rounding(e, Base::balance(e, &owner), Rounding::Floor)
    }

    fn preview_withdraw(e: &Env, assets: i128) -> i128 {
        Self::convert_to_shares_with_rounding(e, assets, Rounding::Ceil)
    }

    fn withdraw(e: &Env, assets: i128, receiver: Address, owner: Address, operator: Address) -> i128 {
        operator.require_auth();

        let max_assets = Self::max_withdraw(e, owner.clone());
        if assets > max_assets {
            panic_with_error!(e, VaultTokenError::VaultExceededMaxWithdraw);
        }

        let shares = Self::preview_withdraw(e, assets);
        Vault::withdraw_internal(e, &receiver, &owner, assets, shares, &operator);
        emit_withdraw(e, &operator, &receiver, &owner, assets, shares);

        shares
    }

    fn max_redeem(e: &Env, owner: Address) -> i128 {
        Vault::max_redeem(e, owner)
    }

    fn preview_redeem(e: &Env, shares: i128) -> i128 {
        Self::convert_to_assets_with_rounding(e, shares, Rounding::Floor)
    }

    fn redeem(e: &Env, shares: i128, receiver: Address, owner: Address, operator: Address) -> i128 {
        operator.require_auth();

        let max_shares = Self::max_redeem(e, owner.clone());
        if shares > max_shares {
            panic_with_error!(e, VaultTokenError::VaultExceededMaxRedeem);
        }

        let assets = Self::preview_redeem(e, shares);
        Vault::withdraw_internal(e, &receiver, &owner, assets, shares, &operator);
        emit_withdraw(e, &operator, &receiver, &owner, assets, shares);

        assets
    }
}
