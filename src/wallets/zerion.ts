import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";

export class ZerionAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "zerion",
    name: "Zerion",
    extensionId: "klghhnkeealcohjjanjjdaeeggmfmlpl",
    supportsEvm: true,
    supportsSolana: true,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/klghhnkeealcohjjanjjdaeeggmfmlpl",
      linux: "~/.config/google-chrome/Default/Extensions/klghhnkeealcohjjanjjdaeeggmfmlpl",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\klghhnkeealcohjjanjjdaeeggmfmlpl",
    },
  };

  readonly selectors: WalletSelectors = {
    // Unlock screen
    passwordInput: 'input[type="password"]',
    unlockButton: 'button:has-text("Unlock")',

    // Main UI
    accountMenu: '[data-testid="account-button"]',
    accountAddress: '[data-testid="address"]',
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
    switchNetworkButton: 'button:has-text("Switch")',
  };

  getExtensionUrl(): string {
    return `chrome-extension://${this.meta.extensionId}/popup.html`;
  }

  getConnectButtonSelectors(): string[] {
    return [
      'button:has-text("Zerion")',
      '[data-testid="zerion"]',
      '[data-testid="zerion-connector"]',
    ];
  }
}
