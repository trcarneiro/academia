# Feature Specification: Atualizar deploy do servidor

**Feature Branch**: `001-deploy-server-update`  
**Created**: 2025-12-17  
**Status**: Draft  
**Input**: User description: "Preciso jogar essa versão do sistema para o servidor, esta desatualizado, os dados estão no Venv"

## Constitution Compliance Check

*GATE: Verify alignment with project principles before proceeding.*

| Principle | Compliance | Notes |
|-----------|------------|-------|
| I. API-First | ✅ | Nenhuma alteração de contrato; serviço deve permanecer disponível após deploy |
| II. Module Isolation | ✅ | Sem mudanças em módulos; apenas entrega de build | 
| III. API Client | ✅ | Frontend permanece consumindo API existente; client intacto | 
| IV. Full-Screen UI | ✅ | Sem novas UIs; padrão preservado |
| V. Premium UI | ✅ | UI não alterada pelo deploy |
| VI. Multi-Tenant | ✅ | Deploy não pode afetar isolamento por organização |
| VII. Simplicity | ✅ | Pipeline focado em entrega única e validação de saúde |

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Deploy seguro da versão atual (Priority: P1)

Como operador, quero publicar a versão local mais recente em produção mantendo dados e configurações existentes, para restabelecer disponibilidade com a build atualizada.

**Why this priority**: Produção está desatualizada e indisponível (502); restabelecer serviço é crítico.

**Independent Test**: Executar deploy isoladamente e confirmar que a aplicação responde 200/OK e mantém dados e variáveis de ambiente intactas.

**Acceptance Scenarios**:

1. **Given** produção desatualizada, **When** a build atual é entregue e o serviço reiniciado, **Then** `/` responde 200 em até 5 minutos.
2. **Given** variáveis e dados existentes, **When** o deploy termina, **Then** `.env`/`.venv` não são sobrescritos e o app sobe usando as mesmas credenciais.

---

### User Story 2 - Verificação de saúde pós-deploy (Priority: P2)

Como operador, quero confirmar automaticamente que o serviço permanece estável após o restart, para evitar loops de crash (PM2 restarts).

**Why this priority**: Crash loops anteriores impediram disponibilidade mesmo após deploy.

**Independent Test**: Monitorar PM2 uptime por 30 minutos e verificar ausência de erros de alias/import na inicialização.

**Acceptance Scenarios**:

1. **Given** o serviço reiniciado, **When** monitoramos PM2 por 30 minutos, **Then** nenhum restart adicional ocorre e logs não exibem erros de import/alias.

---

### User Story 3 - Evidência de entrega (Priority: P3)

Como responsável pela operação, quero registrar um log de deploy com versão e horário, para auditar a entrega e facilitar rollback se necessário.

**Why this priority**: Transparência e rastreabilidade em caso de incidentes.

**Independent Test**: Registrar log com timestamp, hash/versão e resultado do health check; validar que está disponível após o deploy.

**Acceptance Scenarios**:

1. **Given** um deploy concluído, **When** consulto o log, **Then** encontro data/hora, versão entregue e resultado do health check.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Falha de SSH/autenticação impede deploy (bloqueio temporário ou credenciais incorretas).
- Build gera artefatos com aliases não resolvidos, causando crash na inicialização.
- `pm2 restart` entra em loop por falta de dependência/variável de ambiente.
- Conectividade com banco indisponível após reinício (ex.: credenciais ou rede).
- Health check retorna 502/timeout mesmo após restart (processo não iniciou ou porta ocupada).

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: A entrega deve publicar a versão local mais recente no servidor, usando artefatos compilados com aliases resolvidos para execução em Node.js.
- **FR-002**: O deploy não deve sobrescrever arquivos de configuração e dados já presentes no servidor (`.env`, `.venv`, volumes de dados, uploads).
- **FR-003**: O serviço deve reiniciar e atingir estado saudável (HTTP 200 na rota pública) em até 5 minutos após o deploy.
- **FR-004**: Deve existir verificação pós-deploy que confirme ausência de erros de import/alias e ausência de novos restarts no PM2 por pelo menos 30 minutos.
- **FR-005**: Deve ser gerado log de deploy contendo data/hora, versão/hashes entregues e resultado do health check.
- **FR-006**: Em caso de falha de saúde, o processo deve permitir retorno ao estado anterior (rollback manual disponível) sem perda de dados.

### Key Entities *(include if feature involves data)*

- **Pacote de deploy**: Conjunto de artefatos compilados, inclui código backend/frontend e scripts necessários para inicialização.
- **Servidor de produção**: Hospeda serviço e PM2; mantém `.env`/`.venv` e dados persistentes.
- **Health check**: Endpoint público usado para validar disponibilidade pós-restart.
- **Registro de deploy**: Log com versão/hashes, timestamps e resultado do health check.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: Endpoint público responde 200/OK em até 5 minutos após o deploy.
- **SC-002**: PM2 mantém uptime ≥ 30 minutos sem restarts adicionais pós-deploy.
- **SC-003**: Log de deploy registra horário e versão entregue em 100% das execuções.
- **SC-004**: Nenhum erro de import/alias no startup e zero incidentes de indisponibilidade (502) nas 24h seguintes ao deploy.
