import type { WalletAdapter } from "./adapter.js";
import { MetaMaskAdapter } from "./metamask.js";
import { RabbyAdapter } from "./rabby.js";
import { CoinbaseWalletAdapter } from "./coinbase.js";
import { RainbowAdapter } from "./rainbow.js";
import { PhantomAdapter } from "./phantom.js";
import { TrustWalletAdapter } from "./trust.js";
import { ZerionAdapter } from "./zerion.js";
import { ExodusAdapter } from "./exodus.js";
import { OKXWalletAdapter } from "./okx.js";
import { BackpackAdapter } from "./backpack.js";

export type WalletProviderId =
  | "metamask"
  | "rabby"
  | "coinbase"
  | "rainbow"
  | "phantom"
  | "trust"
  | "zerion"
  | "exodus"
  | "okx"
  | "backpack";

const adapters: Record<WalletProviderId, () => WalletAdapter> = {
  metamask: () => new MetaMaskAdapter(),
  rabby: () => new RabbyAdapter(),
  coinbase: () => new CoinbaseWalletAdapter(),
  rainbow: () => new RainbowAdapter(),
  phantom: () => new PhantomAdapter(),
  trust: () => new TrustWalletAdapter(),
  zerion: () => new ZerionAdapter(),
  exodus: () => new ExodusAdapter(),
  okx: () => new OKXWalletAdapter(),
  backpack: () => new BackpackAdapter(),
};

/**
 * Get a wallet adapter by provider ID
 */
export function getWalletAdapter(providerId: WalletProviderId): WalletAdapter {
  const factory = adapters[providerId];
  if (!factory) {
    throw new Error(
      `Unknown wallet provider: ${providerId}. Supported: ${Object.keys(adapters).join(", ")}`
    );
  }
  return factory();
}

/**
 * Get all available wallet adapters
 */
export function getAllWalletAdapters(): WalletAdapter[] {
  return Object.values(adapters).map((factory) => factory());
}

/**
 * Get list of supported wallet provider IDs
 */
export function getSupportedWallets(): WalletProviderId[] {
  return Object.keys(adapters) as WalletProviderId[];
}

/**
 * Check if a provider ID is valid
 */
export function isValidWalletProvider(providerId: string): providerId is WalletProviderId {
  return providerId in adapters;
}

// Re-export types
export type { WalletAdapter, WalletMeta, WalletSelectors } from "./adapter.js";
export { BaseWalletAdapter } from "./adapter.js";
