import type { Page } from "playwright";
import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";
import type { TxIntent } from "../types.js";

export class BackpackAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "backpack",
    name: "Backpack",
    extensionId: "aflkmfhebedbjioipglgcbcmnbpgliof",
    supportsEvm: true,
    supportsSolana: true,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/aflkmfhebedbjioipglgcbcmnbpgliof",
      linux: "~/.config/google-chrome/Default/Extensions/aflkmfhebedbjioipglgcbcmnbpgliof",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\aflkmfhebedbjioipglgcbcmnbpgliof",
    },
  };

  readonly selectors: WalletSelectors = {
    // Unlock screen
    passwordInput: 'input[type="password"]',
    unlockButton: 'button:has-text("Unlock")',

    // Main UI
    accountMenu: '[data-testid="account-menu"]',
    accountAddress: '[data-testid="address"]',
    networkSelector: '[data-testid="network-selector"]',

    // Connection popup
    connectNextButton: 'button:has-text("Connect")',
    connectConfirmButton: 'button:has-text("Approve")',

    // Transaction popup
    confirmButton: 'button:has-text("Approve")',
    rejectButton: 'button:has-text("Reject")',

    // Signature popup
    signButton: 'button:has-text("Approve")',
    signRejectButton: 'button:has-text("Reject")',

    // Network switch
    switchNetworkButton: 'button:has-text("Switch")',
  };

  getExtensionUrl(): string {
    return `chrome-extension://${this.meta.extensionId}/popup.html`;
  }

  getConnectButtonSelectors(): string[] {
    return [
      'button:has-text("Backpack")',
      '[data-testid="backpack"]',
      '[data-testid="backpack-connector"]',
    ];
  }

  async handleTransactionPopup(popup: Page, intent?: TxIntent): Promise<string> {
    // Backpack uses "Approve" for both Solana and EVM
    await popup.waitForSelector('button:has-text("Approve")', {
      timeout: 30000,
    });
    await popup.click('button:has-text("Approve")');

    await popup.waitForEvent("close", { timeout: 60000 });
    return "0x_tx_hash_placeholder";
  }

  getNetworkName(chainId: number): string | null {
    const networks: Record<number, string> = {
      1: "Ethereum",
      137: "Polygon",
      42161: "Arbitrum",
      10: "Optimism",
      8453: "Base",
      0: "Solana",
    };
    return networks[chainId] ?? null;
  }
}
