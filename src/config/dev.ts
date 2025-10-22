import { UserRole } from '@prisma/client';

export const DEV_CONFIG = {
  // Organização padrão para desenvolvimento
  DEFAULT_ORGANIZATION: {
    id: '452c0b35-1822-4890-851e-922356c812fb',
    name: 'Krav Maga Academy',
    slug: 'academia'
  },

  // Usuário padrão (sem necessidade de login)
  DEFAULT_USER: {
    id: 'de5b9ba7-a5a2-4155-9277-35de0ec53fa1', // admin@academia.demo
    email: 'admin@academia.demo',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    organizationId: '452c0b35-1822-4890-851e-922356c812fb'
  },

  // Flag para indicar se estamos em modo desenvolvimento
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production'
};

/**
 * Função helper para obter organizationId padrão
 */
export function getDefaultOrganizationId(): string {
  return DEV_CONFIG.DEFAULT_ORGANIZATION.id;
}

/**
 * Função helper para obter usuário padrão
 */
export function getDefaultUser() {
  return DEV_CONFIG.DEFAULT_USER;
}