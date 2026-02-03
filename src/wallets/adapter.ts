import type { Page } from "playwright";
import type { TxIntent } from "../types.js";

/**
 * UI selectors for a wallet extension
 */
export interface WalletSelectors {
  // Unlock
  passwordInput: string;
  unlockButton: string;

  // Main UI
  accountMenu: string;
  accountAddress: string;
  networkSelector: string;

  // Connection popup
  connectNextButton: string;
  connectConfirmButton: string;

  // Transaction popup
  confirmButton: string;
  rejectButton: string;
  txAmount?: string;

  // Signature popup
  signButton: string;
  signRejectButton: string;

  // Network switch
  switchNetworkButton: string;
  addNetworkButton?: string;
}

/**
 * Wallet metadata
 */
export interface WalletMeta {
  id: string;
  name: string;
  extensionId: string; // Chrome extension ID
  supportsEvm: boolean;
  supportsSolana: boolean;
  defaultExtensionPaths: {
    mac: string;
    linux: string;
    windows: string;
  };
}

/**
 * Base interface all wallet adapters must implement
 */
export interface WalletAdapter {
  readonly meta: WalletMeta;
  readonly selectors: WalletSelectors;

  /**
   * Get the extension URL for opening the wallet UI
   */
  getExtensionUrl(): string;

  /**
   * Detect if this wallet is the "connect wallet" option on a dapp page
   */
  getConnectButtonSelectors(): string[];

  /**
   * Handle any wallet-specific quirks during connection
   */
  handleConnectionPopup(popup: Page): Promise<void>;

  /**
   * Handle any wallet-specific quirks during transaction confirmation
   */
  handleTransactionPopup(popup: Page, intent?: TxIntent): Promise<string>;

  /**
   * Handle any wallet-specific quirks during message signing
   */
  handleSignaturePopup(popup: Page, message?: string): Promise<string>;

  /**
   * Get network name from chain ID (wallet-specific naming)
   */
  getNetworkName(chainId: number): string | null;
}

/**
 * Base class with common functionality
 */
export abstract class BaseWalletAdapter implements WalletAdapter {
  abstract readonly meta: WalletMeta;
  abstract readonly selectors: WalletSelectors;

  getExtensionUrl(): string {
    return `chrome-extension://${this.meta.extensionId}/home.html`;
  }

  getConnectButtonSelectors(): string[] {
    return [
      `button:has-text("${this.meta.name}")`,
      `[data-testid="${this.meta.id}"]`,
      `[data-testid="${this.meta.id}-connector"]`,
    ];
  }

  async handleConnectionPopup(popup: Page): Promise<void> {
    // Default implementation - click through connection flow
    try {
      await popup.waitForSelector(this.selectors.connectNextButton, {
        timeout: 5000,
      });
      await popup.click(this.selectors.connectNextButton);

      await popup.waitForSelector(this.selectors.connectConfirmButton, {
        timeout: 5000,
      });
      await popup.click(this.selectors.connectConfirmButton);

      await popup.waitForEvent("close", { timeout: 10000 }).catch(() => {});
    } catch (error) {
      console.warn(`${this.meta.name} connection popup handling failed:`, error);
    }
  }

  async handleTransactionPopup(popup: Page, _intent?: TxIntent): Promise<string> {
    await popup.waitForSelector(this.selectors.confirmButton, {
      timeout: 30000,
    });
    await popup.click(this.selectors.confirmButton);

    await popup.waitForEvent("close", { timeout: 60000 });

    // TODO: Extract actual tx hash
    return "0x_tx_hash_placeholder";
  }

  async handleSignaturePopup(popup: Page, _message?: string): Promise<string> {
    await popup.waitForSelector(this.selectors.signButton, {
      timeout: 30000,
    });
    await popup.click(this.selectors.signButton);

    await popup.waitForEvent("close", { timeout: 10000 }).catch(() => {});

    // TODO: Extract actual signature
    return "0x_signature_placeholder";
  }

  getNetworkName(chainId: number): string | null {
    const networks: Record<number, string> = {
      1: "Ethereum",
      137: "Polygon",
      42161: "Arbitrum",
      10: "Optimism",
      8453: "Base",
      43114: "Avalanche",
      56: "BNB Chain",
    };
    return networks[chainId] ?? null;
  }
}
