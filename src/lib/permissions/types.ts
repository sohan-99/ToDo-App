import { UserRole, AdminPermissions } from '@/models/user.interface';

// Define all possible permissions in the system
export type Permission =
  // User management permissions
  | 'users:view'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'users:promote'

  // Role management permissions
  | 'roles:manage'

  // Todo permissions
  | 'todos:view'
  | 'todos:create'
  | 'todos:update'
  | 'todos:delete'
  | 'todos:view-all'
  | 'todos:manage-all'

  // Dashboard permissions
  | 'dashboard:view'
  | 'admin:access'
  | 'super-admin:access';

// Define permission sets for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: ['todos:view', 'todos:create', 'todos:update', 'todos:delete', 'dashboard:view'],
  admin: [
    'todos:view',
    'todos:create',
    'todos:update',
    'todos:delete',
    'todos:view-all',
    'todos:manage-all',
    'dashboard:view',
    'admin:access',
    'users:view',
  ],
  'super-admin': [
    'todos:view',
    'todos:create',
    'todos:update',
    'todos:delete',
    'todos:view-all',
    'todos:manage-all',
    'dashboard:view',
    'admin:access',
    'super-admin:access',
    'users:view',
    'users:create',
    'users:update',
    'users:delete',
    'users:promote',
    'roles:manage',
  ],
};

// Map AdminPermissions to our permission system
export function getAdminPermissions(adminPermissions?: AdminPermissions): Permission[] {
  if (!adminPermissions) return [];

  const permissions: Permission[] = [];

  if (adminPermissions.canUpdateUserInfo) {
    permissions.push('users:update');
  }

  if (adminPermissions.canDeleteUsers) {
    permissions.push('users:delete');
  }

  return permissions;
}

// Get all permissions for a user based on role and adminPermissions
export function getAllUserPermissions(
  role: UserRole | undefined,
  adminPermissions?: AdminPermissions
): Permission[] {
  if (!role) return [];

  // Start with default permissions for the role
  const basePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];

  // Add any admin-specific permissions
  const adminSpecificPermissions = role === 'admin' ? getAdminPermissions(adminPermissions) : [];

  // Combine and deduplicate permissions
  return [...new Set([...basePermissions, ...adminSpecificPermissions])];
}
