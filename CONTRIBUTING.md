# Contributing to WalletPilot

Thanks for your interest in contributing! Here's how you can help.

## Ways to Contribute

### 1. Add a New Wallet Adapter

We support 10 wallets, but there are more out there. To add a new one:

1. Create a new file in `src/wallets/` (e.g., `newwallet.ts`)
2. Implement the `WalletAdapter` interface
3. Add UI selectors for the wallet's popup
4. Register it in `src/wallets/index.ts`
5. Test the connection flow

Use `src/wallets/metamask.ts` as a reference.

**Needed wallets:**
- Brave Wallet
- Frame
- Taho (formerly Tally)
- Argent
- Safe (Gnosis Safe)

### 2. Fix/Update Selectors

Wallet UIs change frequently. If a wallet connection or transaction flow breaks:

1. Open the wallet extension
2. Use browser DevTools to find the new selector
3. Update the adapter file
4. Submit a PR with before/after notes

### 3. Improve Price Feeds

Current price estimation uses CoinGecko's free API. Help wanted for:

- Better caching strategies
- Support for more tokens
- Alternative price sources (Chainlink, DeFiLlama)

### 4. Add Tests

We need more test coverage, especially for:

- Guard logic edge cases
- Permission validation
- Log parsing

## Development Setup

```bash
# Clone
git clone https://github.com/andreolf/wallet-pilot
cd wallet-pilot

# Install
npm install
npx playwright install chromium

# Build
npm run build

# Run tests
npm test

# Run in dev mode
npm run dev wallets
```

## Code Style

- TypeScript strict mode
- Use async/await (no raw promises)
- Descriptive variable names
- Comments for non-obvious logic

## Pull Request Process

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/new-wallet`)
3. Make your changes
4. Run tests (`npm test`)
5. Build (`npm run build`)
6. Submit PR with clear description

## Wallet Adapter Template

```typescript
import { BaseWalletAdapter, type WalletMeta, type WalletSelectors } from "./adapter.js";

export class NewWalletAdapter extends BaseWalletAdapter {
  readonly meta: WalletMeta = {
    id: "newwallet",
    name: "New Wallet",
    extensionId: "chrome-extension-id-here",
    supportsEvm: true,
    supportsSolana: false,
    defaultExtensionPaths: {
      mac: "~/Library/Application Support/Google/Chrome/Default/Extensions/...",
      linux: "~/.config/google-chrome/Default/Extensions/...",
      windows: "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Extensions\\...",
    },
  };

  readonly selectors: WalletSelectors = {
    passwordInput: 'input[type="password"]',
    unlockButton: 'button:has-text("Unlock")',
    accountMenu: '[data-testid="account-menu"]',
    accountAddress: '[data-testid="address"]',
    networkSelector: '[data-testid="network"]',
    connectNextButton: 'button:has-text("Connect")',
    connectConfirmButton: 'button:has-text("Confirm")',
    confirmButton: 'button:has-text("Confirm")',
    rejectButton: 'button:has-text("Reject")',
    signButton: 'button:has-text("Sign")',
    signRejectButton: 'button:has-text("Reject")',
    switchNetworkButton: 'button:has-text("Switch")',
  };

  getConnectButtonSelectors(): string[] {
    return [
      'button:has-text("New Wallet")',
      '[data-testid="newwallet-connector"]',
    ];
  }
}
```

## Questions?

Open an issue or reach out on Twitter/Discord.
