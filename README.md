# WalletPilot

Universal browser wallet automation for AI agents. Control MetaMask, Rabby, Coinbase Wallet, Rainbow, or Phantom with configurable permission guardrails.

## Features

- **Multi-wallet support** — MetaMask, Rabby, Coinbase, Rainbow, Phantom
- **EVM + Solana** — Phantom supports both
- **Permission guardrails** — Spend limits, chain allowlists, protocol restrictions
- **Transaction logging** — Full audit trail
- **Isolated profiles** — Never touches your main wallet

## Quick Start

```bash
# Install
npm install
npx playwright install chromium

# Setup wallet (one time)
npm run setup

# Connect to dapp
npm run dev connect https://app.uniswap.org
```

## Configuration

Edit `config.json` to select your wallet:

```json
{
  "wallet": {
    "provider": "metamask"  // or: rabby, coinbase, rainbow, phantom
  }
}
```

Edit `permissions.json` to set guardrails:

```json
{
  "constraints": {
    "spendLimit": {
      "daily": "50000000",  // $50
      "perTx": "10000000"   // $10
    },
    "allowedChains": [1, 137, 42161]
  }
}
```

## Supported Wallets (10)

| Wallet | EVM | Solana | Extension ID |
|--------|-----|--------|--------------|
| MetaMask | ✅ | - | nkbihfbeogaeaoehlefnkodbefgpgknn |
| Rabby | ✅ | - | acmacodkjbdgmoleebolmdjonilkdbch |
| Coinbase | ✅ | - | hnfanknocfeofbddgcijnmhnfnkdnaad |
| Rainbow | ✅ | - | opfgelmcmbiajamepnmloijbpoleiama |
| Phantom | ✅ | ✅ | bfnaelmomeimhlpmgjnjophhpkkoljpa |
| Trust Wallet | ✅ | ✅ | egjidjbpglichdcondbcbdnbeeppgdph |
| Zerion | ✅ | ✅ | klghhnkeealcohjjanjjdaeeggmfmlpl |
| Exodus | ✅ | ✅ | aholpfdialjgjfhomihkjbmgjidlcdno |
| OKX Wallet | ✅ | ✅ | mcohilncbfahbmgdjkbpemcciiolgcge |
| Backpack | ✅ | ✅ | aflkmfhebedbjioipglgcbcmnbpgliof |

## Commands

```bash
npm run dev connect <url>   # Connect to dapp
npm run dev balance         # Check balance
npm run dev history         # Transaction history
npm run dev wallets         # List supported wallets
```

## Architecture

```
src/
├── wallets/
│   ├── adapter.ts    # Base interface
│   ├── metamask.ts   # MetaMask adapter
│   ├── rabby.ts      # Rabby adapter
│   ├── coinbase.ts   # Coinbase adapter
│   ├── rainbow.ts    # Rainbow adapter
│   └── phantom.ts    # Phantom adapter
├── browser.ts        # Playwright management
├── wallet.ts         # Wallet controller
├── guard.ts          # Permission enforcement
├── logger.ts         # Transaction logging
└── price.ts          # USD estimation
```

## Adding New Wallets

1. Create adapter in `src/wallets/`
2. Implement `WalletAdapter` interface
3. Add UI selectors
4. Register in `src/wallets/index.ts`

## Security

- Uses isolated browser profile
- Separate wallet from your main funds
- All transactions logged
- Configurable spend limits
- Protocol allowlisting
- Easy revocation
