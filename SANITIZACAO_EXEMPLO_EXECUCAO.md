# 🎬 EXEMPLO DE EXECUÇÃO - SANITIZAÇÃO

Este documento mostra exemplos de como cada script irá executar.

---

## 1️⃣ EXECUTAR: `sanitizacao.bat`

### Saída Visual

```
╔════════════════════════════════════════════════════════════╗
║     SANITIZAÇÃO - ACADEMIA KRAV MAGA V2.0                 ║
║          Menu de Coordenação de Fases                      ║
║                  Data: 19/10/2025                          ║
╚════════════════════════════════════════════════════════════╝

FASES DE SANITIZAÇÃO:

   [1] FASE 1 - AUDITORIA (Identificar arquivos)
       - Varre todos os arquivos
       - Categoriza por tipo
       - Gera relatório em Markdown/JSON
       - NÃO move nada
       Status: RECOMENDADO PRIMEIRO

   [2] FASE 2 - PREVIEW (Visualizar movimento)
       - Mostra o que SERIA movido
       - Não mexe em nada
       - Permite verificar antes
       Status: RECOMENDADO SEGUNDO

   [3] FASE 3A - BACKUP (Cópia de Segurança)
       - Cria cópia completa de segurança
       - Backup de src, public, node_modules, .git, etc
       - Essencial fazer ANTES de mover
       Status: RECOMENDADO TERCEIRO

   [4] FASE 3B - MOVER (Movimento Real)
       - Executa movimento de arquivos
       - Move para OLD_191025 com subpastas
       - ATENÇÃO: Sem possibilidade de desfazer!
       Status: SÓ FAZER APÓS BACKUP!

   [5] FASE 4 - LIMPEZA FINAL (Remover Vazios)
       - Remove pastas vazias
       - Gera relatório final
       Status: FAZER POR ÚLTIMO

   [6] EXECUTAR TODAS AS FASES (Automaticamente)
       - Executa fases 1 a 5 em sequência
       - Com confirmações entre fases
       Status: MAIS RÁPIDO

   [0] SAIR

Digite sua opção (0-6): _
```

---

## 2️⃣ EXECUTAR: FASE 1 - AUDITORIA

### Comando
```batch
sanitizacao.bat
→ Digite: 1
```

### Saída Visual

```
╔════════════════════════════════════════════════════════════╗
║         AUDITORIA DE SANITIZAÇÃO - FASE 1               ║
║              Identificação de Arquivos                  ║
╚════════════════════════════════════════════════════════════╝

📊 INICIANDO AUDITORIA...

🔍 Varredura de arquivos...
   ✓ Total de arquivos encontrados: 48832

📁 Categorizando arquivos...

   [BACKUP_FILES] → 542 arquivos
   [TEMP_LOGS] → 318 arquivos
   [DUPLICATES] → 187 arquivos
   [GENERATED_DOCS] → 2145 arquivos
   [OLD_MODULES] → 987 arquivos
   [ARCHIVES] → 53 arquivos
   [DEPENDENCIES] → 312 arquivos
   [IDE_BUILD] → 456 arquivos

📝 Gerando relatório...
✓ Relatório salvo em: AUDIT_SANITIZATION_191025.md
✓ Lista de movimento salva em: MOVE_LIST_191025.txt
✓ Relatório JSON salvo em: SANITIZATION_REPORT_191025.json

╔════════════════════════════════════════════════════════════╗
║               ESTATÍSTICAS DA AUDITORIA                   ║
╚════════════════════════════════════════════════════════════╝

Resumo:
  . Total de arquivos: 48832
  . Arquivos para mover: 5000
  . Tamanho total: 1985.34 MB
  . Arquivos críticos mantidos: 42

Por Categoria:
   . BACKUP_FILES: 542 arquivos (245.23 MB)
   . TEMP_LOGS: 318 arquivos (12.45 MB)
   . DUPLICATES: 187 arquivos (89.34 MB)
   . GENERATED_DOCS: 2145 arquivos (156.78 MB)
   . OLD_MODULES: 987 arquivos (543.21 MB)
   . ARCHIVES: 53 arquivos (234.56 MB)
   . DEPENDENCIES: 312 arquivos (567.89 MB)
   . IDE_BUILD: 456 arquivos (135.88 MB)

AUDITORIA CONCLUIDA COM SUCESSO!

Proximo passo: Executar move-files-preview.bat para visualizar movimento (modo simulado)
Depois: Executar move-files-execute.bat para mover de verdade

AVISO: NAO ESQUECA: Fazer backup antes de mover!

Pressione qualquer tecla para continuar...
```

### Arquivo Gerado: `AUDIT_SANITIZATION_191025.md`

```markdown
# 🔍 AUDITORIA DE SANITIZAÇÃO - FASE 1
**Data**: 19/10/2025 14:32:45
**Pasta Raiz**: h:\projetos\academia
**Total de Arquivos**: 48832
**Arquivos para Mover**: 5000
**Status**: ✅ AUDITORIA COMPLETA

---

## 📊 Resumo por Categoria

| Categoria | Quantidade | Tamanho Total |
|-----------|-----------|--------------|
| **BACKUP_FILES** | 542 | 245.23 MB |
| **TEMP_LOGS** | 318 | 12.45 MB |
| **DUPLICATES** | 187 | 89.34 MB |
| **GENERATED_DOCS** | 2145 | 156.78 MB |
| **OLD_MODULES** | 987 | 543.21 MB |
| **ARCHIVES** | 53 | 234.56 MB |
| **DEPENDENCIES** | 312 | 567.89 MB |
| **IDE_BUILD** | 456 | 135.88 MB |

**TOTAL PARA MOVER**: 5000 arquivos | 1985.34 MB

---

## 📋 Detalhes por Categoria

### BACKUP_FILES (542 arquivos)

- **students-backup.js** (345 KB) - Motivo: *JS backups*
- **instructors-backup.js** (234 KB) - Motivo: *JS backups*
- **activities-old.js** (456 KB) - Motivo: *Versões antigas*
- **courses.js.backup** (567 KB) - Motivo: *Arquivos .backup*

... (muitos mais)
```

---

## 3️⃣ EXECUTAR: FASE 2 - PREVIEW

### Comando
```batch
sanitizacao.bat
→ Digite: 2
```

### Saída Visual

```
╔════════════════════════════════════════════════════════════╗
║     FASE 2: PREVIEW DE MOVIMENTO (SEM MOVER NADA)         ║
║     Veja o que SERIA movido para OLD_191025               ║
║                 Data: 19/10/2025 14:45:30                 ║
╚════════════════════════════════════════════════════════════╝

[AVISO] Este é um modo SIMULADO - nenhum arquivo será movido!
[AVISO] Use este para verificar antes de executar o movimento real

════════════════════════════════════════════════════════════
[PREVIEW] CATEGORIA: BACKUP_FILES
════════════════════════════════════════════════════════════
   [MOVER] students-backup.js
           Caminho: h:\projetos\academia\public\js\modules\students\students-backup.js
           Destino: OLD_191025\BACKUP_FILES\

   [MOVER] instructors-old.js
           Caminho: h:\projetos\academia\public\js\modules\instructors\instructors-old.js
           Destino: OLD_191025\BACKUP_FILES\

   [MOVER] activities.js.backup
           Caminho: h:\projetos\academia\public\js\modules\activities\activities.js.backup
           Destino: OLD_191025\BACKUP_FILES\

   Total nesta categoria: 542 arquivos

════════════════════════════════════════════════════════════
[PREVIEW] CATEGORIA: GENERATED_DOCS
════════════════════════════════════════════════════════════
[AVISO] Documentos críticos NÃO serão movidos:
   - AGENTS.md (Mestre do projeto)
   - AGENTS.md.bak (Backup mestre)
   - AUDIT_REPORT.md (Auditoria oficial)

   [MOVER] AI_AGENTS_ARCHITECTURE.md
           Caminho: h:\projetos\academia\AI_AGENTS_ARCHITECTURE.md
           Destino: OLD_191025\GENERATED_DOCS\

   [MOVER] FIX_CHECKIN_EMPTY_CLASSES.md
           Caminho: h:\projetos\academia\FIX_CHECKIN_EMPTY_CLASSES.md
           Destino: OLD_191025\GENERATED_DOCS\

   [MOVER] ACTIVITY_TRACKING_SYSTEM_COMPLETE.md
           Caminho: h:\projetos\academia\ACTIVITY_TRACKING_SYSTEM_COMPLETE.md
           Destino: OLD_191025\GENERATED_DOCS\

   Total nesta categoria: 2145 arquivos

... (mais categorias)

╔════════════════════════════════════════════════════════════╗
║               RESUMO DO PREVIEW (SIMULADO)                 ║
╚════════════════════════════════════════════════════════════╝

[RESUMO] Total de itens a mover: 5000

[ESTRUTURA] Será criada a seguinte estrutura:

   OLD_191025\
   ├── BACKUP_FILES\       (Arquivos .bak, -backup.js, etc)
   ├── TEMP_LOGS\          (*.log, *.tmp, *.temp)
   ├── DUPLICATES\         (Arquivos duplicados)
   ├── GENERATED_DOCS\     (Documentos gerados)
   ├── OLD_MODULES\        (Módulos JS antigos)
   ├── ARCHIVES\           (*.zip, *.rar, etc)
   ├── DEPENDENCIES\       (Dependências antigas)
   └── IDE_BUILD\          (IDE e build artefatos)

[PROXIMO PASSO]
   1. Revise a lista acima
   2. Se tudo estiver correto, execute: move-files-execute.bat
   3. Se quiser fazer backup primeiro: backup-before-move.bat

Pressione qualquer tecla para continuar...
```

---

## 4️⃣ EXECUTAR: FASE 3A - BACKUP

### Comando
```batch
sanitizacao.bat
→ Digite: 3
```

### Saída Visual

```
╔════════════════════════════════════════════════════════════╗
║        CRIANDO BACKUP DE SEGURANÇA                        ║
║     Antes de executar o movimento de arquivos             ║
║                 Data: 19/10/2025 14:50:15                 ║
╚════════════════════════════════════════════════════════════╝

[PREPARACAO] Criando pasta de backup: BACKUP_SEGURANCA_20251019_1450
[OK] Pasta criada

[BACKUP] Fazendo cópia dos arquivos críticos...

[COPIANDO] node_modules (pode levar alguns minutos)...
   [████████████░░░░░░░░░░░░░░░] 45% (3 min restantes)
[OK] node_modules copiado (987 MB)

[COPIANDO] src (código-fonte)...
[OK] src copiado (245 MB)

[COPIANDO] public (frontend)...
[OK] public copiado (567 MB)

[COPIANDO] prisma (banco de dados)...
[OK] prisma copiado (12 MB)

[COPIANDO] Arquivos de configuração...
[OK] package.json copiado
[OK] package-lock.json copiado
[OK] tsconfig.json copiado
[OK] .env copiado

[COPIANDO] .git (histórico)...
[OK] .git copiado (345 MB)

╔════════════════════════════════════════════════════════════╗
║               BACKUP CONCLUÍDO COM SUCESSO!               ║
╚════════════════════════════════════════════════════════════╝

[INFO] Pasta de backup: BACKUP_SEGURANCA_20251019_1450
[INFO] Localização: h:\projetos\academia\BACKUP_SEGURANCA_20251019_1450
[INFO] Tamanho total: 2.1 GB

[SEGURANÇA]
   - Todos os arquivos críticos foram copiados
   - Em caso de problema, você pode restaurar de: BACKUP_SEGURANCA_20251019_1450
   - Recomendação: compacte essa pasta e guarde em outro local

[PROXIMO PASSO]
   Execute: move-files-execute.bat
   Se algo der errado, você pode restaurar do folder: BACKUP_SEGURANCA_20251019_1450

Pressione qualquer tecla para continuar...
```

---

## 5️⃣ EXECUTAR: FASE 3B - MOVER

### Comando
```batch
sanitizacao.bat
→ Digite: 4
```

### Confirmação
```
╔════════════════════════════════════════════════════════════╗
║ AVISO CRÍTICO - FASE 3B MOVIMENTO REAL                     ║
╚════════════════════════════════════════════════════════════╝

Você está prestes a MOVER arquivos para OLD_191025

ESTE PROCESSO PODE NÃO SER REVERSÍVEL!

Recomendações:
   1. Certifique-se de ter feito BACKUP (FASE 3A)
   2. Feche todos os programas que usam esses arquivos
   3. Tenha certeza antes de prosseguir

Tem certeza que deseja continuar? (S/N): S
```

### Saída Visual

```
╔════════════════════════════════════════════════════════════╗
║     FASE 3: MOVIMENTO REAL DE ARQUIVOS                   ║
║     Para: OLD_191025                                       ║
║     Data: 19/10/2025 15:05:23                             ║
╚════════════════════════════════════════════════════════════╝

[CRIANDO] Pasta OLD_191025...
[OK] Pasta criada com sucesso

[ESTRUTURA] Criando estrutura de pastas...
   - OLD_191025\BACKUP_FILES criada
   - OLD_191025\TEMP_LOGS criada
   - OLD_191025\DUPLICATES criada
   - OLD_191025\GENERATED_DOCS criada
   - OLD_191025\OLD_MODULES criada
   - OLD_191025\ARCHIVES criada
   - OLD_191025\DEPENDENCIES criada
   - OLD_191025\IDE_BUILD criada

[ESTATISTICAS] Arquivos antes: 48832

[MOVENDO] BACKUP_FILES...
   - Movendo: students-backup.js
   - Movendo: instructors-old.js
   - Movendo: courses.js.backup
   - Movendo: activities-old.js
   - Movendo: turmas-old.js
   [████████████████░░░░░░░░░░] 75% (128/542)
[OK] 542 arquivos movidos para BACKUP_FILES

[MOVENDO] TEMP_LOGS...
   - Movendo: server.log
   - Movendo: error.log
   - Movendo: debug.tmp
   [████████████████████████████] 100% (318/318)
[OK] 318 arquivos movidos para TEMP_LOGS

[MOVENDO] DUPLICATES...
   - Movendo: students-copy.js
   - Movendo: modules-copy.js
   [████████████████████████████] 100% (187/187)
[OK] 187 arquivos movidos para DUPLICATES

[MOVENDO] GENERATED_DOCS...
   - Movendo: AI_AGENTS_ARCHITECTURE.md
   - Movendo: FIX_CHECKIN_EMPTY_CLASSES.md
   - Movendo: ACTIVITY_TRACKING_SYSTEM_COMPLETE.md
   [████████████░░░░░░░░░░░░░░░] 42% (900/2145)
[OK] 2145 arquivos movidos para GENERATED_DOCS

... (mais categorias)

╔════════════════════════════════════════════════════════════╗
║             MOVIMENTO CONCLUÍDO COM SUCESSO!              ║
╚════════════════════════════════════════════════════════════╝

[INFORMACOES] Pasta OLD_191025 criada com sucesso
[INFORMACOES] Estrutura de subpastas organizadas:
   - BACKUP_FILES: Arquivos .bak e -backup
   - TEMP_LOGS: Logs e arquivos temporários
   - DUPLICATES: Cópias e versões antigas
   - GENERATED_DOCS: Documentação gerada
   - OLD_MODULES: Módulos antigos
   - ARCHIVES: Arquivos compactados
   - DEPENDENCIES: Dependências antigas
   - IDE_BUILD: Pastas de IDE e build

[PROXIMO PASSO] Execute cleanup-final.bat para remover pastas vazias

Pressione qualquer tecla para continuar...
```

---

## 6️⃣ EXECUTAR: FASE 4 - LIMPEZA

### Comando
```batch
sanitizacao.bat
→ Digite: 5
```

### Saída Visual

```
╔════════════════════════════════════════════════════════════╗
║     FASE 4: LIMPEZA FINAL                                  ║
║     Remove pastas vazias e organiza                        ║
║                 Data: 19/10/2025 15:15:45                 ║
╚════════════════════════════════════════════════════════════╝

[LIMPEZA] Removendo pastas vazias...

   [REMOVENDO] public\js\modules\students_backup
   [REMOVENDO] src\controllers\old
   [REMOVENDO] scripts\backup
   [REMOVENDO] tools\deprecated
   [REMOVENDO] dev\old-docs

[RESULTADO] 12 pastas vazias removidas

[ORGANIZACAO] Gerando relatório de organização...

╔════════════════════════════════════════════════════════════╗
║               LIMPEZA FINALIZADA COM SUCESSO              ║
╚════════════════════════════════════════════════════════════╝

Relatório salvo em: SANITIZATION_ORGANIZATION_20251019.txt

════════════════════════════════════════════════════════════
PRÓXIMOS PASSOS RECOMENDADOS:
════════════════════════════════════════════════════════════

1. VERIFICAÇÃO (obrigatório):
   - Testar se aplicação ainda funciona: npm run dev
   - Rodar testes: npm run test
   - Compilar TypeScript: npm run build

2. BACKUP (recomendado):
   - Copiar pasta BACKUP_SEGURANCA_* para outro HD/Cloud
   - Arquivar com ZIP e guardar
   - Remover depois de confirmar que tudo funciona

3. VERSIONAMENTO (importante):
   - git status
   - git add -A
   - git commit -m "Sanitizacao fase 1: movimento de arquivos para OLD_191025"

4. LIMPEZA (optional):
   - Remover BACKUP_SEGURANCA_* se quiser liberar espaço
   - Comprimir OLD_191025 com ZIP se quiser arquivar

════════════════════════════════════════════════════════════
INFORMAÇÕES SOBRE OLD_191025:
════════════════════════════════════════════════════════════

Essa pasta contém:
   - Versões antigas de módulos
   - Arquivos de backup e temporários
   - Documentação gerada automaticamente
   - Arquivos duplicados

Você pode:
   - MANTER: Para futuras referências (ocupa espaço)
   - ARQUIVAR: Copiar para ZIP e deletar (economiza espaço)
   - DELETAR: Remover completamente (libera espaço imediatamente)

════════════════════════════════════════════════════════════

[OK] Limpeza finalizada com sucesso

Pressione qualquer tecla para continuar...
```

---

## 📊 Estrutura Final Criada

```
h:\projetos\academia\
│
├── OLD_191025\                    ← CRIADA COM SUCESSO
│   ├── BACKUP_FILES\              (542 arquivos - 245 MB)
│   ├── TEMP_LOGS\                 (318 arquivos - 12 MB)
│   ├── DUPLICATES\                (187 arquivos - 89 MB)
│   ├── GENERATED_DOCS\            (2145 arquivos - 157 MB)
│   ├── OLD_MODULES\               (987 arquivos - 543 MB)
│   ├── ARCHIVES\                  (53 arquivos - 235 MB)
│   ├── DEPENDENCIES\              (312 arquivos - 568 MB)
│   └── IDE_BUILD\                 (456 arquivos - 136 MB)
│
├── BACKUP_SEGURANCA_20251019_1450\ ← SEGURANÇA
│   ├── src\
│   ├── public\
│   ├── node_modules\
│   ├── .git\
│   └── [config files]
│
├── src\                           ← PRODUÇÃO
├── public\                        ← PRODUÇÃO
├── prisma\                        ← PRODUÇÃO
├── scripts\                       ← PRODUÇÃO
│
├── SANITIZATION_ORGANIZATION_20251019.txt
├── AUDIT_SANITIZATION_191025.md
├── SANITIZATION_REPORT_191025.json
├── MOVE_LIST_191025.txt
│
└── ... (arquivos críticos mantidos)
```

---

## ✅ Resultado Final

- ✅ 5.000 arquivos movidos para OLD_191025
- ✅ 8 subpastas criadas com organização
- ✅ Backup de segurança criado (2.1 GB)
- ✅ 12 pastas vazias removidas
- ✅ Projeto sanitizado e organizado
- ✅ 3 relatórios gerados

**Projeto pronto para produção!** 🚀

---

**Data de Execução Exemplo**: 19/10/2025  
**Tempo Total**: ~47 minutos  
**Resultado**: 100% Sucesso ✨
