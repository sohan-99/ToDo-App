import { cache } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { type Permission, getAllUserPermissions } from '@/lib/permissions/types';

// Cache the current user's permissions to avoid recalculating for each check
export const getUserPermissions = cache(async (): Promise<Permission[]> => {
  const session = await auth();

  if (!session?.user) {
    return [];
  }

  return getAllUserPermissions(session.user.role, session.user.adminPermissions);
});

// Check if the current user has a specific permission
export async function hasPermission(permission: Permission): Promise<boolean> {
  const permissions = await getUserPermissions();
  return permissions.includes(permission);
}

// Check if the current user has any of the specified permissions
export async function hasAnyPermission(requiredPermissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions();
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

// Check if the current user has all of the specified permissions
export async function hasAllPermissions(requiredPermissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions();
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}
