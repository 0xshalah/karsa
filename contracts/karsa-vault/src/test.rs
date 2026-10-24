#![cfg(test)]

extern crate std;

use soroban_sdk::{
    testutils::Address as _,
    token::{StellarAssetClient, TokenClient},
    Address, Env, MuxedAddress, String,
};

use crate::{KarsaVault, KarsaVaultClient};

const XLM: i128 = 10_000_000; // 1 XLM = 10^7 stroops
const OFFSET: u32 = 3;
const SHARE_DECIMALS: u32 = 10; // 7 + 3

fn setup<'a>(e: &'a Env) -> (Address, Address, KarsaVaultClient<'a>) {
    let admin = Address::generate(e);
    let sac = e.register_stellar_asset_contract_v2(admin);
    let asset = sac.address();
    let id = e.register(
        KarsaVault,
        (
            String::from_str(e, "Karsa Vault"),
            String::from_str(e, "KRS"),
            asset.clone(),
            OFFSET,
        ),
    );
    let client = KarsaVaultClient::new(e, &id);
    (id, asset, client)
}

fn mint_xlm(e: &Env, asset: &Address, to: &Address, amount: i128) {
    e.mock_all_auths();
    StellarAssetClient::new(e, asset).mint(to, &amount);
}

#[test]
fn test_constructor_metadata() {
    let e = Env::default();
    let (_id, asset, client) = setup(&e);

    assert_eq!(client.decimals(), SHARE_DECIMALS);
    assert_eq!(client.name(), String::from_str(&e, "Karsa Vault"));
    assert_eq!(client.symbol(), String::from_str(&e, "KRS"));
    assert_eq!(client.query_asset(), asset);
    assert_eq!(client.asset(), asset);
    assert_eq!(client.total_assets(), 0);
    assert_eq!(client.total_supply(), 0);
}

#[test]
fn test_conformance_flow() {
    let e = Env::default();
    let (_id, asset, client) = setup(&e);

    let user = Address::generate(&e);
    mint_xlm(&e, &asset, &user, 50 * XLM);

    // 1. Deposit 5_000_000 stroops (0.5 XLM)
    let deposit_amount = 5_000_000i128;
    let expected_deposit_shares = client.preview_deposit(&deposit_amount);
    let minted_shares = client.deposit(&deposit_amount, &user, &user, &user);
    assert_eq!(minted_shares, expected_deposit_shares);
    assert_eq!(client.total_assets(), deposit_amount);
    assert_eq!(client.balance(&user), minted_shares);

    // 2. Mint shares
    let mint_shares = 3_000_000_000i128;
    let expected_mint_assets = client.preview_mint(&mint_shares);
    let pulled_assets = client.mint(&mint_shares, &user, &user, &user);
    assert_eq!(pulled_assets, expected_mint_assets);
    assert_eq!(client.balance(&user), minted_shares + mint_shares);

    // 3. Withdraw 2_000_000 stroops
    let withdraw_amount = 2_000_000i128;
    let expected_burned_shares = client.preview_withdraw(&withdraw_amount);
    let burned_shares = client.withdraw(&withdraw_amount, &user, &user, &user);
    assert_eq!(burned_shares, expected_burned_shares);

    // 4. Redeem 1_000_000 shares
    let redeem_shares = 1_000_000i128;
    let expected_redeem_assets = client.preview_redeem(&redeem_shares);
    let received_assets = client.redeem(&redeem_shares, &user, &user, &user);
    assert_eq!(received_assets, expected_redeem_assets);

    // Verify conversions floor round-tripping
    let test_assets = 4_000_000i128;
    let converted_shares = client.convert_to_shares(&test_assets);
    let roundtrip_assets = client.convert_to_assets(&converted_shares);
    assert!(roundtrip_assets <= test_assets, "floor/floor roundtrip invariant");
}

#[test]
fn test_donation_attack_50m_mitigation() {
    let e = Env::default();
    let (id, asset, client) = setup(&e);

    let attacker = Address::generate(&e);
    let victim = Address::generate(&e);

    mint_xlm(&e, &asset, &attacker, 200 * XLM);
    mint_xlm(&e, &asset, &victim, 10 * XLM);

    // 1. Attacker deposits 1 stroop into fresh vault
    client.deposit(&1, &attacker, &attacker, &attacker);

    // 2. Attacker directly donates 50_000_000 stroops (5 XLM) directly to the vault
    TokenClient::new(&e, &asset).transfer(
        &attacker,
        &MuxedAddress::from(id.clone()),
        &50_000_000,
    );

    // 3. Expected shares if undisturbed: 5_000_000 * 10^3 = 5_000_000_000 shares
    let undisturbed_expected = 5_000_000_000i128;

    // 4. Victim deposits 5_000_000 stroops
    let victim_shares = client.deposit(&5_000_000, &victim, &victim, &victim);

    // In standard empty vaults (+1 stroop), victim receives only 99 shares (0.000002% -> FAIL).
    // With Karsa's Virtual Liquidity Anchor (10^9 stroops):
    // Formula: 5_000_000 * (1000 + 10^12) / (1 + 50_000_000 + 10^9) = 4_761_904_761 shares (~95.24%)
    std::println!(
        "50M donation test -> victim received: {victim_shares} shares ({:.2}% of undisturbed)",
        (victim_shares as f64 / undisturbed_expected as f64) * 100.0
    );
    assert!(
        victim_shares >= 4_760_000_000,
        "victim shares wiped out! received: {victim_shares}"
    );

    // Convert back to assets: confirm economic value preserved
    let victim_value = client.convert_to_assets(&victim_shares);
    assert!(
        victim_value >= 4_990_000,
        "economic value lost significantly: {victim_value}"
    );
}

#[test]
fn test_donation_attack_100m_mitigation() {
    // Direct donation of 100,000,000 stroops (10 XLM) against an empty vault
    let e = Env::default();
    let (id, asset, client) = setup(&e);

    let attacker = Address::generate(&e);
    let victim = Address::generate(&e);

    mint_xlm(&e, &asset, &attacker, 200 * XLM);
    mint_xlm(&e, &asset, &victim, 10 * XLM);

    client.deposit(&1, &attacker, &attacker, &attacker);

    // Direct donation of 100,000,000 stroops
    TokenClient::new(&e, &asset).transfer(
        &attacker,
        &MuxedAddress::from(id.clone()),
        &100_000_000,
    );

    let undisturbed_expected = 5_000_000_000i128;
    let victim_shares = client.deposit(&5_000_000, &victim, &victim, &victim);

    // 5_000_000 * (1000 + 10^12) / (1 + 100_000_000 + 10^9) = 4_545_454_545 (~90.91%)
    std::println!(
        "100M donation test -> victim received: {victim_shares} shares ({:.2}% of undisturbed)",
        (victim_shares as f64 / undisturbed_expected as f64) * 100.0
    );
    assert!(
        victim_shares >= 4_500_000_000,
        "victim shares dropped below 90%: {victim_shares}"
    );
    assert!(
        victim_shares > 99,
        "victim shares rounded to 99 like naive vault"
    );
}

#[test]
fn test_rounding_direction_safety() {
    let e = Env::default();
    let (id, asset, client) = setup(&e);

    let alice = Address::generate(&e);
    mint_xlm(&e, &asset, &alice, 10 * XLM);

    // Seed fractional ratio: deposit 1000 stroops + donate 500 stroops
    client.deposit(&1_000, &alice, &alice, &alice);
    TokenClient::new(&e, &asset).transfer(
        &alice,
        &MuxedAddress::from(id.clone()),
        &500,
    );

    // Test A: deposit(100) -> preview_deposit must round DOWN (floor, favors vault)
    let preview_dep = client.preview_deposit(&100);
    let minted = client.deposit(&100, &alice, &alice, &alice);
    assert_eq!(minted, preview_dep);

    // Test B: mint(100 shares) -> preview_mint must round UP (ceil, favors vault)
    let preview_m = client.preview_mint(&100);
    let idealized = client.convert_to_assets(&100);
    assert!(
        preview_m >= idealized,
        "preview_mint (ceil) must be >= convert_to_assets"
    );

    // Test C: withdraw(100) -> preview_withdraw must round UP (ceil, burns more shares)
    let preview_w = client.preview_withdraw(&100);
    let ideal_shares = client.convert_to_shares(&100);
    assert!(
        preview_w >= ideal_shares,
        "preview_withdraw (ceil) must be >= convert_to_shares"
    );

    // Test D: redeem(100 shares) -> preview_redeem must round DOWN (floor, gives fewer assets)
    let preview_r = client.preview_redeem(&100);
    assert!(
        preview_r <= preview_m,
        "preview_redeem (floor) must be <= preview_mint (ceil)"
    );
}

#[test]
fn test_overflow_protection() {
    let e = Env::default();
    let (_id, _asset, client) = setup(&e);

    let user = Address::generate(&e);

    // i128::MAX deposit must fail cleanly via checked arithmetic
    let result = client.try_deposit(&i128::MAX, &user, &user, &user);
    assert!(result.is_err(), "deposit(i128::MAX) must fail cleanly on overflow");
    assert_eq!(client.total_assets(), 0);

    // Negative assets/shares must panic/fail cleanly
    let neg_dep = client.try_deposit(&-1, &user, &user, &user);
    assert!(neg_dep.is_err(), "negative deposit must fail");

    let neg_conv = client.try_convert_to_shares(&-1);
    assert!(neg_conv.is_err(), "negative convert_to_shares must fail");

    let neg_conv_a = client.try_convert_to_assets(&-1);
    assert!(neg_conv_a.is_err(), "negative convert_to_assets must fail");
}

#[test]
fn test_access_control() {
    let e = Env::default();
    let (_id, asset, client) = setup(&e);

    let owner = Address::generate(&e);
    let operator = Address::generate(&e);
    let receiver = Address::generate(&e);

    mint_xlm(&e, &asset, &owner, 10 * XLM);

    // Owner deposits 5_000_000 stroops
    let shares = client.deposit(&5_000_000, &owner, &owner, &owner);
    assert_eq!(client.balance(&owner), shares);

    // 1. Unauthorized withdraw by operator (no allowance) must fail
    e.mock_auths(&[]);
    let unauth_res = client.try_withdraw(&1_000_000, &receiver, &owner, &operator);
    assert!(unauth_res.is_err(), "unauthorized withdraw without allowance must fail");

    // 2. Owner approves operator for 1_000_000_000 shares
    e.mock_all_auths();
    let approval_amount = 1_000_000_000i128;
    client.approve(&owner, &operator, &approval_amount, &1000);
    assert_eq!(client.allowance(&owner, &operator), approval_amount);

    // 3. Operator withdraws partial amount
    let withdraw_assets = 500_000i128;
    let burned = client.withdraw(&withdraw_assets, &receiver, &owner, &operator);
    assert!(burned > 0);
    assert_eq!(
        client.allowance(&owner, &operator),
        approval_amount - burned,
        "allowance must be decremented by exact burned shares"
    );

    // 4. Operator over-allowance withdraw attempt must fail cleanly
    let remaining_allowance = client.allowance(&owner, &operator);
    let excessive_assets = 5_000_000i128; // requires more shares than remaining allowance
    let over_res = client.try_withdraw(&excessive_assets, &receiver, &owner, &operator);
    assert!(over_res.is_err(), "over-allowance withdraw must fail");
    assert_eq!(
        client.allowance(&owner, &operator),
        remaining_allowance,
        "allowance must remain untouched after failed attempt"
    );
}
