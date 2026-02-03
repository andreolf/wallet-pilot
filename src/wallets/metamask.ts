import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";

export class MetaMaskAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "metamask",
    name: "MetaMask",
    extensionId: "nkbihfbeogaeaoehlefnkodbefgpgknn",
    supportsEvm: true,
    supportsSolana: false,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/nkbihfbeogaeaoehlefnkodbefgpgknn",
      linux: "~/.config/google-chrome/Default/Extensions/nkbihfbeogaeaoehlefnkodbefgpgknn",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\nkbihfbeogaeaoehlefnkodbefgpgknn",
    },
  };

  readonly selectors: WalletSelectors = {
    // Unlock screen
    passwordInput: '[data-testid="unlock-password"]',
    unlockButton: '[data-testid="unlock-submit"]',

    // Main UI
    accountMenu: '[data-testid="account-menu-icon"]',
    accountAddress: '[data-testid="account-list-item-address"]',
    networkSelector: '[data-testid="network-display"]',

    // Connection popup
    connectNextButton: '[data-testid="page-container-footer-next"]',
    connectConfirmButton: '[data-testid="page-container-footer-next"]',

    // Transaction popup
    confirmButton: '[data-testid="page-container-footer-next"]',
    rejectButton: '[data-testid="page-container-footer-cancel"]',
    txAmount: '[data-testid="transaction-detail-item"]',

    // Signature popup
    signButton: '[data-testid="page-container-footer-next"]',
    signRejectButton: '[data-testid="page-container-footer-cancel"]',

    // Network switch
    switchNetworkButton: '[data-testid="confirmation-submit-button"]',
    addNetworkButton: '[data-testid="confirmation-submit-button"]',
  };

  getConnectButtonSelectors(): string[] {
    return [
      'button:has-text("MetaMask")',
      '[data-testid="metamask"]',
      '[data-testid="metamask-connector"]',
      'button:has-text("Injected")',
      '[data-testid="injected-connector"]',
    ];
  }

  getNetworkName(chainId: number): string | null {
    const networks: Record<number, string> = {
      1: "Ethereum Mainnet",
      137: "Polygon Mainnet",
      42161: "Arbitrum One",
      10: "OP Mainnet",
      8453: "Base",
      43114: "Avalanche C-Chain",
      56: "BNB Smart Chain",
    };
    return networks[chainId] ?? null;
  }
}
