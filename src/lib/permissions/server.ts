import { cache } from 'react';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { type Permission, getAllUserPermissions } from '@/lib/permissions/types';
export const getUserPermissions = cache(async (): Promise<Permission[]> => {
  const session = await auth();
  if (!session?.user) {
    return [];
  }
  return getAllUserPermissions(session.user.role, session.user.adminPermissions);
});
export async function hasPermission(permission: Permission): Promise<boolean> {
  const permissions = await getUserPermissions();
  return permissions.includes(permission);
}
export async function hasAnyPermission(requiredPermissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions();
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}
export async function hasAllPermissions(requiredPermissions: Permission[]): Promise<boolean> {
  const userPermissions = await getUserPermissions();
  return requiredPermissions.every(permission => userPermissions.includes(permission));
}
