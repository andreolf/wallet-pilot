import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";

export class ExodusAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "exodus",
    name: "Exodus",
    extensionId: "aholpfdialjgjfhomihkjbmgjidlcdno",
    supportsEvm: true,
    supportsSolana: true,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/aholpfdialjgjfhomihkjbmgjidlcdno",
      linux: "~/.config/google-chrome/Default/Extensions/aholpfdialjgjfhomihkjbmgjidlcdno",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\aholpfdialjgjfhomihkjbmgjidlcdno",
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
    connectConfirmButton: 'button:has-text("Connect")',

    // Transaction popup
    confirmButton: 'button:has-text("Approve")',
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
      'button:has-text("Exodus")',
      '[data-testid="exodus"]',
      '[data-testid="exodus-connector"]',
    ];
  }

  getNetworkName(chainId: number): string | null {
    const networks: Record<number, string> = {
      1: "Ethereum",
      137: "Polygon",
      42161: "Arbitrum",
      10: "Optimism",
      8453: "Base",
      0: "Solana",
      // Cardano not directly accessible via chainId
    };
    return networks[chainId] ?? null;
  }
}
