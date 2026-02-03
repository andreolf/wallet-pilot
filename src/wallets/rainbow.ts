import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";

export class RainbowAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "rainbow",
    name: "Rainbow",
    extensionId: "opfgelmcmbiajamepnmloijbpoleiama",
    supportsEvm: true,
    supportsSolana: false,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/opfgelmcmbiajamepnmloijbpoleiama",
      linux: "~/.config/google-chrome/Default/Extensions/opfgelmcmbiajamepnmloijbpoleiama",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\opfgelmcmbiajamepnmloijbpoleiama",
    },
  };

  readonly selectors: WalletSelectors = {
    // Unlock screen
    passwordInput: 'input[type="password"]',
    unlockButton: 'button:has-text("Unlock")',

    // Main UI
    accountMenu: '[data-testid="header-account"]',
    accountAddress: '[data-testid="account-address"]',
    networkSelector: '[data-testid="network-menu"]',

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
    return `chrome-extension://${this.meta.extensionId}/popup.html`;
  }

  getConnectButtonSelectors(): string[] {
    return [
      'button:has-text("Rainbow")',
      '[data-testid="rainbow"]',
      '[data-testid="rainbow-connector"]',
    ];
  }
}
