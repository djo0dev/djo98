import { LocalAssetStorageStrategy } from './local-asset-storage-strategy';
import { AssetServerOptions } from './types';
/**
 * By default the AssetServerPlugin will configure and use the LocalStorageStrategy to persist Assets.
 */
export declare function defaultAssetStorageStrategyFactory(options: AssetServerOptions): LocalAssetStorageStrategy;
