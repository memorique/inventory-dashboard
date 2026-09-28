export type Role = "admin" | "manager" | "staff";

export interface Capabilities {
  canAdjustStock: boolean;
  canManageProducts: boolean;
  canDeleteProducts: boolean;
  canManageSuppliers: boolean;
  canManagePurchaseOrders: boolean;
  canManageSalesOrders: boolean;
  canFulfillOrders: boolean;
  canResetData: boolean;
  canManageUsers: boolean;
}

const ROLE_CAPABILITIES: Record<Role, Capabilities> = {
  staff: {
    canAdjustStock: true,
    canManageProducts: false,
    canDeleteProducts: false,
    canManageSuppliers: false,
    canManagePurchaseOrders: false,
    canManageSalesOrders: false,
    canFulfillOrders: true,
    canResetData: false,
    canManageUsers: false,
  },
  manager: {
    canAdjustStock: true,
    canManageProducts: true,
    canDeleteProducts: true,
    canManageSuppliers: true,
    canManagePurchaseOrders: true,
    canManageSalesOrders: true,
    canFulfillOrders: true,
    canResetData: false,
    canManageUsers: false,
  },
  admin: {
    canAdjustStock: true,
    canManageProducts: true,
    canDeleteProducts: true,
    canManageSuppliers: true,
    canManagePurchaseOrders: true,
    canManageSalesOrders: true,
    canFulfillOrders: true,
    canResetData: true,
    canManageUsers: true,
  },
};

const NO_CAPABILITIES: Capabilities = {
  canAdjustStock: false,
  canManageProducts: false,
  canDeleteProducts: false,
  canManageSuppliers: false,
  canManagePurchaseOrders: false,
  canManageSalesOrders: false,
  canFulfillOrders: false,
  canResetData: false,
  canManageUsers: false,
};

export function getCapabilities(role: Role | undefined): Capabilities {
  if (!role) return NO_CAPABILITIES;
  return ROLE_CAPABILITIES[role];
}

export function hasPermission(
  role: Role | undefined,
  capability: keyof Capabilities
): boolean {
  return getCapabilities(role)[capability];
}

export const roleLabels: Record<Role, string> = {
  admin: "Admin",
  manager: "Manager",
  staff: "Staff",
};
