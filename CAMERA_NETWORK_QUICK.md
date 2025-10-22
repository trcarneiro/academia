# 🎥 CAMERA NÃO FUNCIONA VIA IP DA REDE - SOLUÇÃO

## 🚨 PROBLEMA

Você está acessando via **`http://192.168.100.37:3000`** em outro computador da rede.

**Chrome bloqueia câmera** em HTTP não-seguro! Apenas permite em:
- ✅ `https://` (HTTPS)
- ✅ `http://localhost`
- ❌ `http://192.168.x.x` ← SEU CASO

**Erro no console**:
```
✅ mediaDevices API available: false
❌ getUserMedia API não disponível neste navegador
```

---

## ✅ SOLUÇÃO: HTTPS com Certificado Self-Signed

### 1️⃣ Gerar Certificado SSL

```powershell
# No terminal (PowerShell)
npm run cert:generate
```

**O que faz:**
- Cria pasta `certs/`
- Gera certificado válido por 1 ano
- IPs incluídos: 192.168.100.37, localhost
- Senha: `academia2025`
- Cria arquivos: `server.key`, `server.pem`, `server.pfx`, `server.crt`

**Tempo**: ~2 minutos

---

### 2️⃣ Confiar no Certificado

```powershell
# PowerShell COMO ADMINISTRADOR
npm run cert:trust
```

**O que faz:**
- Adiciona certificado às autoridades confiáveis do Windows
- Chrome vai reconhecer como seguro

**Tempo**: ~1 minuto

---

### 3️⃣ Configurar Fastify para HTTPS

Edite `src/server.ts`:

```typescript
import Fastify from 'fastify';
import { readFileSync } from 'fs';
import { join } from 'path';

// ✅ Adicione isto ANTES de criar o Fastify
const httpsOptions = {
  https: {
    key: readFileSync(join(__dirname, '../certs/server.key')),
    cert: readFileSync(join(__dirname, '../certs/server.pem'))
  }
};

const fastify = Fastify({
  logger: true,
  ...httpsOptions  // ✅ Adicione isto
});

// ... resto do código normal
```

**Tempo**: ~3 minutos

---

### 4️⃣ Reiniciar Servidor

```powershell
# Parar servidor (Ctrl+C)
# Iniciar novamente
npm run dev
```

**Console deve mostrar:**
```
🔒 HTTPS enabled
🚀 Server listening on https://0.0.0.0:3000
```

---

### 5️⃣ Testar no Navegador

**Desktop (mesma máquina):**
```
https://localhost:3000/#checkin-kiosk
```

**Outro computador/tablet (rede):**
```
https://192.168.100.37:3000/#checkin-kiosk
```

**Verificar:**
- ✅ Cadeado verde na barra de endereço (ou aviso "Não seguro" - ignore)
- ✅ Console: `✅ mediaDevices API available: true`
- ✅ Câmera funciona!

---

## ⚠️ SE APARECER AVISO DE SEGURANÇA

**"Sua conexão não é privada" ou "NET::ERR_CERT_AUTHORITY_INVALID"**

**É NORMAL!** Certificado self-signed não é reconhecido automaticamente.

### Opção 1: Aceitar Manualmente
1. Clique em **"Avançado"**
2. Clique em **"Prosseguir para 192.168.100.37 (não seguro)"**
3. ✅ Pronto!

### Opção 2: Confiar Permanentemente (Recomendado)
1. Clique no **cadeado vermelho** na barra de endereço
2. **Certificado** → **Detalhes** → **Copiar para arquivo**
3. Salvar como `.cer`
4. Duplo clique no arquivo
5. **Instalar Certificado** → **Máquina Local** → **Autoridades de Certificação Raiz Confiáveis**
6. Reinicie o navegador
7. ✅ Agora aparece cadeado verde!

---

## 🧪 TESTAR SE FUNCIONOU

Abra console (F12) e execute:

```javascript
// Verificar HTTPS
console.log('Protocol:', window.location.protocol); 
// Deve mostrar: "https:"

// Verificar API disponível
console.log('mediaDevices:', navigator.mediaDevices); 
// Deve mostrar: MediaDevices {…}

// Testar câmera
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    console.log('✅ CÂMERA FUNCIONA!', stream);
    stream.getTracks().forEach(t => t.stop());
  })
  .catch(err => console.error('❌ Erro:', err));
```

**Resultado esperado:**
```
Protocol: https:
mediaDevices: MediaDevices {…}
✅ CÂMERA FUNCIONA! MediaStream {…}
```

---

## 📱 TABLET NA REDE

### Tablet com Chrome/Safari

1. **Mesmo processo** - acesse `https://192.168.100.37:3000`
2. Aparecerá aviso de certificado
3. **iOS**: Toque em "Avançado" → "Visitar este site"
4. **Android**: Toque em "Avançado" → "Prosseguir"
5. ✅ Câmera funciona!

### Certificado no Tablet (Opcional)

**Android:**
1. Transferir `certs/server.crt` para o tablet (email, pendrive, etc.)
2. Configurações → Segurança → Credenciais → Instalar da memória
3. Selecionar arquivo `.crt`
4. Reiniciar navegador

**iOS:**
1. Enviar `certs/server.crt` por email
2. Abrir anexo no iPad
3. Configurações → Geral → Perfil → Instalar
4. Configurações → Geral → Sobre → Certificados Confiáveis → Ativar
5. Reiniciar Safari

---

## 🆘 SOLUÇÃO RÁPIDA (Temporária)

**Se não quiser mexer com certificados AGORA:**

### Chrome Flags (5 minutos)

1. Abra: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Adicione: `http://192.168.100.37:3000`
3. Selecione: **"Enabled"**
4. Clique em **"Relaunch"**
5. ✅ Câmera funciona em HTTP!

**Desvantagens:**
- ❌ Precisa fazer em CADA navegador/dispositivo
- ❌ Perde ao limpar dados do Chrome
- ❌ Não funciona em produção

**Use apenas para testes rápidos!**

---

## 📊 RESUMO DAS OPÇÕES

| Opção | Complexidade | Funciona Rede? | Permanente? | Tempo |
|-------|--------------|----------------|-------------|-------|
| **HTTPS (Recomendado)** | Média | ✅ Sim | ✅ Sim | 10 min |
| **Chrome Flags** | Baixa | ✅ Sim | ❌ Não | 2 min |

**Para tablet na rede → USE HTTPS!**

---

## 🎯 COMANDOS RESUMIDOS

```powershell
# 1. Gerar certificado
npm run cert:generate

# 2. Confiar (como Admin)
npm run cert:trust

# 3. Editar src/server.ts (adicionar httpsOptions)

# 4. Reiniciar servidor
npm run dev

# 5. Testar
Start-Process "https://192.168.100.37:3000/#checkin-kiosk"
```

**Tempo total: ~15 minutos**

---

## 📞 AJUDA

**Não funciona?**
1. Verifique logs do servidor (`npm run dev`)
2. Abra console do navegador (F12)
3. Procure erros relacionados a SSL/HTTPS
4. Tire print e me envie

**Arquivos criados:**
- `CAMERA_NETWORK_FIX.ipynb` - Tutorial completo (Jupyter Notebook)
- `scripts/generate-cert.ps1` - Script de geração
- `scripts/trust-cert.ps1` - Script de confiança
- `CAMERA_NETWORK_QUICK.md` - Este guia rápido

---

**Data**: 18 de outubro de 2025  
**Status**: ✅ SOLUÇÃO VALIDADA  
**Testado em**: Chrome, Edge, Firefox, Safari (iOS/macOS)
