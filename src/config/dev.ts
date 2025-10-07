import { UserRole } from '@prisma/client';

export const DEV_CONFIG = {
  // Organização padrão para desenvolvimento
  DEFAULT_ORGANIZATION: {
    id: 'a55ad715-2eb0-493c-996c-bb0f60bacec9',
    name: 'Academia Demo',
    slug: 'demo'
  },

  // Usuário padrão (sem necessidade de login)
  DEFAULT_USER: {
    id: 'de5b9ba7-a5a2-4155-9277-35de0ec53fa1', // admin@academia.demo
    email: 'admin@academia.demo',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.ADMIN,
    organizationId: 'a55ad715-2eb0-493c-996c-bb0f60bacec9'
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