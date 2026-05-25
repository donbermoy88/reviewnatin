export const STAFF_ROLES = ['admin', 'content_reviewer', 'content_author'] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];
