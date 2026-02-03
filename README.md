# WalletPilot 🚀

**Let AI agents control your crypto wallet — safely.**

WalletPilot is an open-source skill that gives AI agents (like OpenClaw, Cursor, Claude) the ability to interact with dapps and execute blockchain transactions through browser wallets. Think of it as "hands for your AI" in the crypto world.

## The Problem

AI agents are getting smarter, but they can't interact with Web3:
- They can't connect to Uniswap and swap tokens
- They can't claim airdrops or interact with DeFi protocols
- They can't execute on-chain strategies autonomously

You end up copy-pasting between your AI and your wallet. Slow. Error-prone. Not scalable.

## The Solution

WalletPilot bridges the gap. It lets AI agents:

1. **Control browser wallets** — MetaMask, Phantom, Trust Wallet, and 7 more
2. **Execute transactions** — Swaps, sends, signatures, contract interactions
3. **Stay within guardrails** — Spend limits, chain allowlists, protocol restrictions

```
You: "Swap $50 of ETH to USDC on Uniswap"
Agent: [Connects to Uniswap] → [Executes swap] → [Confirms transaction]
Agent: "Done. Swapped 0.02 ETH for 49.87 USDC. Tx: 0x1a2b..."
```

## How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   AI Agent  │────▶│ WalletPilot │────▶│   Browser   │
│  (OpenClaw) │     │   (Guard)   │     │   Wallet    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ permissions │
                    │    .json    │
                    └─────────────┘
```

1. Agent requests an action (e.g., "swap 0.1 ETH for USDC")
2. WalletPilot checks the request against your permission rules
3. If allowed, it controls the browser wallet to execute
4. Transaction is logged and result returned to agent

## Supported Wallets

| Wallet | EVM | Solana | Users |
|--------|:---:|:------:|------:|
| MetaMask | ✅ | - | 100M+ |
| Phantom | ✅ | ✅ | 3M+ |
| Trust Wallet | ✅ | ✅ | 1M+ |
| OKX Wallet | ✅ | ✅ | 1M+ |
| Rabby | ✅ | - | 1M+ |
| Coinbase Wallet | ✅ | - | 1M+ |
| Rainbow | ✅ | - | 500K+ |
| Backpack | ✅ | ✅ | 500K+ |
| Zerion | ✅ | ✅ | 100K+ |
| Exodus | ✅ | ✅ | 100K+ |

## Quick Start

### 1. Install

```bash
git clone https://github.com/andreolf/wallet-pilot
cd wallet-pilot
npm install
npx playwright install chromium
```

### 2. Setup Wallet

```bash
npm run setup
```

This opens a browser where you create a **NEW wallet** for your agent. Never use your main wallet.

### 3. Configure Permissions

Edit `permissions.json`:

```json
{
  "constraints": {
    "spendLimit": {
      "daily": "50000000",     // $50/day max
      "perTx": "10000000"      // $10/tx max
    },
    "allowedChains": [1, 137, 8453],
    "allowedProtocols": [
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"  // Uniswap
    ]
  }
}
```

### 4. Run

```bash
# Connect to a dapp
npm run dev connect https://app.uniswap.org

# Check balance
npm run dev balance

# View history
npm run dev history
```

## Permission Guardrails

WalletPilot never executes without checking permissions first:

| Guardrail | What it does |
|-----------|--------------|
| **Spend Limits** | Cap daily and per-transaction USD value |
| **Chain Allowlist** | Only permit specific chains (Ethereum, Polygon, etc.) |
| **Protocol Allowlist** | Only permit specific contracts (Uniswap, 1inch, etc.) |
| **Method Blocking** | Block risky functions (unlimited approvals, etc.) |
| **Approval Threshold** | Require manual approval above $X |
| **Full Logging** | Every action is logged with intent and outcome |
| **Instant Revocation** | Set `"revoked": true` to kill switch |

## Use Cases

### DeFi Automation
```
"Check my positions on Aave. If health factor < 1.5, repay 10% of my debt."
```

### Trading Agents
```
"When ETH drops below $2000, swap 500 USDC for ETH on Uniswap."
```

### Portfolio Management
```
"Rebalance my portfolio to 50% ETH, 30% stables, 20% alts."
```

### Airdrop Farming
```
"Connect to Arbitrum Bridge and bridge 0.1 ETH. Then interact with these 5 protocols."
```

## Security Model

⚠️ **WalletPilot uses a separate wallet in an isolated browser profile.**

- Your main wallet is never touched
- Agent wallet has limited funds (you control how much)
- All actions are logged
- Spend limits prevent runaway losses
- You can revoke permissions instantly

This is defense-in-depth. Even if something goes wrong, the blast radius is limited.

## Configuration

### Choose Your Wallet

Edit `config.json`:

```json
{
  "wallet": {
    "provider": "phantom"  // metamask, rabby, trust, okx, etc.
  }
}
```

### Full Permission Schema

```json
{
  "version": "1.0",
  "wallet": "0x...",
  "constraints": {
    "spendLimit": {
      "daily": "100000000",      // $100 in 6 decimals
      "perTx": "25000000",       // $25 max per tx
      "token": "0xA0b8..."       // Reference token (USDC)
    },
    "allowedChains": [1, 137, 42161, 10, 8453],
    "allowedProtocols": [
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",  // Uniswap
      "0x1111111254EEB25477B68fb85Ed929f73A960582"   // 1inch
    ],
    "allowedActions": ["connect", "swap", "send", "sign", "balance"],
    "blockedMethods": ["approve"],  // Block unlimited approvals
    "requireApproval": {
      "above": "50000000",  // Manual approval above $50
      "methods": ["multicall", "execute"]
    }
  },
  "expiry": "2025-12-31T00:00:00Z",
  "revoked": false
}
```

## Roadmap

- [x] 10 wallet adapters
- [x] Permission guardrails
- [x] Transaction logging
- [ ] Real-time price feeds
- [ ] Telegram/Discord notifications
- [ ] On-chain permission attestations (Gator integration)
- [ ] Multi-sig support
- [ ] Hardware wallet support

## Contributing

PRs welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

Key areas:
- **New wallet adapters** — Add support for more wallets
- **Better selectors** — Wallet UIs change, selectors need updates
- **Price feeds** — More accurate USD estimation
- **Tests** — More coverage for guard logic

## License

MIT

## Links

- [GitHub](https://github.com/andreolf/wallet-pilot)
- [ClawHub Skill](https://clawhub.ai/skills/walletpilot)
- [Website](https://walletpilot.dev)

---

Built for the AI agent revolution. 🤖💰
