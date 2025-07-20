import { UserRole, AdminPermissions } from '@/models/user.interface';

/**
 * Utility to check if a user has permission to perform specific actions based on their role
 */
export const RolePermissions = {
  /**
   * Check if user can view all users
   */
  canViewUsers: (role: UserRole | undefined): boolean => {
    return role === 'admin' || role === 'super-admin';
  },

  /**
   * Check if user can delete regular users
   */
  canDeleteRegularUsers: (
    role: UserRole | undefined,
    adminPermissions?: AdminPermissions
  ): boolean => {
    // Super-admins always have this permission
    if (role === 'super-admin') return true;
    // Admins need specific permission
    if (role === 'admin' && adminPermissions) {
      return adminPermissions.canDeleteUsers || false;
    }
    return false;
  },

  /**
   * Check if user can delete admin users
   */
  canDeleteAdminUsers: (role: UserRole | undefined): boolean => {
    // Only super-admins can delete admin users
    return role === 'super-admin';
  },

  /**
   * Check if user can promote users to admin role
   */
  canPromoteToAdmin: (role: UserRole | undefined): boolean => {
    // Only super-admins can promote to admin
    return role === 'super-admin';
  },

  /**
   * Check if user can promote users to super-admin role
   */
  canPromoteToSuperAdmin: (role: UserRole | undefined): boolean => {
    // Only super-admins can promote to super-admin
    return role === 'super-admin';
  },

  /**
   * Check if user can update user information (name and email)
   */
  canUpdateUserInfo: (role: UserRole | undefined, adminPermissions?: AdminPermissions): boolean => {
    // Super-admins always have this permission
    if (role === 'super-admin') return true;
    // Admins need specific permission
    if (role === 'admin' && adminPermissions) {
      return adminPermissions.canUpdateUserInfo || false;
    }
    return false;
  },

  /**
   * Check if user can delete users (admin permission)
   */
  canDeleteUsers: (role: UserRole | undefined, adminPermissions?: AdminPermissions): boolean => {
    if (role === 'super-admin') return true;
    if (role === 'admin' && adminPermissions) {
      return adminPermissions.canDeleteUsers || false;
    }
    return false;
  },
};
