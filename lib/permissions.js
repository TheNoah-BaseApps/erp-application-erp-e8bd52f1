export function canEditProduct(role) {
  return ['admin', 'manager'].includes(role);
}

export function canDeleteProduct(role) {
  return ['admin', 'manager'].includes(role);
}

export function canCreateProduct(role) {
  return ['admin', 'manager'].includes(role);
}

export function canViewProducts(role) {
  return ['admin', 'manager', 'user', 'viewer'].includes(role);
}

export function isAdmin(role) {
  return role === 'admin';
}

export function isManager(role) {
  return role === 'manager';
}

export function hasPermission(role, permission) {
  const permissions = {
    admin: ['create', 'read', 'update', 'delete', 'manage_users'],
    manager: ['create', 'read', 'update', 'delete'],
    user: ['create', 'read', 'update'],
    viewer: ['read']
  };

  return permissions[role]?.includes(permission) || false;
}