import type { Page } from "playwright";
import type { TxIntent, WalletState } from "./types.js";
import type { BrowserManager } from "./browser.js";
import type { Config } from "./config.js";
import { getWalletAdapter, type WalletAdapter, type WalletProviderId } from "./wallets/index.js";

export class WalletController {
  private browser: BrowserManager;
  private config: Config;
  private adapter: WalletAdapter;
  private state: WalletState;

  constructor(browser: BrowserManager, config: Config) {
    this.browser = browser;
    this.config = config;
    this.adapter = getWalletAdapter(config.walletProvider);
    this.state = {
      address: "",
      chainId: 1,
      isConnected: false,
      balances: new Map(),
      provider: config.walletProvider,
    };
  }

  /**
   * Switch to a different wallet provider
   */
  setProvider(providerId: WalletProviderId): void {
    this.adapter = getWalletAdapter(providerId);
    this.state.provider = providerId;
    console.log(`Switched to wallet provider: ${this.adapter.meta.name}`);
  }

  getProviderName(): string {
    return this.adapter.meta.name;
  }

  async unlock(password: string): Promise<void> {
    const walletPage = await this.browser.openWalletExtension(this.adapter);

    const needsUnlock = await walletPage.$(this.adapter.selectors.passwordInput);
    if (!needsUnlock) {
      console.log(`${this.adapter.meta.name} already unlocked`);
      return;
    }

    await walletPage.fill(this.adapter.selectors.passwordInput, password);
    await walletPage.click(this.adapter.selectors.unlockButton);

    await walletPage.waitForSelector(this.adapter.selectors.accountMenu, {
      timeout: this.config.popupTimeout,
    });

    console.log(`${this.adapter.meta.name} unlocked`);
  }

  async getAddress(): Promise<string> {
    const walletPage = await this.browser.openWalletExtension(this.adapter);

    await walletPage.click(this.adapter.selectors.accountMenu);

    const addressElement = await walletPage.waitForSelector(
      this.adapter.selectors.accountAddress
    );
    const address = await addressElement?.textContent();

    await walletPage.keyboard.press("Escape");

    if (address) {
      this.state.address = address.trim();
    }

    return this.state.address;
  }

  async connectToDapp(dappUrl: string): Promise<void> {
    const page = this.browser.getPage();
    if (!page) {
      throw new Error("Browser not launched");
    }

    await this.browser.navigate(dappUrl);
    await page.waitForTimeout(2000);

    // Look for common "Connect Wallet" buttons
    const connectSelectors = [
      'button:has-text("Connect")',
      'button:has-text("Connect Wallet")',
      '[data-testid="connect-wallet"]',
      '[data-testid="navbar-connect-wallet"]',
      'button:has-text("Launch App")',
    ];

    for (const selector of connectSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          break;
        }
      } catch {
        continue;
      }
    }

    await page.waitForTimeout(1000);

    // Click the specific wallet option
    const walletSelectors = this.adapter.getConnectButtonSelectors();
    for (const selector of walletSelectors) {
      try {
        const button = await page.$(selector);
        if (button) {
          await button.click();
          break;
        }
      } catch {
        continue;
      }
    }

    // Handle wallet connection popup
    await this.handleConnectionPopup();

    this.state.isConnected = true;
    console.log(`Connected to dapp via ${this.adapter.meta.name}: ${dappUrl}`);
  }

  private async handleConnectionPopup(): Promise<void> {
    try {
      const popup = await this.browser.waitForWalletPopup();
      await this.adapter.handleConnectionPopup(popup);
    } catch (error) {
      console.warn("Connection popup handling failed:", error);
    }
  }

  async confirmTransaction(expectedIntent?: TxIntent): Promise<string> {
    const popup = await this.browser.waitForWalletPopup();
    return await this.adapter.handleTransactionPopup(popup, expectedIntent);
  }

  async rejectTransaction(): Promise<void> {
    const popup = await this.browser.waitForWalletPopup();

    await popup.waitForSelector(this.adapter.selectors.rejectButton, {
      timeout: this.config.popupTimeout,
    });
    await popup.click(this.adapter.selectors.rejectButton);

    await popup.waitForEvent("close", { timeout: 10000 }).catch(() => {});
    console.log("Transaction rejected");
  }

  async signMessage(expectedMessage?: string): Promise<string> {
    const popup = await this.browser.waitForWalletPopup();
    return await this.adapter.handleSignaturePopup(popup, expectedMessage);
  }

  async rejectSignature(): Promise<void> {
    const popup = await this.browser.waitForWalletPopup();

    await popup.waitForSelector(this.adapter.selectors.signRejectButton, {
      timeout: this.config.popupTimeout,
    });
    await popup.click(this.adapter.selectors.signRejectButton);

    await popup.waitForEvent("close", { timeout: 10000 }).catch(() => {});
    console.log("Signature rejected");
  }

  async switchNetwork(chainId: number): Promise<void> {
    const walletPage = await this.browser.openWalletExtension(this.adapter);

    await walletPage.click(this.adapter.selectors.networkSelector);

    const networkName = this.adapter.getNetworkName(chainId);
    if (!networkName) {
      throw new Error(`Unknown chain ID: ${chainId}`);
    }

    try {
      await walletPage.click(`text=${networkName}`, { timeout: 5000 });
    } catch {
      console.warn(`Network ${networkName} not found, may need to add it`);
      throw new Error(`Network ${networkName} not configured in ${this.adapter.meta.name}`);
    }

    this.state.chainId = chainId;
    console.log(`Switched to network: ${networkName}`);
  }

  getState(): WalletState {
    return { ...this.state };
  }

  isConnected(): boolean {
    return this.state.isConnected;
  }
}
