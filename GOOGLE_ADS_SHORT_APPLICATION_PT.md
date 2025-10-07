# Solicitação de Acesso à API do Google Ads - Versão Curta

---

## Informações da Empresa

**Nome da Empresa:** Academia Krav Maga

**Tipo de Negócio:** Academia de Treinamento em Artes Marciais

**País:** Brasil

---

## Modelo de Negócio

Minha empresa opera uma academia de artes marciais especializada em Krav Maga e autodefesa. Gerenciamos campanhas do Google Ads exclusivamente para nossa própria academia para promover nossos programas de treinamento (cursos para iniciantes, aulas avançadas, personal training). Só anunciamos para nossa própria academia e não gerenciamos anúncios para ninguém mais.

---

## Acesso/Uso da Ferramenta

Minha ferramenta será usada por gerentes de marketing e administradores de CRM dentro da minha academia para visualizar e gerar relatórios sobre geração de leads e performance de anúncios. Teremos tanto um dashboard CRM quanto a capacidade de gerar relatórios de performance. Podemos enviar relatórios em PDF gerados pela nossa ferramenta para nosso consultor de marketing, mas ele não poderá acessar a ferramenta diretamente.

Também teremos um script que rodará a cada hora para sincronizar dados de leads e fazer upload de eventos de conversão quando alunos se matricularem.

---

## Design da Ferramenta

Para o aspecto de relatórios da nossa ferramenta, extrairemos métricas de campanha da API para nosso banco de dados PostgreSQL. A UI da nossa ferramenta extrairá deste banco de dados para exibir relatórios. Os usuários terão a opção de visualizar diferentes níveis de performance de anúncios (campanhas, grupos de anúncios, leads) em diferentes períodos de tempo.

Meu banco de dados PostgreSQL interno sincronizará com a API do Google Ads a cada hora para atualizar dados de leads e fará upload de conversões offline quando leads se tornarem alunos matriculados.

---

## Serviços da API Chamados

- **Customer Resource:** Extrair relatórios de performance da conta da API
- **GoogleAdsService:** Fazer upload de eventos de conversão offline quando alunos se matriculam
- **Campaign/AdGroup Resources (Somente Leitura):** Sincronizar dados de campanha com CRM interno

---

## Mockup da Ferramenta

O dashboard exibirá:
- Pipeline de leads por fonte de campanha (NOVO → CONTATADO → QUALIFICADO → MATRICULADO)
- Métricas de conversão (total de leads, taxa de matrícula, ROI)
- Performance de campanha ao longo do tempo (diário, semanal, mensal)
- Análise de custos (custo por lead, custo por aquisição, receita)
- Tabela de conversões recentes com nomes de alunos, campanha de origem e valores de matrícula

---

## Uso Esperado

- **Sincronização por hora:** ~720 chamadas à API/mês (script automatizado)
- **Uploads de conversão:** ~40-60 chamadas/mês (conforme alunos se matriculam)
- **Consultas do dashboard:** ~500-1.000 chamadas/mês (interações de usuários)
- **Total estimado:** ~1.300-1.800 chamadas à API/mês

---

## Declaração de Conformidade

✅ Nossa ferramenta é usada exclusivamente para gerenciar nossa própria conta do Google Ads  
✅ NÃO revenderemos ou forneceremos acesso à API para terceiros  
✅ Cumprimos com os Termos de Serviço da API do Google Ads  
✅ Todos os dados são usados apenas para inteligência de negócios interna  
✅ Tratamos dados de usuários de acordo com a LGPD (lei de privacidade brasileira)

---

**Data:** 3 de outubro de 2025

**Empresa:** Academia Krav Maga
