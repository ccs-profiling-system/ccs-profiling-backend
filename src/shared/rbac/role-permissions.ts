import { Role } from './roles';
import { Permission } from './permissions';

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [Permission.READ_USERS, Permission.WRITE_USERS, Permission.DELETE_USERS],
  [Role.STUDENT]: [Permission.READ_USERS],
  [Role.FACULTY]: [Permission.READ_USERS, Permission.WRITE_USERS],
};
