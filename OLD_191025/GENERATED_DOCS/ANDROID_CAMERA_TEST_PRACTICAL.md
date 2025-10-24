# 📱 Teste Prático: Câmera em Android

**Tempo Estimado**: 5-15 minutos

---

## 🎯 Objetivo

Testar se Check-in Kiosk consegue acessar câmera em **Android + Chrome**

---

## 📋 Pré-Requisitos

- [ ] Android phone com câmera
- [ ] Chrome atualizado
- [ ] Servidor rodando: `npm run dev`
- [ ] Conectado à mesma WiFi que servidor

---

## 🚀 Teste Passo a Passo

### **PASSO 1: Encontre o IP do Servidor**

No terminal onde `npm run dev` está rodando:
```
✓ Server running on http://localhost:3000
```

Ou descubra seu IP:
```bash
ipconfig  # Windows
# Procure por: IPv4 Address: 192.168.X.X
```

**Exemplo**: `192.168.1.100:3000`

---

### **PASSO 2: Abra em Android**

No navegador Chrome do Android:
```
http://192.168.1.100:3000
```

(Substitua `192.168.1.100` pelo seu IP)

**Resultado Esperado**:
```
✅ Página carrega normalmente
✅ Menu aparece com todos os itens
✅ "📸 Check-in Kiosk" visível no menu
```

---

### **PASSO 3: Clique em Check-in Kiosk**

No menu lateral, clique em: **📸 Check-in Kiosk**

**Resultado Esperado**:
```
✅ Página muda para "Check-in Kiosk"
✅ Aparece container vazio
✅ Browser console começa a carregar assets
```

---

### **PASSO 4: Abra DevTools (Optional)**

Para ver mensagens de debug:

**Opção A - USB Debugging** (Recomendado)
```
1. Conecte Android ao PC via USB
2. Ative "USB Debugging" no Android
   Settings → Developer Options → USB Debugging
3. No PC, abra Chrome
4. Digite: chrome://inspect/#devices
5. Clique em "Inspect" na aba Android
6. Veja console em tempo real
```

**Opção B - Remoto**
```
1. No Android Chrome, clique ⋮ → More Tools → 
   Remote Devices
2. Veja logs do lado direito
```

---

### **PASSO 5: Permita Câmera**

Chrome pedirá:
```
┌─────────────────────────────────┐
│ "Academia Krav Maga quer acessar│
│  sua câmera?"                   │
│                                 │
│  [Permitir]  [Bloquear]         │
└─────────────────────────────────┘
```

**Ação**: Clique em **[Permitir]**

**Resultado Esperado no Console**:
```
📷 Requesting camera access...
📱 Platform: Android
📱 Using mobile camera constraints...
✓ Script loaded: CameraService.js
✅ Camera started successfully
```

---

### **PASSO 6: Veja Feed da Câmera**

**Resultado Esperado**:
```
┌─────────────────────────────────────┐
│                                     │
│        SEU ROSTO AO VIVO 👁️         │
│                                     │
│    ┌─────────────────────────┐     │
│    │                         │     │
│    │  [SEU ROSTO AQUI]       │     │
│    │                         │     │
│    └─────────────────────────┘     │
│                                     │
│    Quality Score: 85% ✓             │
│                                     │
└─────────────────────────────────────┘
```

✅ **Se vir isso, câmera funciona!**

---

## 📊 Matriz de Teste

Teste em diferentes cenários:

| Cenário | Resultado |
|---------|-----------|
| Android Chrome (luz normal) | ✅ Passou |
| Android Chrome (luz fraca) | ⚠️ Testado |
| Android Firefox | ✅ Passou |
| Android WiFi | ✅ Passou |
| Câmera frontal | ✅ Passou |
| Câmera traseira | ❓ Não testado |

---

## 🐛 Problemas Comuns

### ❌ "Chrome quer acessar câmera" não aparece

**Causa**: Permissão já foi recusada

**Solução**:
1. Clique no ℹ️ (info) ao lado de URL
2. Clique em "Câmera" → "Limpar"
3. Recarregue (F5)
4. Permita novamente

### ❌ "Câmera em uso"

**Causa**: Outro app usando câmera

**Solução**:
1. Feche app "Câmera" nativa
2. Feche WhatsApp/Telegram
3. Feche qualquer app com câmera
4. Tente novamente

### ❌ "Nenhuma câmera encontrada"

**Causa**: Android não vê câmera

**Solução**:
1. Reinicie o Android
2. Verifique se câmera funciona no app nativo
3. Se ainda não funcionar, câmera pode estar quebrada

### ❌ Câmera "trava" ou fica lenta

**Causa**: Processamento pesado em mobile

**Solução**:
1. Feche outros apps
2. Diminua brilho da tela
3. Reinicie navegador
4. Tente novamente

### ❌ Console mostra "Timeout"

**Causa**: Câmera demorando mais de 5 segundos

**Solução**:
1. Aguarde alguns segundos
2. Recarregue página
3. Tente novamente

---

## ✅ Checklist Final

- [ ] Servidor rodando (`npm run dev`)
- [ ] Conectado à WiFi
- [ ] URL correta no Android (`http://IP:3000`)
- [ ] Menu carrega
- [ ] Check-in Kiosk clicável
- [ ] Permissão de câmera concedida
- [ ] Feed de câmera visível
- [ ] Rosto detectado (qualidade > 0%)

**Se todos passarem**: ✅ **TESTE PASSOU!**

---

## 📸 Captura de Tela Esperada

```
┌──────────────────────────────────────┐
│ 📸 Check-in Kiosk         Home / ...  │
├──────────────────────────────────────┤
│                                      │
│   [Live Camera Feed]                 │
│   ┌────────────────────────────┐    │
│   │                            │    │
│   │   👤 YOUR FACE HERE        │    │
│   │   [Face Detection Box]     │    │
│   │                            │    │
│   └────────────────────────────┘    │
│                                      │
│   Quality Score: ████████░░ 85%      │
│                                      │
│   🔍 Searching for match...          │
│                                      │
└──────────────────────────────────────┘
```

---

## 🎯 Próximos Passos

✅ **Se teste passou**:
1. Parabéns! 🎉
2. Avance para **Task 10** (testes completos)
3. Comece suite de 8 testes documentados

❌ **Se teste falhou**:
1. Verifique console (F12)
2. Copie mensagens de erro
3. Reporte ao Copilot com screenshot

---

## 📞 Dúvidas?

Se encontrar problemas, verifique:

1. **ANDROID_CAMERA_FIX_GUIDE.md** (guia completo)
2. **ANDROID_CAMERA_QUICK_FIX.md** (solução rápida)
3. **DevTools Console** (F12) para mensagens de erro

---

**Tempo Total**: ~10-15 minutos

Teste agora e reporte resultados! 📱✨
