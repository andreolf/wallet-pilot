import { chromium, type BrowserContext, type Page } from "playwright";
import { existsSync } from "fs";
import type { Config } from "./config.js";
import type { BrowserState } from "./types.js";
import type { WalletAdapter } from "./wallets/index.js";

export class BrowserManager {
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: Config;
  private extensionId: string | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  async launch(adapter: WalletAdapter): Promise<void> {
    // Determine extension path
    let extensionPath = this.config.extensionPath;

    if (!extensionPath) {
      // Try to find extension in default location
      const defaultPath = adapter.meta.defaultExtensionPaths.mac.replace("~", process.env.HOME || "");
      if (existsSync(defaultPath)) {
        // Find latest version folder
        const { readdirSync } = await import("fs");
        const versions = readdirSync(defaultPath).filter(
          (d) => !d.startsWith(".")
        );
        if (versions.length > 0) {
          versions.sort().reverse();
          extensionPath = `${defaultPath}/${versions[0]}`;
        }
      }
    }

    if (!extensionPath || !existsSync(extensionPath)) {
      console.warn(
        `Extension not found. Run setup to copy ${adapter.meta.name} extension.`
      );
    }

    const args = [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ];

    if (extensionPath) {
      args.push(`--disable-extensions-except=${extensionPath}`);
      args.push(`--load-extension=${extensionPath}`);
    }

    this.context = await chromium.launchPersistentContext(
      this.config.profilePath,
      {
        headless: false,
        args,
        viewport: { width: 1280, height: 800 },
        timeout: this.config.navigationTimeout,
      }
    );

    // Get or create page
    const pages = this.context.pages();
    this.page = pages.length > 0 ? pages[0] : await this.context.newPage();

    // Store extension ID for popup detection
    this.extensionId = adapter.meta.extensionId;

    console.log(`Browser launched with ${adapter.meta.name} extension`);
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) {
      throw new Error("Browser not launched");
    }

    await this.page.goto(url, {
      timeout: this.config.navigationTimeout,
      waitUntil: "domcontentloaded",
    });

    console.log(`Navigated to: ${url}`);
  }

  async openWalletExtension(adapter: WalletAdapter): Promise<Page> {
    if (!this.context) {
      throw new Error("Browser not launched");
    }

    const extensionUrl = adapter.getExtensionUrl();

    // Check if already open
    for (const page of this.context.pages()) {
      if (page.url().includes(adapter.meta.extensionId)) {
        await page.bringToFront();
        return page;
      }
    }

    // Open new tab
    const walletPage = await this.context.newPage();
    await walletPage.goto(extensionUrl, {
      timeout: this.config.navigationTimeout,
    });

    return walletPage;
  }

  async waitForWalletPopup(timeout?: number): Promise<Page> {
    if (!this.context || !this.extensionId) {
      throw new Error("Browser not launched");
    }

    const actualTimeout = timeout ?? this.config.popupTimeout;

    // Wait for popup window
    const popup = await this.context.waitForEvent("page", {
      timeout: actualTimeout,
      predicate: (page) => page.url().includes(this.extensionId!),
    });

    await popup.waitForLoadState("domcontentloaded");
    return popup;
  }

  getPage(): Page | null {
    return this.page;
  }

  getState(): BrowserState {
    return {
      isRunning: this.context !== null,
      currentUrl: this.page?.url() ?? null,
      hasWalletPopup: false,
    };
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
      this.page = null;
      this.extensionId = null;
      console.log("Browser closed");
    }
  }
}
