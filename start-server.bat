@echo off
echo Iniciando servidor...
cd /d "h:\projetos\academia"
set NODE_OPTIONS=-r tsconfig-paths/register
npx tsx src/server.ts
pause
