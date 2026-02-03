import type { Page } from "playwright";
import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";

export class CoinbaseWalletAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "coinbase",
    name: "Coinbase Wallet",
    extensionId: "hnfanknocfeofbddgcijnmhnfnkdnaad",
    supportsEvm: true,
    supportsSolana: false,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/hnfanknocfeofbddgcijnmhnfnkdnaad",
      linux: "~/.config/google-chrome/Default/Extensions/hnfanknocfeofbddgcijnmhnfnkdnaad",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\hnfanknocfeofbddgcijnmhnfnkdnaad",
    },
  };

  readonly selectors: WalletSelectors = {
    // Unlock screen
    passwordInput: 'input[type="password"]',
    unlockButton: 'button:has-text("Unlock")',

    // Main UI
    accountMenu: '[data-testid="account-menu"]',
    accountAddress: '[data-testid="account-address"]',
    networkSelector: '[data-testid="network-selector"]',

    // Connection popup
    connectNextButton: 'button:has-text("Connect")',
    connectConfirmButton: 'button:has-text("Connect")',

    // Transaction popup
    confirmButton: 'button:has-text("Confirm")',
    rejectButton: 'button:has-text("Cancel")',

    // Signature popup
    signButton: 'button:has-text("Sign")',
    signRejectButton: 'button:has-text("Cancel")',

    // Network switch
    switchNetworkButton: 'button:has-text("Switch network")',
  };

  getExtensionUrl(): string {
    return `chrome-extension://${this.meta.extensionId}/index.html`;
  }

  getConnectButtonSelectors(): string[] {
    return [
      'button:has-text("Coinbase Wallet")',
      'button:has-text("Coinbase")',
      '[data-testid="coinbase-wallet"]',
      '[data-testid="coinbase-connector"]',
    ];
  }

  async handleConnectionPopup(popup: Page): Promise<void> {
    try {
      // Coinbase Wallet may show terms first
      const termsButton = await popup.$('button:has-text("Accept")');
      if (termsButton) {
        await termsButton.click();
        await popup.waitForTimeout(500);
      }

      await popup.waitForSelector(this.selectors.connectConfirmButton, {
        timeout: 5000,
      });
      await popup.click(this.selectors.connectConfirmButton);
      await popup.waitForEvent("close", { timeout: 10000 }).catch(() => {});
    } catch (error) {
      console.warn("Coinbase Wallet connection popup handling failed:", error);
    }
  }
}
