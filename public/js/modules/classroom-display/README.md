# Módulo Display de Sala de Aula (Classroom Display)

Tela otimizada para TVs/monitores grandes na sala de aula.

## Características

- **Alto contraste**: Legível de longe (fundo escuro, texto grande)
- **Auto-atualização**: Refresh a cada 10 segundos
- **Timer de atividade**: Contagem regressiva em tempo real
- **Sem interação**: Apenas exibição (modo kiosk)
- **Responsivo**: Otimizado para 1920x1080, mas funciona em outras resoluções

## Arquivos

- `index.js` - Lógica do frontend
- Backend: `src/routes/classroom-display.ts`
- CSS: `css/modules/classroom-display.css`

## API Endpoints

```
GET /api/classroom/current-display   # Display automático da aula atual
GET /api/classroom/:id/display       # Display de aula específica
```

## Uso

1. Acessar rota `#classroom-display` (detecta aula automaticamente)
2. Ou `#classroom-display/<classId>` para aula específica
3. Pressionar F11 para modo fullscreen

## Layout

```
┌────────────────────────────────────────┐
│ 🥋 ACADEMIA KRAV MAGA        16:45     │
├────────────────────────────────────────┤
│        DEFESA PESSOAL - INICIANTE      │
│        Instrutor: Prof. João           │
├────────────────────────────────────────┤
│                                        │
│           ATIVIDADE ATUAL              │
│        ╔═══════════════════╗          │
│        ║   TÉCNICAS        ║          │
│        ║     12:45         ║          │
│        ╚═══════════════════╝          │
│                                        │
├────────────────────────────────────────┤
│  19:00 ████████░░░░░░░░░░░░░ 20:30    │
├────────────────────────────────────────┤
│  PRÓXIMA: Cenário Situacional (30min)  │
└────────────────────────────────────────┘
```
