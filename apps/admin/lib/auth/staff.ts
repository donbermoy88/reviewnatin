import { STAFF_ROLES, type StaffRole } from './roles';

const STAFF_SET = new Set<string>(STAFF_ROLES);

export function isStaffRole(role: string | null | undefined): role is StaffRole {
  return !!role && STAFF_SET.has(role);
}

export { STAFF_ROLES };
