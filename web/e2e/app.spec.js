import { expect, test } from "@playwright/test";

const SHOTS = process.env.SHOTS_DIR; // optional: where v3-*.png go
const VALID = "CADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQP5KR"; // checksum-valid strkey, no contract deployed there

const watch = (page) => {
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
};
const noSideScroll = async (page) => {
  const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
  expect(sw, "horizontal overflow").toBeLessThanOrEqual(iw);
};
const shot = async (page, name, opts = {}) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}`, ...opts }); };
const revealAll = async (page) => {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(80); }
  await page.waitForTimeout(700);
  await page.evaluate(() => window.scrollTo(0, 0));
};

for (const width of [1440, 390]) {
  for (const lang of ["en", "id"]) {
    test(`landing ${width} ${lang}`, async ({ page }) => {
      const errors = watch(page);
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
      await page.goto(lang === "id" ? "/?lang=id" : "/");
      await expect(page.getByTestId("banner")).toContainText(lang === "id" ? "Aktif di Stellar Soroban Testnet" : "Live on Stellar Soroban Testnet");
      await expect(page.getByTestId("hero-open")).toHaveAttribute("href", lang === "id" ? "/app#lang=id" : "/app");
      await expect(page.getByTestId("hero-open")).toContainText(lang === "id" ? "Buka Vault" : "Open Vault");
      await expect(page.getByTestId("stat-price")).toContainText("1.0000000");
      await expect(page.getByTestId("lab-karsa")).toContainText("4,761,904,761");
      await expect(page.getByTestId("lab-naive")).toContainText("99");
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      expect(await page.content()).not.toMatch(/aegis/i);
      if (width === 1440 && lang === "en") {
        await expect(page.getByTestId("nav-launch")).toHaveText("Launch App");
        await shot(page, "v3-landing-top.png");
        await revealAll(page);
        await shot(page, "v3-landing-full.png", { fullPage: true });
      }
      if (width === 1440 && lang === "id") await expect(page.getByTestId("nav-launch")).toHaveText("Buka App");
      await noSideScroll(page);
      expect(errors).toEqual([]);
    });

    test(`app ${width} ${lang}`, async ({ page }) => {
      const errors = watch(page);
      await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
      await page.goto(lang === "id" ? "/app#lang=id" : "/app");
      await expect(page.getByTestId("mode-notice")).toHaveAttribute("data-code", "CONTRACT_NOT_CONFIGURED");
      await expect(page.getByTestId("mode-tag")).toHaveText(lang === "id" ? "Pratinjau" : "Preview");
      await expect(page.getByTestId("vs-price")).toContainText("1.0000000");
      for (const k of ["deposit", "mint", "withdraw", "redeem"]) {
        await page.getByTestId(`tab-${k}`).click();
        await expect(page.getByTestId(`form-${k}`)).toBeVisible();
        await expect(page.getByTestId(`pv-${k}`)).toHaveAttribute("data-source", "local");
      }
      await noSideScroll(page);
      await page.getByTestId("tab-deposit").click();
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(200);
      if (width === 1440 && lang === "en") await shot(page, "v3-app-desktop.png", { fullPage: true });
      if (width === 390 && lang === "en") await shot(page, "v3-app-mobile.png", { fullPage: true });
      if (width === 1440 && lang === "id") await shot(page, "v3-app-id.png", { fullPage: true });
      expect(await page.content()).not.toMatch(/aegis/i);
      expect(errors).toEqual([]);
    });
  }
}

test("preview actions run locally and nothing is sent", async ({ page }) => {
  const errors = watch(page);
  const sent = [];
  page.on("request", (r) => { if (r.method() === "POST" && /soroban/.test(r.url())) sent.push(r.postData() || ""); });
  await page.goto("/app");
  await page.getByTestId("amt-deposit").fill("0.5");
  await expect(page.getByTestId("pv-deposit-value")).toContainText("0.5000000000");
  await page.getByTestId("submit-deposit").click();
  await expect(page.getByTestId("preview-flash")).toContainText("Nothing was sent");
  await expect(page.getByTestId("pos-shares")).toContainText("0.5000000000");
  await page.getByTestId("tab-mint").click();
  await page.getByTestId("amt-mint").fill("0.0003");
  await expect(page.getByTestId("pv-mint-value")).toContainText("0.0003000");
  await page.getByTestId("tab-withdraw").click();
  await page.getByTestId("amt-withdraw").fill("0.2");
  await expect(page.getByTestId("pv-withdraw-value")).toContainText("0.2000000000");
  await page.getByTestId("submit-withdraw").click();
  await page.getByTestId("tab-redeem").click();
  await page.getByTestId("amt-redeem").fill("9");
  await expect(page.getByTestId("submit-redeem")).toBeDisabled();
  await page.getByTestId("tab-redeem").press("ArrowLeft");
  await expect(page.getByTestId("tab-withdraw")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".log-list li")).toHaveCount(2);
  expect(sent.filter((b) => /sendTransaction/.test(b))).toEqual([]);
  expect(errors).toEqual([]);
});

test("Change Contract ID accepts a valid ID and rejects an invalid one", async ({ page }) => {
  const errors = watch(page);
  await page.goto("/app");
  await page.getByTestId("contract-change").click();
  await page.getByTestId("contract-input").fill("CBAD");
  await page.getByTestId("contract-save").click();
  await expect(page.getByTestId("contract-msg")).toContainText("Not a contract ID");
  await expect(page.getByTestId("contract-input")).toHaveAttribute("aria-invalid", "true");
  await page.getByTestId("contract-input").fill(`C${"A".repeat(55)}`);
  await page.getByTestId("contract-save").click();
  await expect(page.getByTestId("contract-msg")).toContainText("checksum");
  await page.getByTestId("contract-input").fill(VALID.toLowerCase());
  await page.getByTestId("contract-save").click();
  await expect(page.getByTestId("contract-id")).toHaveText(VALID);
  await expect(page.getByTestId("contract-explorer")).toHaveAttribute("href", `https://stellar.expert/explorer/testnet/contract/${VALID}`);
  expect(await page.evaluate(() => localStorage.getItem("karsa.contractId"))).toBe(VALID);
  // No contract lives at this ID: the app must say so instead of showing numbers.
  await expect(page.getByTestId("read-error")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("read-error")).toHaveAttribute("data-code", /SIMULATION_FAILED|RPC_UNREACHABLE/);
  console.log("read-error for an empty contract ID:", await page.getByTestId("read-error").getAttribute("data-code"));
  await page.reload();
  await expect(page.getByTestId("contract-id")).toHaveText(VALID);
  await page.getByTestId("contract-change").click();
  await page.getByTestId("contract-clear").click();
  await expect(page.getByTestId("mode-notice")).toHaveAttribute("data-code", "CONTRACT_NOT_CONFIGURED");
  expect(errors.filter((e) => !/Failed to load resource/.test(e))).toEqual([]);
});
