/**
 * Permission Configuration Hot-Reloading
 * 
 * Provides hot-reloading capability for permission configuration in development mode.
 * Watches the permissions.config.ts file for changes and reloads the configuration
 * without requiring a server restart.
 * 
 * IMPORTANT: This feature is only enabled in development mode for security reasons.
 * Production environments should not allow runtime permission changes.
 */

import * as fs from 'fs';
import * as path from 'path';
import { validatePermissionConfig } from './validator';

/**
 * Hot-reload configuration
 */
interface HotReloadConfig {
  enabled: boolean;
  watchPath: string;
  debounceMs: number;
}

/**
 * Hot-reload state
 */
let isWatching = false;
let watcher: fs.FSWatcher | null = null;
let reloadTimeout: NodeJS.Timeout | null = null;

/**
 * Callback function type for configuration reload events
 */
type ReloadCallback = () => void;

/**
 * Registered callbacks for reload events
 */
const reloadCallbacks: ReloadCallback[] = [];

/**
 * Check if hot-reloading should be enabled
 * 
 * Hot-reloading is only enabled when:
 * - NODE_ENV is 'development'
 * - RBAC_HOT_RELOAD is not explicitly set to 'false'
 * 
 * @returns true if hot-reloading should be enabled
 */
function shouldEnableHotReload(): boolean {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const hotReloadEnv = process.env.RBAC_HOT_RELOAD;

  // Explicitly disabled
  if (hotReloadEnv === 'false') {
    return false;
  }

  // Only enable in development
  return nodeEnv === 'development';
}

/**
 * Get hot-reload configuration
 * 
 * @returns HotReloadConfig object
 */
function getHotReloadConfig(): HotReloadConfig {
  const configPath = path.join(__dirname, 'permissions.config.ts');
  
  return {
    enabled: shouldEnableHotReload(),
    watchPath: configPath,
    debounceMs: 500, // Wait 500ms after last change before reloading
  };
}

/**
 * Clear the module cache for the permissions configuration
 * 
 * This allows Node.js to re-import the module with fresh content
 */
function clearPermissionConfigCache(): void {
  const configPath = path.join(__dirname, 'permissions.config.ts');
  const jsPath = configPath.replace('.ts', '.js');
  
  // Delete from require cache
  delete require.cache[require.resolve('./permissions.config')];
  
  // Also try the compiled JS path
  if (require.cache[jsPath]) {
    delete require.cache[jsPath];
  }
}

/**
 * Reload the permission configuration
 * 
 * Clears the module cache and re-imports the configuration.
 * Validates the new configuration before applying it.
 * 
 * @throws Error if the new configuration is invalid
 */
async function reloadPermissionConfig(): Promise<void> {
  try {
    console.log('🔄 Reloading permission configuration...');

    // Clear the module cache
    clearPermissionConfigCache();

    // Re-import the configuration
    const { permissionConfig } = await import('./permissions.config');

    // Validate the new configuration
    validatePermissionConfig(permissionConfig);

    // Notify all registered callbacks
    for (const callback of reloadCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Error in reload callback:', error);
      }
    }

    console.log('✓ Permission configuration reloaded successfully');
  } catch (error) {
    console.error('✗ Failed to reload permission configuration:', error);
    throw error;
  }
}

/**
 * Handle file change event with debouncing
 * 
 * @param eventType - The type of file system event
 * @param filename - The name of the file that changed
 */
function handleFileChange(eventType: string, filename: string | null): void {
  if (!filename || eventType !== 'change') {
    return;
  }

  // Clear existing timeout
  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
  }

  // Debounce: wait for changes to settle before reloading
  reloadTimeout = setTimeout(() => {
    reloadPermissionConfig().catch((error) => {
      console.error('Hot-reload failed:', error);
    });
  }, getHotReloadConfig().debounceMs);
}

/**
 * Start watching the permission configuration file for changes
 * 
 * Only works in development mode. In production, this function does nothing.
 * 
 * @example
 * ```typescript
 * // In your app initialization
 * startHotReload();
 * ```
 */
export function startHotReload(): void {
  const config = getHotReloadConfig();

  if (!config.enabled) {
    console.log('ℹ Hot-reload disabled (not in development mode)');
    return;
  }

  if (isWatching) {
    console.log('ℹ Hot-reload already active');
    return;
  }

  try {
    // Check if the file exists
    if (!fs.existsSync(config.watchPath)) {
      console.warn(`⚠ Cannot start hot-reload: file not found at ${config.watchPath}`);
      return;
    }

    // Start watching
    watcher = fs.watch(config.watchPath, handleFileChange);
    isWatching = true;

    console.log(`🔥 Hot-reload enabled for permission configuration`);
    console.log(`   Watching: ${config.watchPath}`);
  } catch (error) {
    console.error('Failed to start hot-reload:', error);
  }
}

/**
 * Stop watching the permission configuration file
 * 
 * Cleans up the file watcher and any pending reload timeouts.
 * 
 * @example
 * ```typescript
 * // On application shutdown
 * stopHotReload();
 * ```
 */
export function stopHotReload(): void {
  if (reloadTimeout) {
    clearTimeout(reloadTimeout);
    reloadTimeout = null;
  }

  if (watcher) {
    watcher.close();
    watcher = null;
  }

  isWatching = false;
  console.log('🔥 Hot-reload stopped');
}

/**
 * Register a callback to be called when configuration is reloaded
 * 
 * Useful for clearing caches or reinitializing services that depend
 * on the permission configuration.
 * 
 * @param callback - Function to call on reload
 * 
 * @example
 * ```typescript
 * onReload(() => {
 *   console.log('Permission config reloaded, clearing cache...');
 *   permissionCache.clear();
 * });
 * ```
 */
export function onReload(callback: ReloadCallback): void {
  reloadCallbacks.push(callback);
}

/**
 * Check if hot-reload is currently active
 * 
 * @returns true if hot-reload is watching for changes
 */
export function isHotReloadActive(): boolean {
  return isWatching;
}

/**
 * Manually trigger a configuration reload
 * 
 * Useful for testing or forcing a reload without file changes.
 * 
 * @example
 * ```typescript
 * await manualReload();
 * ```
 */
export async function manualReload(): Promise<void> {
  if (!shouldEnableHotReload()) {
    throw new Error('Manual reload is only available in development mode');
  }

  await reloadPermissionConfig();
}
