// @ts-nocheck
import { FastifyInstance } from 'fastify';

// Tipos baseados na documentação da API Asaas
export interface AsaasCustomerData {
  name: string;
  cpfCnpj: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
  additionalEmails?: string;
}

export interface AsaasPaymentData {
  customer: string; // ID do customer no Asaas
  billingType: 'CREDIT_CARD' | 'PIX' | 'BOLETO' | 'BANK_TRANSFER';
  value: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  externalReference?: string;
  installmentCount?: number;
  totalValue?: number;
  interest?: {
    value: number;
  };
  fine?: {
    value: number;
  };
  discount?: {
    value: number;
    dueDateLimitDays: number;
  };
}

export interface AsaasCustomerResponse {
  object: 'customer';
  id: string;
  dateCreated: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string; // Neighborhood
  postalCode?: string;
  city?: string;
  state?: string;
  country?: string;
  observations?: string;
}

export interface AsaasPaymentResponse {
  object: 'payment';
  id: string;
  dateCreated: string;
  customer: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'CANCELLED';
  value: number;
  netValue: number;
  billingType: string;
  dueDate: string;
  // ... outros campos
}

export interface AsaasWebhookPayload {
  id: string;
  event: 'PAYMENT_CREATED' | 'PAYMENT_RECEIVED' | 'PAYMENT_CONFIRMED' | 'PAYMENT_OVERDUE' | 'PAYMENT_DELETED';
  payment?: AsaasPaymentResponse;
  // ... outros campos
}

export class AsaasService {
  private baseUrl: string;
  private apiKey: string;
  private isSandbox: boolean;

  constructor(apiKey: string, isSandbox = true) {
    this.apiKey = apiKey;
    this.isSandbox = isSandbox;
    this.baseUrl = isSandbox
      ? 'https://api-sandbox.asaas.com/v3'
      : 'https://api.asaas.com/v3';
  }

  async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json',
        'User-Agent': 'KravMagaAcademy/1.0'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Asaas API Error: ${response.status} - ${errorData}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Asaas API Request Failed:', error);
      throw error;
    }
  }

  // ==========================================
  // CUSTOMER MANAGEMENT
  // ==========================================

  async createCustomer(customerData: AsaasCustomerData): Promise<AsaasCustomerResponse> {
    return this.makeRequest<AsaasCustomerResponse>('/customers', 'POST', customerData);
  }

  async getCustomer(customerId: string): Promise<AsaasCustomerResponse> {
    return this.makeRequest<AsaasCustomerResponse>(`/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, customerData: Partial<AsaasCustomerData>): Promise<AsaasCustomerResponse> {
    return this.makeRequest<AsaasCustomerResponse>(`/customers/${customerId}`, 'PUT', customerData);
  }

  async listCustomers(params?: {
    offset?: number;
    limit?: number;
    name?: string;
    email?: string;
    cpfCnpj?: string;
  }): Promise<{ data: AsaasCustomerResponse[]; hasMore: boolean; totalCount: number; }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/customers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  // ==========================================
  // PAYMENT MANAGEMENT
  // ==========================================

  async createPayment(paymentData: AsaasPaymentData): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>('/payments', 'POST', paymentData);
  }

  async getPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>(`/payments/${paymentId}`);
  }

  async listPayments(params?: {
    offset?: number;
    limit?: number;
    customer?: string;
    status?: string;
    billingType?: string;
    subscription?: string;
    installment?: string;
    externalReference?: string;
    paymentDate?: string;
    estimatedCreditDate?: string;
    dueDate?: string;
    user?: string;
  }): Promise<{ data: AsaasPaymentResponse[]; hasMore: boolean; totalCount: number; }> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/payments${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  async cancelPayment(paymentId: string): Promise<AsaasPaymentResponse> {
    return this.makeRequest<AsaasPaymentResponse>(`/payments/${paymentId}`, 'DELETE');
  }

  // ==========================================
  // SUBSCRIPTION MANAGEMENT
  // ==========================================

  async createSubscription(subscriptionData: {
    customer: string;
    billingType: string;
    value: number;
    nextDueDate: string;
    cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
    description?: string;
    endDate?: string;
    maxPayments?: number;
    externalReference?: string;
  }): Promise<any> {
    return this.makeRequest('/subscriptions', 'POST', subscriptionData);
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    return this.makeRequest(`/subscriptions/${subscriptionId}`);
  }

  async listSubscriptions(params?: {
    offset?: number;
    limit?: number;
    customer?: string;
    status?: string;
    deletedOnly?: boolean;
    includeDeleted?: boolean;
    externalReference?: string;
  }): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/subscriptions${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return this.makeRequest(endpoint);
  }

  // ==========================================
  // WEBHOOK UTILITIES
  // ==========================================

  validateWebhook(payload: string, signature: string, secret: string): boolean {
    // Implementar validação de webhook conforme documentação Asaas
    // Por enquanto, retorna true para desenvolvimento
    return true;
  }

  parseWebhookPayload(payload: string): AsaasWebhookPayload {
    try {
      return JSON.parse(payload);
    } catch (error) {
      throw new Error('Invalid webhook payload format');
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  calculateDueDate(startDate: Date, billingType: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'): Date {
    const dueDate = new Date(startDate);

    switch (billingType) {
      case 'MONTHLY':
        dueDate.setMonth(dueDate.getMonth() + 1);
        break;
      case 'QUARTERLY':
        dueDate.setMonth(dueDate.getMonth() + 3);
        break;
      case 'YEARLY':
        dueDate.setFullYear(dueDate.getFullYear() + 1);
        break;
    }

    return dueDate;
  }
}

export default AsaasService;