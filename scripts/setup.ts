import { existsSync, mkdirSync, copyFileSync, readdirSync } from "fs";
import { homedir, platform } from "os";
import { join, dirname } from "path";
import { chromium } from "playwright";
import { getSupportedWallets, getWalletAdapter } from "../src/wallets/index.js";

const WALLET_PILOT_DIR = join(homedir(), ".wallet-pilot");
const PROFILE_DIR = join(WALLET_PILOT_DIR, "chrome-profile");
const EXTENSIONS_DIR = join(WALLET_PILOT_DIR, "extensions");

async function main() {
  console.log("\n🚀 WalletPilot Setup\n");

  // Create directories
  for (const dir of [WALLET_PILOT_DIR, PROFILE_DIR, EXTENSIONS_DIR]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
      console.log(`Created: ${dir}`);
    }
  }

  // Get wallet choice
  const wallets = getSupportedWallets();
  console.log("\nSupported wallets:");
  wallets.forEach((id, i) => {
    const adapter = getWalletAdapter(id);
    const solana = adapter.meta.supportsSolana ? " + Solana" : "";
    console.log(`  ${i + 1}. ${adapter.meta.name} (EVM${solana})`);
  });

  // For now, use first arg or default to metamask
  const walletArg = process.argv[2];
  const walletId = wallets.includes(walletArg as any) ? walletArg : "metamask";
  const adapter = getWalletAdapter(walletId as any);

  console.log(`\nSetting up: ${adapter.meta.name}`);

  // Try to find existing extension
  let extensionPath = findExtension(adapter.meta.extensionId);

  if (extensionPath) {
    console.log(`Found extension: ${extensionPath}`);
  } else {
    console.log(`\n⚠️  ${adapter.meta.name} extension not found.`);
    console.log(`\nPlease install ${adapter.meta.name} in Chrome first, then run setup again.`);
    console.log(`Or manually provide the extension path in config.json\n`);
  }

  // Launch browser for wallet setup
  console.log("\n📱 Launching browser for wallet setup...");
  console.log("   Please create or import a NEW wallet for agent use.");
  console.log("   DO NOT use your main wallet!\n");

  const args = ["--no-sandbox", "--disable-setuid-sandbox"];

  if (extensionPath) {
    args.push(`--disable-extensions-except=${extensionPath}`);
    args.push(`--load-extension=${extensionPath}`);
  }

  const browser = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    args,
    viewport: { width: 1280, height: 800 },
  });

  const page = browser.pages()[0] || (await browser.newPage());

  // Navigate to extension or show instructions
  if (extensionPath) {
    const extensionUrl = adapter.getExtensionUrl();
    await page.goto(extensionUrl).catch(() => {
      // Extension may not be ready yet
    });
  } else {
    await page.goto("https://google.com");
    await page.setContent(`
      <html>
        <body style="font-family: system-ui; padding: 40px; max-width: 600px; margin: 0 auto;">
          <h1>WalletPilot Setup</h1>
          <p>Please install the ${adapter.meta.name} extension:</p>
          <ol>
            <li>Open Chrome Web Store</li>
            <li>Search for "${adapter.meta.name}"</li>
            <li>Click "Add to Chrome"</li>
            <li>Complete wallet setup</li>
            <li>Close this browser when done</li>
          </ol>
          <p>After closing, run <code>npm run setup</code> again.</p>
        </body>
      </html>
    `);
  }

  console.log("Complete wallet setup in the browser, then close it.");
  console.log("Your profile will be saved for future automation.\n");

  // Wait for browser to close
  await new Promise<void>((resolve) => {
    browser.on("close", () => resolve());
  });

  console.log("\n✅ Setup complete!");
  console.log(`   Profile saved to: ${PROFILE_DIR}`);
  console.log(`\n   To use, run: npm run dev connect <dapp-url>\n`);
}

function findExtension(extensionId: string): string | null {
  const os = platform();

  let basePaths: string[] = [];

  if (os === "darwin") {
    basePaths = [
      join(homedir(), "Library/Application Support/Google/Chrome/Default/Extensions"),
      join(homedir(), "Library/Application Support/Google/Chrome Canary/Default/Extensions"),
      join(homedir(), "Library/Application Support/Chromium/Default/Extensions"),
    ];
  } else if (os === "linux") {
    basePaths = [
      join(homedir(), ".config/google-chrome/Default/Extensions"),
      join(homedir(), ".config/chromium/Default/Extensions"),
    ];
  } else if (os === "win32") {
    const localAppData = process.env.LOCALAPPDATA || join(homedir(), "AppData/Local");
    basePaths = [
      join(localAppData, "Google/Chrome/User Data/Default/Extensions"),
    ];
  }

  for (const basePath of basePaths) {
    const extPath = join(basePath, extensionId);
    if (existsSync(extPath)) {
      // Get latest version folder
      try {
        const versions = readdirSync(extPath).filter((d) => !d.startsWith("."));
        if (versions.length > 0) {
          versions.sort().reverse();
          return join(extPath, versions[0]);
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

main().catch((error) => {
  console.error("Setup failed:", error);
  process.exit(1);
});
