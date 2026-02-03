import { loadConfig, loadPermissions } from "./config.js";
import { BrowserManager } from "./browser.js";
import { WalletController } from "./wallet.js";
import { Guard } from "./guard.js";
import { printRecentLogs } from "./logger.js";
import { getWalletAdapter, getSupportedWallets } from "./wallets/index.js";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    printUsage();
    process.exit(1);
  }

  const config = loadConfig();
  const adapter = getWalletAdapter(config.walletProvider);

  console.log(`WalletPilot - Using ${adapter.meta.name}`);

  switch (command) {
    case "connect": {
      const dappUrl = args[1];
      if (!dappUrl) {
        console.error("Usage: connect <dapp-url>");
        process.exit(1);
      }

      const permissions = loadPermissions();
      const guard = new Guard(permissions);

      const actionResult = await guard.checkAction("connect");
      if (!actionResult.allowed) {
        console.error(JSON.stringify({ success: false, error: guard.formatRejection(actionResult) }));
        process.exit(1);
      }

      const browser = new BrowserManager(config);
      await browser.launch(adapter);

      const wallet = new WalletController(browser, config);
      await wallet.connectToDapp(dappUrl);

      console.log("WalletPilot Agent initialized");
      console.log(`Connected via: ${adapter.meta.name}`);

      // Keep browser open
      await new Promise(() => {});
      break;
    }

    case "balance": {
      console.log("Balance check not yet implemented");
      break;
    }

    case "history": {
      const count = parseInt(args[1]) || 10;
      printRecentLogs(count);
      break;
    }

    case "wallets": {
      console.log("\nSupported wallets:");
      for (const id of getSupportedWallets()) {
        const a = getWalletAdapter(id);
        const solana = a.meta.supportsSolana ? " + Solana" : "";
        console.log(`  - ${id}: ${a.meta.name} (EVM${solana})`);
      }
      console.log("");
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage() {
  console.log(`
WalletPilot - Universal Browser Wallet Automation

Usage:
  npx tsx src/index.ts <command> [args]

Commands:
  connect <dapp-url>    Connect to a dapp
  balance [token]       Check wallet balance
  history [count]       Show transaction history
  wallets               List supported wallets

Configuration:
  Set wallet provider in config.json:
  { "wallet": { "provider": "metamask" } }

  Supported: metamask, rabby, coinbase, rainbow, phantom
`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
