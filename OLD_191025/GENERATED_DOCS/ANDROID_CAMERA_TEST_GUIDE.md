# 📱 Teste do Fix da Câmera Android - Guia Passo-a-Passo

## 🎯 Objetivo

Validar se o fix da câmera está funcionando em dispositivos Android.

---

## 🧪 Teste 1: Desktop (Emulação)

### Mais Rápido e Fácil ⚡

1. **Abrir Chrome/Brave/Edge**
   - Ir para: `http://localhost:3000` ou `http://192.168.X.X:3000`

2. **Abrir DevTools**
   - Pressionar: `F12` ou `Ctrl+Shift+I`

3. **Ativar Device Toolbar**
   - Pressionar: `Ctrl+Shift+M`
   - Ou: DevTools > ⋮ > More tools > Device toolbar

4. **Selecionar Android Device**
   - Clique no dropdown (provavelmente diz "Responsive")
   - Selecione: "Pixel 5" ou outro Android

5. **Ir para Check-in Kiosk**
   - URL: `http://localhost:3000/#checkin-kiosk`

6. **Testar Permissão Negada** (TESTE 1A)
   ```
   • Browser: "Allow camera?"
   • Clique: "Block" ou "Negar"
   • Esperado: ❌ Mensagem "🔒 Permissão de câmera negada..."
   • Esperado: ✅ Botão "🔄 Tentar Novamente"
   ```

7. **Testar Retry após Aceitar Permissão** (TESTE 1B)
   ```
   • Clique: "🔄 Tentar Novamente"
   • Esperado: Botão fica cinza/desativado
   • Esperado: 🔄 Reinicializa o controlador
   • Se não há câmera física: Error "Nenhuma câmera encontrada"
   • (Isso é ok em emulação desktop)
   ```

8. **Verificar Console**
   - DevTools > Console (aba)
   - Procure por:
     ```
     📷 Requesting camera access...
     📱 Platform: Android
     🔄 [1/4] Tentando constraints...
     ✅ Camera acessada com sucesso (variante X)
     ```
   - ✅ Se vir isso: **PASSOU** ✅

---

## 📱 Teste 2: Android Real (Dispositivo Físico)

### Teste Definitivo 🎯

### Pré-requisitos
- [ ] Android phone/tablet
- [ ] Wi-Fi conectado (mesma rede do PC)
- [ ] Câmera do dispositivo funcionando

### Passo 1: Encontrar IP do Servidor

**No PC (Windows PowerShell)**:
```powershell
ipconfig
```
Procure pela seção que tem:
```
IPv4 Address . . . . . . . . . . : 192.168.X.X
```
Exemplo: `192.168.100.37`

**No Mac/Linux Terminal**:
```bash
ifconfig | grep inet
```

### Passo 2: Acessar do Android

1. **Abrir navegador no Android** (Chrome, Brave, Firefox)
2. **Digite a URL**: `http://192.168.100.37:3000`
   - (Substituir `192.168.100.37` pelo seu IP)
3. **Ir para**: Menu → Check-in Kiosk (ou direto: `http://192.168.100.37:3000/#checkin-kiosk`)

### Passo 3: Testar Permissão Negada (TESTE 2A)

```
1. Quando aparecer "Permitir câmera?"
   └─→ Toque em "Negar" ou "Block"

2. Observe a tela
   └─→ ❌ Deve aparecer: "🔒 Permissão de câmera negada."
   └─→ ✅ Deve aparecer: Botão "🔄 Tentar Novamente"

3. Resultado esperado: ✅ PASSOU
```

### Passo 4: Habilitar Câmera em Configurações (TESTE 2B)

```
1. Saia do app/browser
   └─→ Pressione home ou back

2. Abra Configurações (Settings)
   └─→ Android 12: Configurações > Apps > Todos os apps
   └─→ Android 13+: Configurações > Aplicativos

3. Procure pelo navegador (Chrome, Firefox, etc)
   └─→ Toque no nome

4. Vá para "Permissões" (Permissions)
   └─→ Procure por "Câmera" (Camera)
   └─→ Mude para "Permitir" (Allow)

5. Volte para o browser
   └─→ Clique no botão "🔄 Tentar Novamente"

6. Observe
   └─→ ✅ Deve pedir câmera NOVAMENTE
   └─→ Clique "Permitir" dessa vez
   └─→ ✅ Câmera deve iniciar
   └─→ ✅ Video deve aparecer
   └─→ ✅ Face detection deve começar

7. Resultado esperado: ✅ PASSOU
```

### Passo 5: Validar Face Detection (TESTE 2C)

```
1. Com câmera funcionando
   └─→ Posicione seu rosto na área cinza

2. Observe a qualidade
   └─→ ✅ Deve mostrar: "Qualidade: XX%" (aumentando)
   └─→ ✅ Deve mostrar: "✅ Rosto detectado (85%)"

3. Se rosto bem posicionado
   └─→ ✅ Deve encontrar seu registro
   └─→ ✅ Deve mostrar seu nome

4. Resultado esperado: ✅ PASSOU
```

### Passo 6: Testar Câmera em Uso (TESTE 2D - Opcional)

```
1. Abra outro app com câmera (WhatsApp, Zoom, etc)
2. Volte para Check-in Kiosk
3. Observe
   └─→ ❌ Deve mostrar erro
   └─→ ✅ Deve aparecer: Botão "🔄 Tentar Novamente"
4. Feche o outro app
5. Clique "🔄 Tentar Novamente"
6. Observe
   └─→ ✅ Câmera deve funcionar agora
7. Resultado esperado: ✅ PASSOU
```

---

## 📊 Matriz de Testes

| # | Teste | Ação | Esperado | ✅/❌ |
|----|-------|------|----------|-------|
| 1A | Permissão Negada (Emulação) | Clicar "Block" | Mensagem + Retry button | |
| 1B | Retry (Emulação) | Clicar "🔄 Tentar Novamente" | Reinicializa | |
| 1C | Console (Emulação) | Abrir F12 | Logs detalhados em português | |
| 2A | Permissão Negada (Real) | Clicar "Negar" | Mensagem + Retry button | |
| 2B | Habilitar + Retry (Real) | Perm + botão | Câmera funciona | |
| 2C | Face Detection (Real) | Posicionar rosto | Detecta e reconhece | |
| 2D | Camera em Uso (Real) | Abrir outro app | Erro + Retry funciona | |

---

## 🔍 Logs Esperados (F12 Console)

### Sucesso ✅
```
📷 Requesting camera access...
🌐 User Agent: Mozilla/5.0 (Linux; Android 12; Pixel 5)...
📱 Platform: Android
✅ mediaDevices API available: true
📱 Using mobile camera constraints...
🔄 [1/4] Tentando constraints: {"video":true,"audio":false}
✅ Camera acessada com sucesso (variante 1)
📊 Stream obtido com resolução: {"videoTracks":1,"audioTracks":0}
📺 Stream anexado ao elemento video
⏳ Aguardando metadata do video...
✅ Metadata carregado
▶️ Video iniciando playback
✅ Câmera iniciada com sucesso!
📐 Resolução final: 640x480
```

### Erro + Retry ⚠️
```
📷 Requesting camera access...
📱 Platform: Android
🔄 [1/4] Tentando constraints: {"video":true,"audio":false}
⚠️ [1/4] Falhou: NotAllowedError: Permission denied
🤖 Android NotAllowedError - permissão negada pelo usuário
🔄 [2/4] Tentando constraints: ...
⚠️ Todas as variantes falharam!
❌ Erro ao acessar câmera: NotAllowedError Permission denied
```

---

## ❌ Troubleshooting

### Problema: "Câmera não disponível" (genérico, sem retry)
```
❌ Isso significa o fix AINDA NÃO foi aplicado
✅ Solução: 
   1. Hard refresh: Ctrl+F5 (ou Cmd+Shift+R no Mac)
   2. Limpar cache: DevTools > Application > Clear storage
   3. Fechar tab e abrir nova
```

### Problema: Nenhuma câmera encontrada
```
❌ Dispositivo pode não ter câmera
✅ Esperado: Mensagem "❌ Nenhuma câmera encontrada..."
✅ Isso é normal em alguns tablets
✅ Busca manual ainda funciona
```

### Problema: Câmera preta (sem imagem)
```
❌ Possíveis causas:
   • Câmera coberta (limpiar lente)
   • Outra app usando câmera
   • Permissão não completamente ativada
✅ Solução: Clicar "🔄 Tentar Novamente" após fechar outros apps
```

### Problema: Console não mostra logs
```
❌ Isso significa modo developer desativado
✅ Solução (Android):
   1. Ativar Developer Mode:
      Configurações > Sobre > Pressione 7x "Número de versão"
   2. Voltar para Configurações > Opções de Desenvolvedor
   3. Ativar "Depuração via USB"
   4. Conectar PC e abrir Remote DevTools
```

---

## ✅ Checklist Final

- [ ] **Teste 1A Passou**: Permissão negada mostra retry (emulação)
- [ ] **Teste 1B Passou**: Retry funciona (emulação)
- [ ] **Teste 1C Passou**: Console mostra logs (emulação)
- [ ] **Teste 2A Passou**: Permissão negada mostra retry (real)
- [ ] **Teste 2B Passou**: Câmera funciona após retry (real)
- [ ] **Teste 2C Passou**: Face detection funciona (real)
- [ ] **Teste 2D Passou**: Camera em uso detectado (real - opcional)
- [ ] **Nenhum erro de JavaScript**: Console limpo
- [ ] **Performance OK**: Câmera não trava

---

## 📝 Relatório de Teste

Após completar os testes, reporte:

```
Device: [ex: Samsung Galaxy S21]
Android Version: [ex: 12]
Browser: [ex: Chrome 118]
Network: [LAN ou Cloud]

✅ Teste 1A: PASSOU / FALHOU / N/A
✅ Teste 1B: PASSOU / FALHOU / N/A
✅ Teste 1C: PASSOU / FALHOU / N/A
✅ Teste 2A: PASSOU / FALHOU / N/A
✅ Teste 2B: PASSOU / FALHOU / N/A
✅ Teste 2C: PASSOU / FALHOU / N/A
✅ Teste 2D: PASSOU / FALHOU / N/A

Comentários adicionais:
[...]
```

---

## 🎯 Resultado Esperado

Após todos os testes: **7/7 PASSOU** ✅

Se algum falhar: Abrir issue com:
- Device model
- Android version
- Browser
- Screenshot do erro
- Console logs (copiar de F12)

---

**Data**: 17 de outubro de 2025  
**Versão**: 2.0.1  
**Prioridade**: 🔴 CRÍTICA  
**Tempo de Teste**: ~10 minutos (emulação) ou ~15 minutos (real)
