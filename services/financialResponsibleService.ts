import { PrismaClient } from '@prisma/client';
import { AsaasService, AsaasCustomerData, AsaasCustomerResponse } from './asaasService';

const prisma = new PrismaClient();

export interface CreateFinancialResponsibleData {
  name: string;
  cpfCnpj: string;
  email: string;
  phone?: string;
  birthDate?: Date;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  relationshipType?: string;
}

export interface ImportAsaasCustomerData {
  asaasCustomerId: string;
  relationshipType?: string;
  studentIds?: string[];
}

export class FinancialResponsibleService {
  private organizationId: string;
  private asaasService: AsaasService;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
    
    // Get Asaas configuration from environment
    const asaasApiKey = process.env.ASAAS_API_KEY;
    const isSandbox = process.env.ASAAS_IS_SANDBOX === 'true';
    
    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not configured in environment variables');
    }
    
    this.asaasService = new AsaasService(asaasApiKey, isSandbox);
  }

  // ==========================================
  // FINANCIAL RESPONSIBLE MANAGEMENT
  // ==========================================

  async createFinancialResponsible(data: CreateFinancialResponsibleData) {
    return await prisma.financialResponsible.create({
      data: {
        ...data,
        organizationId: this.organizationId
      }
    });
  }

  async listFinancialResponsibles(filters?: {
    name?: string;
    email?: string;
    cpfCnpj?: string;
    isActive?: boolean;
  }) {
    return await prisma.financialResponsible.findMany({
      where: {
        organizationId: this.organizationId,
        ...filters
      },
      include: {
        students: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        asaasCustomer: true,
        _count: {
          select: {
            students: true,
            subscriptions: true,
            payments: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getFinancialResponsible(id: string) {
    return await prisma.financialResponsible.findUnique({
      where: { id },
      include: {
        students: {
          include: {
            user: true
          }
        },
        asaasCustomer: true,
        subscriptions: {
          include: {
            plan: true,
            student: {
              include: { user: true }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
  }

  // ==========================================
  // ASAAS INTEGRATION
  // ==========================================

  async listAsaasCustomers(params?: {
    offset?: number;
    limit?: number;
    name?: string;
    email?: string;
    cpfCnpj?: string;
  }) {
    return await this.asaasService.listCustomers(params);
  }

  async importAsaasCustomer(data: ImportAsaasCustomerData) {
    // Busca os dados do cliente no Asaas
    const asaasCustomer = await this.asaasService.getCustomer(data.asaasCustomerId);
    
    // Verifica se já existe um responsável financeiro com este CPF/CNPJ
    const existingResponsible = await prisma.financialResponsible.findFirst({
      where: {
        organizationId: this.organizationId,
        cpfCnpj: asaasCustomer.cpfCnpj
      }
    });

    if (existingResponsible) {
      throw new Error('Já existe um responsável financeiro com este CPF/CNPJ');
    }

    // Cria o responsável financeiro
    const financialResponsible = await prisma.financialResponsible.create({
      data: {
        organizationId: this.organizationId,
        name: asaasCustomer.name,
        cpfCnpj: asaasCustomer.cpfCnpj,
        email: asaasCustomer.email || '',
        phone: asaasCustomer.phone || asaasCustomer.mobilePhone,
        address: asaasCustomer.address,
        addressNumber: asaasCustomer.addressNumber,
        complement: asaasCustomer.complement,
        neighborhood: asaasCustomer.province,
        city: asaasCustomer.city,
        state: asaasCustomer.state,
        zipCode: asaasCustomer.postalCode,
        relationshipType: data.relationshipType || 'Responsável',
        asaasId: asaasCustomer.id
      }
    });

    // Cria ou atualiza o AsaasCustomer
    const asaasCustomerRecord = await prisma.asaasCustomer.upsert({
      where: { asaasId: asaasCustomer.id },
      update: {
        financialResponsibleId: financialResponsible.id,
        name: asaasCustomer.name,
        cpfCnpj: asaasCustomer.cpfCnpj,
        email: asaasCustomer.email,
        phone: asaasCustomer.phone,
        mobilePhone: asaasCustomer.mobilePhone,
        postalCode: asaasCustomer.postalCode,
        address: asaasCustomer.address,
        addressNumber: asaasCustomer.addressNumber,
        complement: asaasCustomer.complement,
        province: asaasCustomer.province,
        city: asaasCustomer.city,
        state: asaasCustomer.state
      },
      create: {
        organizationId: this.organizationId,
        financialResponsibleId: financialResponsible.id,
        asaasId: asaasCustomer.id,
        name: asaasCustomer.name,
        cpfCnpj: asaasCustomer.cpfCnpj,
        email: asaasCustomer.email,
        phone: asaasCustomer.phone,
        mobilePhone: asaasCustomer.mobilePhone,
        postalCode: asaasCustomer.postalCode,
        address: asaasCustomer.address,
        addressNumber: asaasCustomer.addressNumber,
        complement: asaasCustomer.complement,
        province: asaasCustomer.province,
        city: asaasCustomer.city,
        state: asaasCustomer.state
      }
    });

    // Atualiza o responsável com a referência do AsaasCustomer
    await prisma.financialResponsible.update({
      where: { id: financialResponsible.id },
      data: { asaasId: asaasCustomer.id }
    });

    // Se foram fornecidos IDs de estudantes, associa eles ao responsável
    if (data.studentIds && data.studentIds.length > 0) {
      await prisma.student.updateMany({
        where: {
          id: { in: data.studentIds },
          organizationId: this.organizationId
        },
        data: {
          financialResponsibleId: financialResponsible.id
        }
      });
    }

    return await this.getFinancialResponsible(financialResponsible.id);
  }

  // ==========================================
  // STUDENTS ASSOCIATION
  // ==========================================

  async associateStudents(financialResponsibleId: string, studentIds: string[]) {
    return await prisma.student.updateMany({
      where: {
        id: { in: studentIds },
        organizationId: this.organizationId
      },
      data: {
        financialResponsibleId
      }
    });
  }

  async removeStudentAssociation(studentId: string) {
    return await prisma.student.update({
      where: { id: studentId },
      data: {
        financialResponsibleId: null
      }
    });
  }

  // ==========================================
  // FINANCIAL SUMMARY
  // ==========================================

  async getFinancialSummary(financialResponsibleId: string) {
    const responsible = await this.getFinancialResponsible(financialResponsibleId);
    
    if (!responsible) {
      throw new Error('Responsável financeiro não encontrado');
    }

    // Busca estatísticas financeiras
    const [totalPending, totalPaid, overdue] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          financialResponsibleId,
          status: 'PENDING'
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          financialResponsibleId,
          status: 'PAID'
        },
        _sum: { amount: true }
      }),
      prisma.payment.count({
        where: {
          financialResponsibleId,
          status: 'PENDING',
          dueDate: { lt: new Date() }
        }
      })
    ]);

    return {
      responsible,
      financialSummary: {
        totalPending: totalPending._sum.amount || 0,
        totalPaid: totalPaid._sum.amount || 0,
        overdueCount: overdue,
        studentsCount: responsible.students.length,
        subscriptionsCount: responsible.subscriptions.length
      }
    };
  }
}

export default FinancialResponsibleService;