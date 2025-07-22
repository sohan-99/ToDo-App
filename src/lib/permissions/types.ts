import { UserRole, AdminPermissions } from '@/models/user.interface';
export type Permission =
  | 'users:view'
  | 'users:create'
  | 'users:update'
  | 'users:delete'
  | 'users:promote'
  | 'roles:manage'
  | 'todos:view'
  | 'todos:create'
  | 'todos:update'
  | 'todos:delete'
  | 'todos:view-all'
  | 'todos:manage-all'
  | 'dashboard:view'
  | 'admin:access'
  | 'super-admin:access';
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
export function getAllUserPermissions(
  role: UserRole | undefined,
  adminPermissions?: AdminPermissions
): Permission[] {
  if (!role) return [];
  const basePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
  const adminSpecificPermissions = role === 'admin' ? getAdminPermissions(adminPermissions) : [];
  return [...new Set([...basePermissions, ...adminSpecificPermissions])];
}
