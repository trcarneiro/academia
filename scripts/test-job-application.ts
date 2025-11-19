/**
 * Script de Teste - Aplicação de Vagas
 *
 * Este script demonstra como:
 * 1. Fazer login na API
 * 2. Buscar vagas disponíveis
 * 3. Aplicar para uma vaga
 * 4. Verificar o status da aplicação
 *
 * Uso:
 *   npx ts-node scripts/test-job-application.ts
 */

import axios, { AxiosInstance } from 'axios';

// Configuração
const API_BASE_URL = process.env.API_URL || 'http://localhost:3000/api';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

// Cliente HTTP com interceptor para logs
const createApiClient = (token?: string): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  // Interceptor para log de requests
  client.interceptors.request.use(
    (config) => {
      console.log(`\n📤 ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('   Body:', JSON.stringify(config.data, null, 2));
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Interceptor para log de responses
  client.interceptors.response.use(
    (response) => {
      console.log(`✅ ${response.status} ${response.statusText}`);
      return response;
    },
    (error) => {
      console.log(`❌ ${error.response?.status} ${error.response?.statusText}`);
      console.log('   Error:', error.response?.data);
      return Promise.reject(error);
    }
  );

  return client;
};

// Tipos
interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      organizationId: string;
    };
  };
}

interface Job {
  id: string;
  title: string;
  description: string;
  type: string;
  level: string;
  location?: string;
  status: string;
  organization: {
    id: string;
    name: string;
  };
  unit?: {
    id: string;
    name: string;
    city: string;
  };
  _count: {
    applications: number;
  };
}

interface JobApplication {
  id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedAt: string;
  coverLetter?: string;
  resume?: string;
}

// Funções principais
async function login(email: string, password: string): Promise<string> {
  console.log('\n🔐 === FAZENDO LOGIN ===');
  console.log(`Email: ${email}`);

  const client = createApiClient();

  try {
    const response = await client.post<LoginResponse>('/auth/login', {
      email,
      password
    });

    if (response.data.success && response.data.data.token) {
      const user = response.data.data.user;
      console.log(`\n✅ Login bem-sucedido!`);
      console.log(`   Nome: ${user.firstName} ${user.lastName}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Organization: ${user.organizationId}`);
      return response.data.data.token;
    }

    throw new Error('Token não retornado na resposta');
  } catch (error: any) {
    console.error('\n❌ Erro ao fazer login:', error.message);
    if (error.response?.data) {
      console.error('Detalhes:', error.response.data);
    }
    throw error;
  }
}

async function listJobs(token: string): Promise<Job[]> {
  console.log('\n📋 === BUSCANDO VAGAS DISPONÍVEIS ===');

  const client = createApiClient(token);

  try {
    const response = await client.get<{ success: boolean; data: Job[]; total: number }>('/jobs');

    if (response.data.success) {
      const jobs = response.data.data;
      console.log(`\n✅ ${jobs.length} vaga(s) encontrada(s):`);

      jobs.forEach((job, index) => {
        console.log(`\n   ${index + 1}. ${job.title}`);
        console.log(`      ID: ${job.id}`);
        console.log(`      Tipo: ${job.type} | Nível: ${job.level}`);
        console.log(`      Localização: ${job.location || 'Não especificada'}`);
        console.log(`      Status: ${job.status}`);
        console.log(`      Organização: ${job.organization.name}`);
        if (job.unit) {
          console.log(`      Unidade: ${job.unit.name} - ${job.unit.city}`);
        }
        console.log(`      Candidaturas: ${job._count.applications}`);
      });

      return jobs;
    }

    return [];
  } catch (error: any) {
    console.error('\n❌ Erro ao buscar vagas:', error.message);
    return [];
  }
}

async function listPublicJobs(): Promise<Job[]> {
  console.log('\n🌐 === BUSCANDO VAGAS PÚBLICAS (SEM AUTENTICAÇÃO) ===');

  const client = createApiClient();

  try {
    const response = await client.get<{ success: boolean; data: Job[]; total: number }>('/jobs/public');

    if (response.data.success) {
      const jobs = response.data.data;
      console.log(`\n✅ ${jobs.length} vaga(s) pública(s) encontrada(s):`);

      jobs.forEach((job, index) => {
        console.log(`\n   ${index + 1}. ${job.title}`);
        console.log(`      ID: ${job.id}`);
        console.log(`      Tipo: ${job.type} | Nível: ${job.level}`);
        console.log(`      Organização: ${job.organization.name}`);
      });

      return jobs;
    }

    return [];
  } catch (error: any) {
    console.error('\n❌ Erro ao buscar vagas públicas:', error.message);
    return [];
  }
}

async function createTestJob(token: string): Promise<Job | null> {
  console.log('\n➕ === CRIANDO VAGA DE TESTE ===');

  const client = createApiClient(token);

  const testJob = {
    title: 'Instrutor de Krav Maga - Teste',
    description: 'Vaga de teste para validar o sistema de aplicações.\n\nResponsabilidades:\n- Ministrar aulas de Krav Maga\n- Orientar alunos iniciantes e avançados\n- Manter ambiente seguro e motivador',
    requirements: '- Certificação em Krav Maga\n- Experiência mínima de 2 anos\n- Habilidade de comunicação',
    benefits: '- Vale transporte\n- Vale refeição\n- Plano de saúde\n- Treinamento contínuo',
    type: 'FULL_TIME',
    level: 'MID',
    location: 'São Paulo - SP',
    remoteOption: false,
    salary: 'R$ 3.000 - R$ 5.000',
    department: 'Instrução',
    vacancies: 2,
    status: 'ACTIVE',
    publishedAt: new Date().toISOString()
  };

  try {
    const response = await client.post<{ success: boolean; data: Job; message: string }>('/jobs', testJob);

    if (response.data.success) {
      const job = response.data.data;
      console.log('\n✅ Vaga criada com sucesso!');
      console.log(`   ID: ${job.id}`);
      console.log(`   Título: ${job.title}`);
      console.log(`   Status: ${job.status}`);
      return job;
    }

    return null;
  } catch (error: any) {
    console.error('\n❌ Erro ao criar vaga:', error.message);
    if (error.response?.data) {
      console.error('Detalhes:', error.response.data);
    }
    return null;
  }
}

async function applyToJob(token: string, jobId: string): Promise<JobApplication | null> {
  console.log('\n📝 === APLICANDO PARA VAGA ===');
  console.log(`Job ID: ${jobId}`);

  const client = createApiClient(token);

  const application = {
    coverLetter: `Prezados recrutadores,

Venho por meio desta demonstrar meu interesse na vaga de instrutor.

Possuo sólida experiência em artes marciais e pedagogia esportiva, tendo trabalhado com diversos perfis de alunos, desde iniciantes até avançados. Acredito que minha paixão pelo ensino e meu comprometimento com a segurança e desenvolvimento dos alunos são diferenciais importantes.

Estou à disposição para uma conversa e demonstração prática de minhas habilidades.

Atenciosamente.`,
    resume: 'Currículo em anexo (simulado)'
  };

  try {
    const response = await client.post<{ success: boolean; data: JobApplication; message: string }>(
      `/jobs/${jobId}/apply`,
      application
    );

    if (response.data.success) {
      const app = response.data.data;
      console.log('\n✅ Candidatura enviada com sucesso!');
      console.log(`   Application ID: ${app.id}`);
      console.log(`   Status: ${app.status}`);
      console.log(`   Data: ${new Date(app.appliedAt).toLocaleString('pt-BR')}`);
      return app;
    }

    return null;
  } catch (error: any) {
    console.error('\n❌ Erro ao aplicar para vaga:', error.message);
    if (error.response?.data) {
      console.error('Detalhes:', error.response.data);
    }
    return null;
  }
}

async function getMyApplications(token: string): Promise<void> {
  console.log('\n📊 === MINHAS CANDIDATURAS ===');

  const client = createApiClient(token);

  try {
    const response = await client.get<{ success: boolean; data: any[]; total: number }>('/jobs/applications/my');

    if (response.data.success) {
      const applications = response.data.data;
      console.log(`\n✅ ${applications.length} candidatura(s) encontrada(s):`);

      applications.forEach((app, index) => {
        console.log(`\n   ${index + 1}. ${app.job.title}`);
        console.log(`      Application ID: ${app.id}`);
        console.log(`      Status: ${app.status}`);
        console.log(`      Data: ${new Date(app.appliedAt).toLocaleString('pt-BR')}`);
        console.log(`      Organização: ${app.job.organization.name}`);
        if (app.reviewedAt) {
          console.log(`      Revisado em: ${new Date(app.reviewedAt).toLocaleString('pt-BR')}`);
        }
      });
    }
  } catch (error: any) {
    console.error('\n❌ Erro ao buscar candidaturas:', error.message);
  }
}

async function getJobDetails(token: string, jobId: string): Promise<void> {
  console.log('\n🔍 === DETALHES DA VAGA ===');
  console.log(`Job ID: ${jobId}`);

  const client = createApiClient(token);

  try {
    const response = await client.get<{ success: boolean; data: Job }>(`/jobs/${jobId}`);

    if (response.data.success) {
      const job = response.data.data;
      console.log('\n✅ Vaga encontrada:');
      console.log(`   Título: ${job.title}`);
      console.log(`   Descrição: ${job.description}`);
      console.log(`   Tipo: ${job.type}`);
      console.log(`   Nível: ${job.level}`);
      console.log(`   Localização: ${job.location || 'Não especificada'}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Total de candidaturas: ${job._count.applications}`);
    }
  } catch (error: any) {
    console.error('\n❌ Erro ao buscar detalhes da vaga:', error.message);
  }
}

// Fluxo principal
async function main() {
  console.log('🚀 === TESTE DE APLICAÇÃO DE VAGAS ===\n');
  console.log('API Base URL:', API_BASE_URL);
  console.log('-------------------------------------------');

  try {
    // 1. Login
    const token = await login(TEST_EMAIL, TEST_PASSWORD);

    // 2. Buscar vagas públicas (sem auth)
    await listPublicJobs();

    // 3. Buscar vagas (autenticado)
    let jobs = await listJobs(token);

    // 4. Se não houver vagas, criar uma de teste
    if (jobs.length === 0) {
      console.log('\n⚠️ Nenhuma vaga encontrada. Criando vaga de teste...');
      const newJob = await createTestJob(token);
      if (newJob) {
        jobs = [newJob];
      }
    }

    // 5. Aplicar para a primeira vaga disponível
    if (jobs.length > 0) {
      const targetJob = jobs.find(j => j.status === 'ACTIVE') || jobs[0];

      await getJobDetails(token, targetJob.id);

      const application = await applyToJob(token, targetJob.id);

      if (application) {
        // 6. Verificar minhas candidaturas
        await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1s
        await getMyApplications(token);
      }
    } else {
      console.log('\n⚠️ Não foi possível criar uma vaga de teste.');
    }

    console.log('\n✅ === TESTE CONCLUÍDO COM SUCESSO ===\n');

  } catch (error: any) {
    console.error('\n❌ === TESTE FALHOU ===');
    console.error('Erro:', error.message);
    process.exit(1);
  }
}

// Executar
if (require.main === module) {
  main().catch(console.error);
}

export {
  login,
  listJobs,
  listPublicJobs,
  createTestJob,
  applyToJob,
  getMyApplications,
  getJobDetails
};
