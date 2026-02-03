import type { Page } from "playwright";
import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";
import type { TxIntent } from "../types.js";

export class PhantomAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "phantom",
    name: "Phantom",
    extensionId: "bfnaelmomeimhlpmgjnjophhpkkoljpa",
    supportsEvm: true,
    supportsSolana: true,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/bfnaelmomeimhlpmgjnjophhpkkoljpa",
      linux: "~/.config/google-chrome/Default/Extensions/bfnaelmomeimhlpmgjnjophhpkkoljpa",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\bfnaelmomeimhlpmgjnjophhpkkoljpa",
    },
  };

  readonly selectors: WalletSelectors = {
    // Unlock screen
    passwordInput: 'input[type="password"]',
    unlockButton: 'button:has-text("Unlock")',

    // Main UI
    accountMenu: '[data-testid="account-header"]',
    accountAddress: '[data-testid="address-copy"]',
    networkSelector: '[data-testid="network-selector"]',

    // Connection popup
    connectNextButton: 'button:has-text("Connect")',
    connectConfirmButton: 'button:has-text("Connect")',

    // Transaction popup
    confirmButton: 'button:has-text("Confirm")',
    rejectButton: 'button:has-text("Cancel")',

    // Signature popup
    signButton: 'button:has-text("Approve")',
    signRejectButton: 'button:has-text("Cancel")',

    // Network switch
    switchNetworkButton: 'button:has-text("Switch")',
  };

  getExtensionUrl(): string {
    return `chrome-extension://${this.meta.extensionId}/popup.html`;
  }

  getConnectButtonSelectors(): string[] {
    return [
      'button:has-text("Phantom")',
      '[data-testid="phantom"]',
      '[data-testid="phantom-connector"]',
    ];
  }

  async handleTransactionPopup(popup: Page, intent?: TxIntent): Promise<string> {
    // Phantom has separate confirmation for EVM and Solana
    const isSolana = intent?.chainId === 0 || !intent?.chainId; // Solana doesn't use chainId

    if (isSolana) {
      // Solana transaction flow
      await popup.waitForSelector('button:has-text("Approve")', {
        timeout: 30000,
      });
      await popup.click('button:has-text("Approve")');
    } else {
      // EVM transaction flow (same as base)
      await popup.waitForSelector(this.selectors.confirmButton, {
        timeout: 30000,
      });
      await popup.click(this.selectors.confirmButton);
    }

    await popup.waitForEvent("close", { timeout: 60000 });
    return "0x_tx_hash_placeholder";
  }

  getNetworkName(chainId: number): string | null {
    // Phantom network names
    const networks: Record<number, string> = {
      1: "Ethereum",
      137: "Polygon",
      42161: "Arbitrum",
      10: "Optimism",
      8453: "Base",
      0: "Solana Mainnet", // Special case for Solana
    };
    return networks[chainId] ?? null;
  }
}
