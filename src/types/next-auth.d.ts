import 'next-auth';
import { UserRole, AdminPermissions } from '@/models/user.interface';

declare module 'next-auth' {
  interface User {
    id: string;
    role?: UserRole;
    adminPermissions?: AdminPermissions;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
      adminPermissions?: AdminPermissions;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    adminPermissions?: AdminPermissions;
  }
}
