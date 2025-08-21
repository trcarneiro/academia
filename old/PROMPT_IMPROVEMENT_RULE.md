# Regra de Melhoria de Prompts do Qwen Code

**Objetivo:** Garantir clareza, precisão e eficiência nas interações automatizando a melhoria de prompts do usuário antes da execução.

## Protocolo de Melhoria Automática

1.  **Análise da Solicitação:** Ler atentamente o pedido do usuário.
2.  **Identificação de Ambiguidades:** Verificar se o pedido é claro, específico e contém informações suficientes.
3.  **Melhoria/Reformulação:**
    *   Se ambíguo ou incompleto, reformular internamente para ser mais claro, objetivo e completo.
    *   Apresentar o prompt melhorado ao usuário.
    *   **OBRIGATÓRIO:** Aguardar confirmação explícita do usuário antes de prosseguir.
4.  **Execução:** Após confirmação, executar a tarefa com base no prompt aprovado.

## Exemplo

*   **Original:** 'veja o modulo de gestaõ de plano, a tela de edição de planos, me ala mais sobre'
*   **Melhorado:**
    'Preciso investigar o módulo de gestão de planos, especificamente a tela de edição de planos. Por favor, faça o seguinte:
    1.  **Localize os arquivos:** Encontre os arquivos relacionados ao módulo de gestão de planos, especialmente aqueles referentes à tela de edição (HTML, CSS, JS).
    2.  **Estrutura e implementação:** Descreva brevemente a estrutura desses arquivos e como a tela de edição é implementada, seguindo os princípios do `CLAUDE.md` (modularidade, API-first, UI full-screen).
    3.  **Comparação:** Se possível, compare a implementação com a do módulo de estudantes (`student-editor.html`, `students.js`) para destacar semelhanças e diferenças na abordagem.'
*   **Confirmação Necessária:** 'Este prompt melhorado está correto? Posso prosseguir?'

Esta regra está ativa para todas as interações futuras.