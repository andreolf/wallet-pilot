import { readFileSync, existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { PermissionsSchema, type Permissions, type WalletConfig } from "./types.js";
import { isValidWalletProvider, type WalletProviderId } from "./wallets/index.js";

export interface Config {
  // Paths
  profilePath: string;
  logsPath: string;
  extensionPath: string | null;

  // Wallet
  walletProvider: WalletProviderId;

  // Timeouts
  popupTimeout: number;
  transactionTimeout: number;
  navigationTimeout: number;

  // Price API
  priceApiUrl: string;
  priceCacheTtl: number;
}

interface ConfigFile {
  wallet?: {
    provider?: string;
    extensionPath?: string | null;
  };
  paths?: {
    profile?: string;
    logs?: string;
  };
  timeouts?: {
    popup?: number;
    transaction?: number;
    navigation?: number;
  };
}

const DEFAULT_CONFIG: Config = {
  profilePath: join(homedir(), ".wallet-pilot", "chrome-profile"),
  logsPath: join(homedir(), ".wallet-pilot", "logs"),
  extensionPath: null,
  walletProvider: "metamask",
  popupTimeout: 30000,
  transactionTimeout: 120000,
  navigationTimeout: 30000,
  priceApiUrl: "https://api.coingecko.com/api/v3",
  priceCacheTtl: 60000, // 1 minute
};

export function loadConfig(configPath?: string): Config {
  const config = { ...DEFAULT_CONFIG };

  // Try to load config file
  const paths = [
    configPath,
    join(process.cwd(), "config.json"),
    join(homedir(), ".wallet-pilot", "config.json"),
  ].filter(Boolean) as string[];

  for (const path of paths) {
    if (existsSync(path)) {
      try {
        const raw = readFileSync(path, "utf-8");
        const parsed: ConfigFile = JSON.parse(raw);

        if (parsed.wallet?.provider) {
          if (isValidWalletProvider(parsed.wallet.provider)) {
            config.walletProvider = parsed.wallet.provider;
          } else {
            console.warn(`Unknown wallet provider: ${parsed.wallet.provider}, using default`);
          }
        }

        if (parsed.wallet?.extensionPath !== undefined) {
          config.extensionPath = parsed.wallet.extensionPath;
        }

        if (parsed.paths?.profile) {
          config.profilePath = parsed.paths.profile.replace("~", homedir());
        }

        if (parsed.paths?.logs) {
          config.logsPath = parsed.paths.logs.replace("~", homedir());
        }

        if (parsed.timeouts?.popup) {
          config.popupTimeout = parsed.timeouts.popup;
        }
        if (parsed.timeouts?.transaction) {
          config.transactionTimeout = parsed.timeouts.transaction;
        }
        if (parsed.timeouts?.navigation) {
          config.navigationTimeout = parsed.timeouts.navigation;
        }

        console.log(`Loaded config from ${path}`);
        break;
      } catch (error) {
        console.warn(`Failed to load config from ${path}:`, error);
      }
    }
  }

  return config;
}

export function loadPermissions(permissionsPath?: string): Permissions {
  const paths = [
    permissionsPath,
    join(process.cwd(), "permissions.json"),
    join(homedir(), ".wallet-pilot", "permissions.json"),
  ].filter(Boolean) as string[];

  for (const path of paths) {
    if (existsSync(path)) {
      try {
        const raw = readFileSync(path, "utf-8");
        const parsed = JSON.parse(raw);
        return PermissionsSchema.parse(parsed);
      } catch (error) {
        console.error(`Failed to load permissions from ${path}:`, error);
        throw new Error(`Invalid permissions file: ${path}`);
      }
    }
  }

  throw new Error(
    "No permissions.json found. Run `npm run setup` or create one manually."
  );
}
