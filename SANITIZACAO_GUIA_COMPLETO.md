# 🧹 PROJETO DE SANITIZAÇÃO - ACADEMIA KRAV MAGA V2.0
**Data**: 19 de outubro de 2025  
**Status**: ✅ FASE 1 COMPLETA - Pronto para Executar  
**Objetivo**: Limpar projeto, mover arquivos obsoletos para OLD_191025, manter apenas produção

---

## 📊 Resumo Executivo

### O Problema
- **48.832 arquivos** no projeto
- Muitos **arquivos duplicados** (backup, old, copy)
- **Documentação temporária** gerada automaticamente
- **node_modules** ocupando espaço desnecessário
- **Pastas antigas** de desenvolvimento
- Difícil manter e entender estrutura

### A Solução
Sanitizar o projeto em **4 fases**:
1. **AUDITORIA** - Identificar tudo que pode sair
2. **PREVIEW** - Visualizar antes de mover
3. **BACKUP + MOVE** - Cópia de segurança + movimento real
4. **LIMPEZA** - Remover pastas vazias, gerar relatório

### Resultado Esperado
- ✅ Projeto organizado e limpo
- ✅ Apenas arquivos de produção na raiz
- ✅ Tudo obsoleto em `OLD_191025` com subpastas
- ✅ Backup de segurança criado
- ✅ Documentação da estrutura

---

## 🎯 Como Usar

### Opção A: Menu Interativo (RECOMENDADO)
```batch
# Na pasta raiz do projeto:
sanitizacao.bat

# Escolha as opções no menu (1-6)
```

**Fluxo recomendado**:
```
1. Escolha [1] - AUDITORIA
   ↓ Leia relatório
2. Escolha [2] - PREVIEW
   ↓ Confirme que tudo está certo
3. Escolha [3] - BACKUP
   ↓ Espere cópia terminar (pode levar minutos)
4. Escolha [4] - MOVER
   ↓ Confirme aviso crítico
5. Escolha [5] - LIMPEZA
   ↓ Pronto!
```

Ou escolha `[6]` para executar tudo automaticamente.

### Opção B: Executar Fases Individuais
```batch
REM FASE 1: Auditoria
powershell -ExecutionPolicy Bypass -File "scripts\audit-sanitization.ps1"

REM FASE 2: Preview
move-files-preview.bat

REM FASE 3A: Backup
backup-before-move.bat

REM FASE 3B: Movimento Real
move-files-execute.bat

REM FASE 4: Limpeza
cleanup-final.bat
```

---

## 📂 Arquivos BAT Criados

### 1. `sanitizacao.bat` (MENU PRINCIPAL)
**Uso**: Coordenador de todas as fases
```
Menu interativo com opções 1-6
Recomendado para uso normal
```

### 2. `scripts/audit-sanitization.ps1` (AUDITORIA)
**Uso**: Varrer e categorizar arquivos
**O que faz**:
- Varre 48.832 arquivos
- Categoriza em 8 grupos (backup, logs, duplicatas, etc)
- Gera `AUDIT_SANITIZATION_191025.md`
- Gera `SANITIZATION_REPORT_191025.json`
- Gera `MOVE_LIST_191025.txt`

**Saída**:
```
📁 AUDIT_SANITIZATION_191025.md  → Relatório Markdown
📄 SANITIZATION_REPORT_191025.json → Dados estruturados
📋 MOVE_LIST_191025.txt → Lista de arquivos
```

### 3. `move-files-preview.bat` (PREVIEW)
**Uso**: Visualizar o que SERIA movido
**O que faz**:
- Lista TODOS os arquivos em 7 categorias
- Mostra caminho completo
- Mostra destino
- **NÃO move nada**

**Saída**:
```
[PREVIEW] CATEGORIA: BACKUP_FILES
   [MOVER] students-backup.js
           Caminho: public/js/modules/students/students-backup.js
           Destino: OLD_191025\BACKUP_FILES\
```

### 4. `backup-before-move.bat` (BACKUP)
**Uso**: Cria cópia de segurança ANTES de mover
**O que copia**:
- `node_modules/`
- `src/`
- `public/`
- `prisma/`
- `.git/`
- `package.json` e arquivos config

**Saída**:
```
BACKUP_SEGURANCA_2025101914_32/
├── node_modules/
├── src/
├── public/
├── prisma/
├── .git/
└── package.json
```

### 5. `move-files-execute.bat` (MOVIMENTO REAL)
**Uso**: Move arquivos para OLD_191025
**ATENÇÃO**: Sem possibilidade de desfazer!
**O que faz**:
- Move arquivos .bak, -old, -backup
- Move logs e temporários
- Move documentos gerados
- Move pastas antigas
- Organiza em subpastas por categoria

**Saída**:
```
OLD_191025/
├── BACKUP_FILES/
├── TEMP_LOGS/
├── DUPLICATES/
├── GENERATED_DOCS/
├── OLD_MODULES/
├── ARCHIVES/
├── DEPENDENCIES/
└── IDE_BUILD/
```

### 6. `cleanup-final.bat` (LIMPEZA)
**Uso**: Remove pastas vazias, gera relatório final
**O que faz**:
- Remove pastas vazias
- Gera `SANITIZATION_ORGANIZATION_*.txt`
- Calcula tamanhos
- Propõe próximos passos

---

## 📋 Categorias de Arquivos

### BACKUP_FILES
Arquivos de backup antigos
```
*.bak
*.backup
*-backup.js
*-old.js
*_old.js
```

### TEMP_LOGS
Arquivos temporários e logs
```
*.log
*.tmp
*.temp
*debug*
```

### DUPLICATES
Duplicatas e cópias de arquivos
```
*copy*.js
*-copy*.js
*_copy*.js
*2*.js (versões numeradas)
```

### GENERATED_DOCS
Documentação gerada automaticamente
```
*COMPLETE*.md (exceto AGENTS.md)
*REPORT*.md (exceto AUDIT_REPORT.md)
*SUMMARY*.md
*FIX*.md
*DEBUG*.md
```

### OLD_MODULES
Módulos e scripts antigos
```
*-old.js
*-backup.js
*-refactored.js
*-enhanced.js
*-simple.js
```

### ARCHIVES
Arquivos compactados
```
*.zip
*.rar
*.tar
*.gz
```

### DEPENDENCIES
Dependências antigas
```
node_modules/
dist/
dist-*/
```

### IDE_BUILD
Artefatos de IDE e build
```
.idea/
.reports/
.claude/
.archive/
backup/
backups/
```

---

## ✅ Arquivos CRÍTICOS (Mantidos)

Estes arquivos **NUNCA** serão movidos:
```
package.json
package-lock.json
tsconfig.json
prisma/schema.prisma
.env
.env.example
.gitignore
.github/workflows/
README.md
AGENTS.md (Master do projeto)
AUDIT_REPORT.md
.git/ (Histórico)
src/ (Código-fonte)
public/ (Frontend)
```

---

## 🚀 Fluxo de Execução Recomendado

### Dia 1: Auditoria (15 minutos)
```batch
1. Abra sanitizacao.bat
2. Escolha [1] AUDITORIA
3. Leia os 3 relatórios gerados:
   - AUDIT_SANITIZATION_191025.md
   - SANITIZATION_REPORT_191025.json
   - MOVE_LIST_191025.txt
4. Feche. Volte amanhã com a lista.
```

**Saída Esperada**:
```
Total de arquivos: 48.832
Arquivos para mover: ~5.000
Tamanho total: ~2 GB
Arquivos críticos mantidos: ~50
```

### Dia 2: Preview + Backup + Movimento (45 minutos)
```batch
1. Abra sanitizacao.bat
2. Escolha [2] PREVIEW - Veja o que será movido
3. Se tudo OK, escolha [3] BACKUP - Crie cópia segura (10-20 min)
4. Escolha [4] MOVIMENTO - Mova arquivos (5-10 min)
5. Escolha [5] LIMPEZA - Remova vazios (2 min)
6. Feche. Projeto sanitizado!
```

### Dia 3: Validação (15 minutos)
```batch
1. Abra PowerShell/Terminal
2. Teste:
   npm run dev
   npm run build
   npm run test
3. Se tudo OK, faça commit:
   git add -A
   git commit -m "Sanitizacao: movimento de arquivos para OLD_191025"
4. Faça push
   git push origin copilot/vscode1759830631870
5. Opcional: Remova BACKUP_SEGURANCA_* se quiser liberar espaço
```

---

## ⚠️ Avisos Importantes

### 1. BACKUP É OBRIGATÓRIO
Antes de executar `move-files-execute.bat`, execute `backup-before-move.bat`!

### 2. SEM VOLTA
Depois de mover, os arquivos estão em `OLD_191025`. Para desfazer:
```
Restaure de BACKUP_SEGURANCA_*/
Ou do Git: git checkout HEAD~1
```

### 3. FECHE PROGRAMAS
Antes de mover:
- Feche VS Code
- Feche terminal
- Feche Git GUI
- Feche qualquer programa que acesse esses arquivos

### 4. ESPAÇO EM DISCO
Necessário ~2x o tamanho do projeto para operação segura
```
Projeto atual: ~4 GB
Backup temporário: ~4 GB
Total necessário: ~8 GB
```

### 5. node_modules
Será recriado com `npm install` - OK se deletar de OLD_191025 depois

---

## 📊 Estrutura Final Esperada

### Antes (Desorganizado)
```
academia/
├── scripts/ (contém tudo misturado)
├── public/js/modules/ (com *-old.js, *-backup.js)
├── src/ (OK)
├── *.md (50+ arquivos documentação gerada)
├── *.js (10+ scripts soltos)
├── backups/ (pasta antiga)
├── backup/ (pasta antiga)
├── dist-old/ (pasta antiga)
└── ... 48.832 arquivos desorganizados
```

### Depois (Organizado)
```
academia/
├── src/                    [PRODUÇÃO]
├── public/                 [PRODUÇÃO]
├── prisma/                 [PRODUÇÃO]
├── scripts/                [PRODUÇÃO]
├── tests/                  [PRODUÇÃO]
├── dev/                    [PRODUÇÃO]
│
├── OLD_191025/             [LIMPEZA]
│   ├── BACKUP_FILES/
│   ├── TEMP_LOGS/
│   ├── DUPLICATES/
│   ├── GENERATED_DOCS/
│   ├── OLD_MODULES/
│   ├── ARCHIVES/
│   ├── DEPENDENCIES/
│   └── IDE_BUILD/
│
├── BACKUP_SEGURANCA_*/     [SEGURANÇA - pode remover depois]
│
├── .git/                   [PRODUÇÃO]
├── .github/                [PRODUÇÃO]
├── package.json            [PRODUÇÃO]
├── tsconfig.json           [PRODUÇÃO]
├── AGENTS.md               [PRODUÇÃO]
├── README.md               [PRODUÇÃO]
└── .env                    [PRODUÇÃO]
```

---

## 🎯 Métricas de Sucesso

### Antes da Sanitização
- ❌ 48.832 arquivos
- ❌ 8 arquivos duplicados por módulo
- ❌ 200+ documentos .md obsoletos
- ❌ Difícil navegar

### Depois da Sanitização
- ✅ ~43.000 arquivos de produção (organizado)
- ✅ ~5.000 arquivos em OLD_191025 (separado)
- ✅ Apenas AGENTS.md + README.md na raiz
- ✅ Estrutura clara e profissional

### Benefícios
1. **Performance**: Menos arquivos = indexação mais rápida
2. **Clareza**: Código limpo, fácil navegar
3. **Backup**: OLD_191025 disponível para referência
4. **Profissionalismo**: Projeto organizado
5. **Manutenção**: Mais fácil encontrar coisas

---

## 🆘 Troubleshooting

### Problema: "Access Denied" ao mover
**Solução**: Feche VS Code, terminal, Git GUI e tente novamente

### Problema: Arquivo está em uso
**Solução**: Reinicie o computador ou feche o programa que usa

### Problema: Espaço em disco insuficiente
**Solução**: Libere espaço ou remova node_modules temporariamente

### Problema: Quer reverter?
**Solução**:
```
Opção 1: Restaurar de BACKUP_SEGURANCA_*/
Opção 2: git checkout HEAD~1
Opção 3: Mover tudo de volta de OLD_191025/
```

---

## 📞 Suporte

Se algo dar errado:

1. Verifique `AUDIT_SANITIZATION_191025.md` para listar
2. Verifique `SANITIZATION_REPORT_191025.json` para detalhes
3. Restaure de `BACKUP_SEGURANCA_*/`
4. Ou faça `git checkout HEAD~1`

---

## ✨ Próximas Fases (Futuro)

### FASE 2 (Próxima): Consolidação de Módulos
- Mover módulos legados para OLD_191025
- Refatorar conforme AGENTS.md
- Padrão único (single-file vs multi-file)

### FASE 3: Documentação
- Atualizar AGENTS.md com nova estrutura
- Gerar README para cada módulo
- Documentar decisões arquiteturais

### FASE 4: CI/CD Automation
- Detectar automaticamente arquivos obsoletos
- Avisar em Pull Requests
- Enforcer regra de limpeza

---

**Status Final**: ✅ PRONTO PARA EXECUTAR  
**Tempo Estimado**: 1 hora (completo)  
**Risco**: BAIXO (com backup prévio)  
**Recomendação**: Execute agora! 🚀

