# Módulo Painel do Instrutor (Instructor Dashboard)

Dashboard "Minha Aula" para instrutores.

## Funcionalidades

- **Aula Atual**: Mostra a aula em andamento ou próxima (15 min antes)
- **Plano de Aula**: Timeline visual das atividades
- **Próximas Aulas**: Lista de aulas agendadas (7 dias)
- **Ações**: Iniciar/Finalizar aula, Ver presença

## Arquivos

- `index.js` - Lógica do frontend
- Backend: `src/routes/instructor-dashboard.ts`
- CSS: `css/modules/instructor-dashboard.css`

## API Endpoints

```
GET  /api/instructor/my-classes       # Aulas do instrutor
POST /api/instructor/class/:id/start  # Iniciar aula
POST /api/instructor/class/:id/finish # Finalizar aula
```

## Uso

1. Acessar rota `#instructor-dashboard`
2. Passar `?instructorId=<uuid>` para testes (produção usa auth)
