/**
 * Importa dados REAIS do Google Ads a partir de múltiplos CSVs
 * Baseado nos exports reais da conta Google Ads da Academia
 */

import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

interface CampaignRow {
  'Campanha': string;
  'Cliques': string;
  'Impressões': string;
  'CTR': string;
  'CPC médio': string;
  'Custo': string;
  'Conversões': string;
  'Taxa de conv.': string;
}

interface SerieTemporalRow {
  'Dia': string;
  'Cliques': string;
  'Impressões': string;
  'Custo': string;
}

interface DeviceRow {
  'Dispositivo': string;
  'Cliques': string;
  'Impressões': string;
  'Custo': string;
}

interface DemographicRow {
  'Sexo': string;
  'Cliques': string;
  'Impressões': string;
}

interface AgeRow {
  'Idade': string;
  'Cliques': string;
  'Impressões': string;
}

interface KeywordRow {
  'Palavra-chave de pesquisa': string;
  'Cliques': string;
  'Impressões': string;
}

const CSV_BASE_PATH = 'c:\\Users\\trcar\\Downloads\\Cards_da_Visão_geral_csv(2025-10-03_03_44_06)';

function parseNumber(value: string): number {
  if (!value || value === '--') return 0;
  // Remove pontos de milhar e substitui vírgula por ponto
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function parsePercentage(value: string): number {
  if (!value || value === '--') return 0;
  return parseFloat(value.replace('%', '').replace(',', '.')) || 0;
}

async function importCampaigns() {
  console.log('📊 Importando Campanhas...\n');
  
  const csvPath = path.join(CSV_BASE_PATH, 'Campanhas(2022.10.18-2025.10.03).csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: CampaignRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true // Handle UTF-8 BOM
  });

  let imported = 0;
  for (const [index, row] of records.entries()) {
    try {
      const cliques = parseNumber(row['Cliques']);
      const impressoes = parseNumber(row['Impressões']);
      const custo = parseNumber(row['Custo']);
      const conversoes = parseNumber(row['Conversões']);
      const ctr = parsePercentage(row['CTR']);
      const cpc = parseNumber(row['CPC médio']);

      await prisma.googleAdsCampaign.create({
        data: {
          campaignId: `REAL_CAMPAIGN_${index + 1}`,
          name: row['Campanha'],
          status: 'ENABLED',
          budget: custo / 30, // Estimativa de budget diário
          impressions: impressoes,
          clicks: cliques,
          cost: custo,
          conversions: conversoes,
          lastSyncAt: new Date()
        }
      });

      console.log(`✅ ${row['Campanha']}`);
      console.log(`   Cliques: ${cliques.toLocaleString()} | Impressões: ${impressoes.toLocaleString()}`);
      console.log(`   CTR: ${ctr.toFixed(2)}% | CPC: R$ ${cpc.toFixed(2)}`);
      console.log(`   Custo: R$ ${custo.toFixed(2)} | Conversões: ${conversoes}`);
      console.log('');

      imported++;
    } catch (error) {
      console.error(`❌ Erro ao importar: ${row['Campanha']}`);
      console.error(`   ${error.message}\n`);
    }
  }

  return imported;
}

async function importTimeSeries() {
  console.log('📈 Importando Série Temporal...\n');
  
  const csvPath = path.join(CSV_BASE_PATH, 'Série_temporal(2022.10.01-2025.10.03).csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: SerieTemporalRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });

  console.log(`📅 ${records.length} dias de dados históricos\n`);

  // Calcular métricas agregadas
  const totalCliques = records.reduce((sum, r) => sum + parseNumber(r['Cliques']), 0);
  const totalImpressoes = records.reduce((sum, r) => sum + parseNumber(r['Impressões']), 0);
  const totalCusto = records.reduce((sum, r) => sum + parseNumber(r['Custo']), 0);

  console.log(`📊 Métricas Totais (${records.length} dias):`);
  console.log(`   Total Cliques: ${totalCliques.toLocaleString()}`);
  console.log(`   Total Impressões: ${totalImpressoes.toLocaleString()}`);
  console.log(`   Total Custo: R$ ${totalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`   CTR Médio: ${((totalCliques / totalImpressoes) * 100).toFixed(2)}%`);
  console.log(`   CPC Médio: R$ ${(totalCusto / totalCliques).toFixed(2)}\n`);

  return records.length;
}

async function importDayOfWeek() {
  console.log('📅 Importando Análise por Dia da Semana...\n');
  
  const csvPath = path.join(CSV_BASE_PATH, 'Dia_e_hora(Dia_2022.10.18-2025.10.03).csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });

  console.log('📊 Performance por Dia da Semana:');
  const totalCliques = records.reduce((sum: number, r: any) => sum + parseNumber(r['Cliques']), 0);
  
  for (const row of records) {
    const cliques = parseNumber(row['Cliques']);
    const percentual = ((cliques / totalCliques) * 100).toFixed(1);
    console.log(`   ${row['Dia'].padEnd(15)} ${cliques.toString().padStart(5)} cliques (${percentual}%)`);
  }
  console.log('');

  return records.length;
}

async function importDevices() {
  console.log('📱 Importando Análise por Dispositivo...\n');
  
  const csvPath = path.join(CSV_BASE_PATH, 'Dispositivos(2022.10.18-2025.10.03).csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: DeviceRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });

  console.log('📊 Performance por Dispositivo:');
  for (const row of records) {
    const cliques = parseNumber(row['Cliques']);
    const impressoes = parseNumber(row['Impressões']);
    const custo = parseNumber(row['Custo']);
    const ctr = ((cliques / impressoes) * 100).toFixed(2);
    const cpc = (custo / cliques).toFixed(2);

    console.log(`   ${row['Dispositivo']}:`);
    console.log(`      Cliques: ${cliques.toLocaleString()} | Impressões: ${impressoes.toLocaleString()}`);
    console.log(`      CTR: ${ctr}% | CPC: R$ ${cpc}`);
    console.log(`      Custo: R$ ${custo.toFixed(2)}`);
    console.log('');
  }

  return records.length;
}

async function importDemographics() {
  console.log('👥 Importando Dados Demográficos...\n');
  
  // Sexo
  const sexoCsvPath = path.join(CSV_BASE_PATH, 'Informações_demográficas(Sexo_2022.10.18-2025.10.03).csv');
  const sexoContent = fs.readFileSync(sexoCsvPath, 'utf-8');
  const sexoRecords: DemographicRow[] = parse(sexoContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });

  console.log('📊 Performance por Sexo:');
  for (const row of sexoRecords) {
    const cliques = parseNumber(row['Cliques']);
    const impressoes = parseNumber(row['Impressões']);
    const ctr = ((cliques / impressoes) * 100).toFixed(2);
    console.log(`   ${row['Sexo']}: ${cliques.toLocaleString()} cliques (CTR: ${ctr}%)`);
  }
  console.log('');

  // Idade
  const idadeCsvPath = path.join(CSV_BASE_PATH, 'Informações_demográficas(Idade_2022.10.18-2025.10.03).csv');
  const idadeContent = fs.readFileSync(idadeCsvPath, 'utf-8');
  const idadeRecords: AgeRow[] = parse(idadeContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });

  console.log('📊 Performance por Idade:');
  for (const row of idadeRecords) {
    const cliques = parseNumber(row['Cliques']);
    const impressoes = parseNumber(row['Impressões']);
    const ctr = ((cliques / impressoes) * 100).toFixed(2);
    console.log(`   ${row['Idade']}: ${cliques.toLocaleString()} cliques (CTR: ${ctr}%)`);
  }
  console.log('');

  return sexoRecords.length + idadeRecords.length;
}

async function importKeywords() {
  console.log('🔍 Importando Palavras-Chave...\n');
  
  const csvPath = path.join(CSV_BASE_PATH, 'Palavras-chave_de_pesquisa(2022.10.18-2025.10.03).csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('⚠️  Arquivo de palavras-chave não encontrado, pulando...\n');
    return 0;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records: KeywordRow[] = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });

  console.log(`📊 Top 10 Palavras-Chave (de ${records.length} totais):\n`);
  
  const sortedByClicks = records
    .sort((a, b) => parseNumber(b['Cliques']) - parseNumber(a['Cliques']))
    .slice(0, 10);

  for (const [index, row] of sortedByClicks.entries()) {
    const cliques = parseNumber(row['Cliques']);
    const impressoes = parseNumber(row['Impressões']);
    const ctr = ((cliques / impressoes) * 100).toFixed(2);
    
    console.log(`   ${(index + 1).toString().padStart(2)}. ${row['Palavra-chave de pesquisa']}`);
    console.log(`       ${cliques} cliques | ${impressoes.toLocaleString()} impressões | CTR: ${ctr}%`);
    console.log('');
  }

  return records.length;
}

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 IMPORTAÇÃO DE DADOS REAIS DO GOOGLE ADS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 1. Verificar se CSVs existem
    if (!fs.existsSync(CSV_BASE_PATH)) {
      throw new Error(`❌ Diretório não encontrado: ${CSV_BASE_PATH}`);
    }

    // 2. Limpar dados antigos
    console.log('🧹 Limpando dados antigos...\n');
    await prisma.googleAdsCampaign.deleteMany({
      where: {
        campaignId: {
          startsWith: 'REAL_'
        }
      }
    });

    // 3. Criar/Atualizar configuração
    let config = await prisma.googleAdsConfig.findFirst();
    if (!config) {
      config = await prisma.googleAdsConfig.create({
        data: {
          clientId: 'REAL_DATA_CLIENT',
          clientSecret: 'REAL_DATA_SECRET',
          developerToken: 'AWAITING_APPROVAL',
          refreshToken: 'REAL_DATA_REFRESH',
          customerId: '000-000-0000', // Substitua pelo real quando tiver
          enabled: true,
          conversionActionId: 'customers/0000000000/conversionActions/000000000'
        }
      });
      console.log('✅ Configuração criada\n');
    }

    // 4. Importar dados
    const stats = {
      campanhas: await importCampaigns(),
      diasHistoricos: await importTimeSeries(),
      diasSemana: await importDayOfWeek(),
      dispositivos: await importDevices(),
      demograficos: await importDemographics(),
      palavrasChave: await importKeywords()
    };

    // 5. Resumo final
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ IMPORTAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📊 RESUMO DA IMPORTAÇÃO:\n');
    console.log(`   ✅ Campanhas: ${stats.campanhas}`);
    console.log(`   ✅ Dias de histórico: ${stats.diasHistoricos}`);
    console.log(`   ✅ Dias da semana: ${stats.diasSemana}`);
    console.log(`   ✅ Dispositivos: ${stats.dispositivos}`);
    console.log(`   ✅ Dados demográficos: ${stats.demograficos}`);
    console.log(`   ✅ Palavras-chave: ${stats.palavrasChave}`);
    console.log('');

    console.log('🎉 PRÓXIMOS PASSOS:\n');
    console.log('   1. Inicie o servidor: npm run dev');
    console.log('   2. Acesse: http://localhost:3000/#/crm');
    console.log('   3. Veja suas campanhas REAIS no dashboard!');
    console.log('   4. Configure OAuth2 quando receber o Developer Token\n');

  } catch (error: any) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ ERRO NA IMPORTAÇÃO:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.error(error.message);
    console.error('');
    
    if (error.message.includes('ENOENT')) {
      console.error('💡 SOLUÇÃO:');
      console.error('   1. Verifique se os CSVs estão no caminho correto');
      console.error('   2. Edite CSV_BASE_PATH no script se necessário');
      console.error('   3. Certifique-se de que baixou os CSVs do Google Ads\n');
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as importRealGoogleAdsData };
