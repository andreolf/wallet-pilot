import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";

export class OKXWalletAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "okx",
    name: "OKX Wallet",
    extensionId: "mcohilncbfahbmgdjkbpemcciiolgcge",
    supportsEvm: true,
    supportsSolana: true,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/mcohilncbfahbmgdjkbpemcciiolgcge",
      linux: "~/.config/google-chrome/Default/Extensions/mcohilncbfahbmgdjkbpemcciiolgcge",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\mcohilncbfahbmgdjkbpemcciiolgcge",
    },
  };

  readonly selectors: WalletSelectors = {
    // Unlock screen
    passwordInput: 'input[type="password"]',
    unlockButton: 'button:has-text("Unlock")',

    // Main UI
    accountMenu: '[data-testid="account-menu"]',
    accountAddress: '[data-testid="address-text"]',
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
      'button:has-text("OKX Wallet")',
      'button:has-text("OKX")',
      '[data-testid="okx-wallet"]',
      '[data-testid="okx-connector"]',
    ];
  }

  getNetworkName(chainId: number): string | null {
    // OKX supports 140+ chains
    const networks: Record<number, string> = {
      1: "Ethereum",
      137: "Polygon",
      42161: "Arbitrum One",
      10: "Optimism",
      8453: "Base",
      43114: "Avalanche C-Chain",
      56: "BNB Chain",
      250: "Fantom",
      324: "zkSync Era",
      59144: "Linea",
      0: "Solana",
    };
    return networks[chainId] ?? null;
  }
}
