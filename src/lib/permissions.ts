import { UserRole, AdminPermissions } from '@/models/user.interface';
export const RolePermissions = {
  canManageAllTodos: (role: UserRole | undefined): boolean => {
    return role === 'super-admin';
  },
  canViewUsers: (role: UserRole | undefined): boolean => {
    return role === 'admin' || role === 'super-admin';
  },
  canDeleteRegularUsers: (
    role: UserRole | undefined,
    adminPermissions?: AdminPermissions
  ): boolean => {
    if (role === 'super-admin') return true;
    if (role === 'admin' && adminPermissions) {
      return adminPermissions.canDeleteUsers || false;
    }
    return false;
  },
  canDeleteAdminUsers: (role: UserRole | undefined): boolean => {
    return role === 'super-admin';
  },
  canPromoteToAdmin: (role: UserRole | undefined, adminPermissions?: AdminPermissions): boolean => {
    if (role === 'super-admin') return true;
    if (role === 'admin' && adminPermissions) {
      return adminPermissions.canPromoteToAdmin || false;
    }
    return false;
  },
  canPromoteToSuperAdmin: (role: UserRole | undefined): boolean => {
    return role === 'super-admin';
  },
  canDemoteAdmins: (role: UserRole | undefined, adminPermissions?: AdminPermissions): boolean => {
    if (role === 'super-admin') return true;
    if (role === 'admin' && adminPermissions) {
      return adminPermissions.canDemoteAdmins || false;
    }
    return false;
  },
  canUpdateUserInfo: (role: UserRole | undefined, adminPermissions?: AdminPermissions): boolean => {
    if (role === 'super-admin') return true;
    if (role === 'admin' && adminPermissions) {
      return adminPermissions.canUpdateUserInfo || false;
    }
    return false;
  },
  canDeleteUsers: (role: UserRole | undefined, adminPermissions?: AdminPermissions): boolean => {
    if (role === 'super-admin') return true;
    if (role === 'admin' && adminPermissions) {
      return adminPermissions.canDeleteUsers || false;
    }
    return false;
  },
};
