import { UserRole } from '@/models/user.interface';

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
  canDeleteRegularUsers: (role: UserRole | undefined): boolean => {
    return role === 'admin' || role === 'super-admin';
  },

  /**
   * Check if user can delete admin users
   */
  canDeleteAdminUsers: (role: UserRole | undefined): boolean => {
    return role === 'super-admin';
  },

  /**
   * Check if user can promote users to admin role
   */
  canPromoteToAdmin: (role: UserRole | undefined): boolean => {
    return role === 'super-admin';
  },

  /**
   * Check if user can promote users to super-admin role
   */
  canPromoteToSuperAdmin: (role: UserRole | undefined): boolean => {
    return role === 'super-admin';
  },

  /**
   * Check if user can update user information
   */
  canUpdateUserInfo: (role: UserRole | undefined): boolean => {
    return role === 'admin' || role === 'super-admin';
  },
};
