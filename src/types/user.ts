import type { User } from '@prisma/client';

export type SafeUser = Pick<User, 'id' | 'email' | 'name' | 'role'>;
