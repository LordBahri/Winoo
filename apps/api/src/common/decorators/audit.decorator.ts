import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit_action';

/**
 * Mark a controller method for audit logging.
 * @param action  A short, descriptive verb: 'pet.create', 'user.ban', etc.
 * @param resourceType  The DB model name: 'pets', 'users', etc.
 */
export const Audit = (action: string, resourceType?: string) =>
  SetMetadata(AUDIT_KEY, { action, resourceType });
