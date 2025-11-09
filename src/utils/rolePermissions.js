/**
 * Role-based permissions utility
 * Defines what each role can do in the system
 */

export const ROLE_PERMISSIONS = {
  ADMIN: {
    canCreateOrders: true,
    canUpdateOrderStatus: true,
    canViewOrders: true,
    canGenerateBills: true,
    canViewBills: true,
    canManageMenu: true,
    canManageTables: true,
    canManageInventory: true,
    canViewAnalytics: true,
    canViewKitchen: true,
    canManageUsers: true,
  },
  MANAGER: {
    canCreateOrders: false,
    canUpdateOrderStatus: false,
    canViewOrders: true,
    canGenerateBills: false,
    canViewBills: true, // Allow managers to view bills for reporting
    canManageMenu: false,
    canManageTables: false,
    canManageInventory: false,
    canViewAnalytics: true,
    canViewKitchen: false,
    canManageUsers: false,
  },
  CASHIER: {
    canCreateOrders: true,
    canUpdateOrderStatus: true, // Allow cashiers to mark orders as completed
    canViewOrders: true,
    canGenerateBills: true,
    canViewBills: true,
    canManageMenu: false,
    canManageTables: true,
    canManageInventory: false,
    canViewAnalytics: false,
    canViewKitchen: false,
    canManageUsers: false,
  },
  KITCHEN: {
    canCreateOrders: false,
    canUpdateOrderStatus: true,
    canViewOrders: true,
    canGenerateBills: false,
    canViewBills: false,
    canManageMenu: false,
    canManageTables: false,
    canManageInventory: false,
    canViewAnalytics: false,
    canViewKitchen: true,
    canManageUsers: false,
  },
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role || !ROLE_PERMISSIONS[role]) {
    return false;
  }
  return ROLE_PERMISSIONS[role][permission] || false;
}

/**
 * Check if user can perform an action
 * @param {string} role - User role
 * @param {string} action - Action to check
 * @returns {boolean}
 */
export function can(role, action) {
  return hasPermission(role, action);
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {object}
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || {};
}

