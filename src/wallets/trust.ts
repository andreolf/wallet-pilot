import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";

export class TrustWalletAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "trust",
    name: "Trust Wallet",
    extensionId: "egjidjbpglichdcondbcbdnbeeppgdph",
    supportsEvm: true,
    supportsSolana: true,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/egjidjbpglichdcondbcbdnbeeppgdph",
      linux: "~/.config/google-chrome/Default/Extensions/egjidjbpglichdcondbcbdnbeeppgdph",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\egjidjbpglichdcondbcbdnbeeppgdph",
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
    rejectButton: 'button:has-text("Reject")',

    // Signature popup
    signButton: 'button:has-text("Sign")',
    signRejectButton: 'button:has-text("Reject")',

    // Network switch
    switchNetworkButton: 'button:has-text("Switch")',
  };

  getExtensionUrl(): string {
    return `chrome-extension://${this.meta.extensionId}/home.html`;
  }

  getConnectButtonSelectors(): string[] {
    return [
      'button:has-text("Trust Wallet")',
      'button:has-text("Trust")',
      '[data-testid="trust-wallet"]',
      '[data-testid="trust-connector"]',
    ];
  }
}
