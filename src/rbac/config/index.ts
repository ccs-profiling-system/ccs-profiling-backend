/**
 * RBAC Configuration Module
 * 
 * Exports permission configuration and validation utilities.
 */

export {
  permissionConfig,
  getPermissionsForRole,
  getAllRoles,
  isValidRole,
} from './permissions.config';

export {
  validatePermissionConfig,
  getValidationSummary,
  PermissionConfigValidationError,
} from './validator';

export {
  startHotReload,
  stopHotReload,
  onReload,
  isHotReloadActive,
  manualReload,
} from './hot-reload';
