import type { Page } from "playwright";
import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";

export class RabbyAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "rabby",
    name: "Rabby",
    extensionId: "acmacodkjbdgmoleebolmdjonilkdbch",
    supportsEvm: true,
    supportsSolana: false,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/acmacodkjbdgmoleebolmdjonilkdbch",
      linux: "~/.config/google-chrome/Default/Extensions/acmacodkjbdgmoleebolmdjonilkdbch",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\acmacodkjbdgmoleebolmdjonilkdbch",
    },
  };

  readonly selectors: WalletSelectors = {
    // Unlock screen
    passwordInput: 'input[type="password"]',
    unlockButton: 'button:has-text("Unlock")',

    // Main UI
    accountMenu: '.current-account',
    accountAddress: '.address-text',
    networkSelector: '.chain-selector',

    // Connection popup
    connectNextButton: 'button:has-text("Connect")',
    connectConfirmButton: 'button:has-text("Connect")',

    // Transaction popup - Rabby has detailed tx preview
    confirmButton: 'button:has-text("Sign")',
    rejectButton: 'button:has-text("Cancel")',

    // Signature popup
    signButton: 'button:has-text("Sign")',
    signRejectButton: 'button:has-text("Cancel")',

    // Network switch
    switchNetworkButton: 'button:has-text("Switch")',
  };

  getExtensionUrl(): string {
    return `chrome-extension://${this.meta.extensionId}/index.html`;
  }

  getConnectButtonSelectors(): string[] {
    return [
      'button:has-text("Rabby")',
      '[data-testid="rabby"]',
      '[data-testid="rabby-connector"]',
    ];
  }

  async handleConnectionPopup(popup: Page): Promise<void> {
    // Rabby has a simpler single-click connection
    try {
      await popup.waitForSelector(this.selectors.connectConfirmButton, {
        timeout: 5000,
      });
      await popup.click(this.selectors.connectConfirmButton);
      await popup.waitForEvent("close", { timeout: 10000 }).catch(() => {});
    } catch (error) {
      console.warn("Rabby connection popup handling failed:", error);
    }
  }
}
