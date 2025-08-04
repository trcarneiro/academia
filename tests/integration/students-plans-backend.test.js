const request = require('supertest');
const path = require('path');

// Configuração de teste
const TEST_PORT = 3001;
const BASE_URL = `http://localhost:${TEST_PORT}`;

describe('Testes de Estudantes e Planos - Backend', () => {
  let app;
  let server;
  let createdStudentId;
  let createdPlanId;

  beforeAll(async () => {
    // Configurar variáveis de ambiente para teste
    process.env.PORT = TEST_PORT;
    process.env.NODE_ENV = 'test';
    
    // Importar servidor
    const serverModule = require('../../servers/working-server');
    
    // Aguardar servidor iniciar
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  });

  afterAll(async () => {
    // Limpar recursos
    if (server && server.close) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  describe('Testes de Estudantes', () => {
    test('Deve criar um novo estudante', async () => {
      const newStudent = {
        firstName: 'Test',
        lastName: 'Student',
        email: `test${Date.now()}@example.com`,
        phone: '11999999999',
        birthDate: '1990-01-01',
        category: 'ADULT',
        status: 'ACTIVE'
      };

      const response = await request(BASE_URL)
        .post('/api/students')
        .send(newStudent)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.firstName).toBe(newStudent.firstName);
      expect(response.body.email).toBe(newStudent.email);
      
      createdStudentId = response.body.id;
    });

    test('Deve listar todos os estudantes', async () => {
      const response = await request(BASE_URL)
        .get('/api/students')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('Deve buscar estudante por ID', async () => {
      const response = await request(BASE_URL)
        .get(`/api/students/${createdStudentId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdStudentId);
      expect(response.body).toHaveProperty('firstName');
    });

    test('Deve atualizar estudante', async () => {
      const updatedData = {
        firstName: 'Updated',
        lastName: 'Student',
        email: `updated${Date.now()}@example.com`,
        phone: '11888888888',
        birthDate: '1990-01-01',
        category: 'ADULT',
        status: 'ACTIVE'
      };

      const response = await request(BASE_URL)
        .put(`/api/students/${createdStudentId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.firstName).toBe(updatedData.firstName);
      expect(response.body.email).toBe(updatedData.email);
    });
  });

  describe('Testes de Planos', () => {
    test('Deve criar um novo plano', async () => {
      const newPlan = {
        name: `Test Plan ${Date.now()}`,
        price: 100.00,
        billingCycle: 'MONTHLY',
        description: 'Test plan description',
        features: ['Feature 1', 'Feature 2']
      };

      const response = await request(BASE_URL)
        .post('/api/billing-plans')
        .send(newPlan)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newPlan.name);
      expect(response.body.price).toBe(newPlan.price);
      
      createdPlanId = response.body.id;
    });

    test('Deve listar todos os planos', async () => {
      const response = await request(BASE_URL)
        .get('/api/billing-plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('Deve buscar plano por ID', async () => {
      const response = await request(BASE_URL)
        .get(`/api/billing-plans/${createdPlanId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', createdPlanId);
      expect(response.body).toHaveProperty('name');
    });

    test('Deve atualizar plano', async () => {
      const updatedData = {
        name: `Updated Plan ${Date.now()}`,
        price: 150.00,
        billingCycle: 'QUARTERLY',
        description: 'Updated description',
        features: ['Updated Feature 1', 'Updated Feature 2']
      };

      const response = await request(BASE_URL)
        .put(`/api/billing-plans/${createdPlanId}`)
        .send(updatedData)
        .expect(200);

      expect(response.body.name).toBe(updatedData.name);
      expect(response.body.price).toBe(updatedData.price);
    });
  });

  describe('Testes de Integração Estudante-Plano', () => {
    test('Deve criar assinatura estudante-plano', async () => {
      const subscription = {
        studentId: createdStudentId,
        planId: createdPlanId,
        startDate: new Date().toISOString(),
        status: 'ACTIVE'
      };

      const response = await request(BASE_URL)
        .post('/api/subscriptions')
        .send(subscription)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.studentId).toBe(createdStudentId);
      expect(response.body.planId).toBe(createdPlanId);
    });

    test('Deve listar assinaturas do estudante', async () => {
      const response = await request(BASE_URL)
        .get(`/api/students/${createdStudentId}/subscriptions`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Testes de Validação', () => {
    test('Deve rejeitar estudante com email duplicado', async () => {
      const duplicateStudent = {
        firstName: 'Duplicate',
        lastName: 'Test',
        email: 'test@example.com',
        phone: '11999999999',
        birthDate: '1990-01-01',
        category: 'ADULT',
        status: 'ACTIVE'
      };

      await request(BASE_URL)
        .post('/api/students')
        .send(duplicateStudent)
        .expect(400);
    });

    test('Deve rejeitar plano com preço negativo', async () => {
      const invalidPlan = {
        name: 'Invalid Plan',
        price: -100,
        billingCycle: 'MONTHLY',
        description: 'Invalid plan'
      };

      await request(BASE_URL)
        .post('/api/billing-plans')
        .send(invalidPlan)
        .expect(400);
    });
  });

  describe('Testes de Health Check', () => {
    test('Deve retornar health check OK', async () => {
      const response = await request(BASE_URL)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
    });
  });
});
