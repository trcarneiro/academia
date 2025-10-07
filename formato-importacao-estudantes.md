# 🎓 Formato de Importação - Estudantes (Asaas)

## 📋 **Formato Atual do CSV (clientes-real.csv)**

O arquivo CSV atual contém os seguintes campos:
```csv
Identificador externo,Nome,Email,Emails adicionais,Celular,Empresa,CPF ou CNPJ,Fone,Rua,Número,Complemento,Bairro,Cidade,CEP,Estado,Valor vencido,Valor pago,Valor a vencer
```

## ✅ **Formato Esperado pelo Sistema**

Para funcionar corretamente com o módulo de importação, o CSV deve ter as seguintes colunas:

### **Obrigatórias:**
- `nome` - Nome completo do aluno
- `email` - Email válido 
- `telefone` - Telefone no formato brasileiro
- `documento` - CPF ou CNPJ
- `endereco` - Endereço completo
- `valor_mensalidade` - Valor da mensalidade

### **Opcionais:**
- `empresa` - Código da empresa

## 🔄 **Mapeamento Necessário**

Para converter o arquivo atual para o formato esperado:

| Campo Atual | Campo Esperado | Observações |
|------------|----------------|-------------|
| `Nome` | `nome` | ✅ Direto |
| `Email` | `email` | ✅ Direto |
| `Celular` | `telefone` | ✅ Usar celular como principal |
| `CPF ou CNPJ` | `documento` | ✅ Direto |
| `Rua + Número + Complemento + Bairro + Cidade + CEP + Estado` | `endereco` | 🔄 Concatenar |
| `Valor a vencer` | `valor_mensalidade` | 🔄 Limpar formatação R$ |
| `Empresa` | `empresa` | ✅ Direto (se existir) |

## 📝 **Exemplo de CSV Correto**

```csv
nome,email,telefone,documento,endereco,valor_mensalidade,empresa
"Eduardo Jose Maria Filho","","","","","0.00",""
"Nathalia Sena Goulart","nathalia.sena.goulart@gmail.com","31999282615","13190484635","Rua Matias Cardoso, 801, 801, Santo Agostinho, Belo Horizonte - Minas Gerais, 30170050, MG","299.99",""
"João Álvaro Barral Morais","joaoalvaro866@gmail.com","38997274912","10740316605","Rua Almirante Alexandrino, 596, Apto 501, Gutierrez, Belo Horizonte - Minas Gerais, 30441036, MG","199.90",""
```

## 🛠️ **Script de Conversão**

Você pode usar este script JavaScript no console do browser para converter o formato:

```javascript
// Função para converter CSV do Asaas para formato do sistema
function converterCSVAsaas() {
    const linhas = document.querySelector('textarea').value.split('\n');
    const cabecalho = linhas[0].split(',');
    
    // Mapear índices das colunas
    const indices = {
        nome: cabecalho.indexOf('Nome'),
        email: cabecalho.indexOf('Email'),
        celular: cabecalho.indexOf('Celular'),
        documento: cabecalho.indexOf('CPF ou CNPJ'),
        rua: cabecalho.indexOf('Rua'),
        numero: cabecalho.indexOf('Número'),
        complemento: cabecalho.indexOf('Complemento'),
        bairro: cabecalho.indexOf('Bairro'),
        cidade: cabecalho.indexOf('Cidade'),
        cep: cabecalho.indexOf('CEP'),
        estado: cabecalho.indexOf('Estado'),
        valorVencer: cabecalho.indexOf('Valor a vencer'),
        empresa: cabecalho.indexOf('Empresa')
    };
    
    let csvConvertido = 'nome,email,telefone,documento,endereco,valor_mensalidade,empresa\n';
    
    for (let i = 1; i < linhas.length; i++) {
        const campos = linhas[i].split(',');
        
        // Montar endereço
        const endereco = [
            campos[indices.rua],
            campos[indices.numero],
            campos[indices.complemento],
            campos[indices.bairro],
            campos[indices.cidade],
            campos[indices.cep],
            campos[indices.estado]
        ].filter(item => item && item.trim()).join(', ');
        
        // Limpar valor monetário
        const valor = campos[indices.valorVencer]?.replace(/[R$\s]/g, '').replace(',', '.') || '0';
        
        csvConvertido += `"${campos[indices.nome] || ''}","${campos[indices.email] || ''}","${campos[indices.celular] || ''}","${campos[indices.documento] || ''}","${endereco}","${valor}","${campos[indices.empresa] || ''}"\n`;
    }
    
    return csvConvertido;
}
```

## 🚀 **Como Usar**

1. **Opção 1 - Conversão Manual:**
   - Abra o arquivo CSV no Excel/LibreOffice
   - Renomeie as colunas conforme o mapeamento
   - Concatene os campos de endereço
   - Limpe a formatação dos valores monetários
   - Salve como CSV

2. **Opção 2 - Script de Conversão:**
   - Cole o conteúdo do CSV em um textarea
   - Execute o script JavaScript
   - Copie o resultado convertido
   - Salve como novo arquivo CSV

3. **Opção 3 - Modificar o Sistema:**
   - Alterar o módulo de importação para aceitar o formato atual do Asaas
   - Fazer o mapeamento automaticamente no código

## ⚠️ **Importante**

- O sistema atualmente espera exatamente os nomes de colunas especificados
- Campos vazios são permitidos, mas `nome` e `email` são obrigatórios para validação
- O formato de telefone deve ser brasileiro (11 dígitos)
- Valores monetários devem estar em formato decimal (sem R$, usar ponto como separador)

## 🔧 **Próximos Passos Recomendados**

1. Modificar o módulo de importação para aceitar múltiplos formatos
2. Criar mapeamento automático de colunas
3. Adicionar preview inteligente que detecta o formato
4. Implementar transformações automáticas (endereço, valores monetários)
