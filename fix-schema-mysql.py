#!/usr/bin/env python3
"""
Script para converter schema Prisma de PostgreSQL para MySQL.
Converte String[] e Json[] para Json @default("[]") apenas em campos de dados.
NÃO modifica relações entre modelos.
"""

import re

# Ler o schema
with open('prisma/schema.prisma', 'r', encoding='utf-8') as f:
    content = f.read()

# Lista de campos que devem ser convertidos (campos de dados, não relações)
# Padrão: Nome do campo seguido por String[] ou Json[]
# Isso NÃO deve pegar linhas de relação (que não têm tipo explícito ou têm apenas o nome do modelo)

# Converter String[] para Json @default("[]")
# Regex: encontra linhas com "  fieldName String[]" e substitui por "  fieldName Json @default("[]")"
content = re.sub(
    r'(\s+\w+\s+)String\[\](\s*)$',
    r'\1Json @default("[]")\2',
    content,
    flags=re.MULTILINE
)

# Converter Json[] para Json @default("[]")
content = re.sub(
    r'(\s+\w+\s+)Json\[\](\s*)$',
    r'\1Json @default("[]")\2',
    content,
    flags=re.MULTILINE
)

# Salvar o schema corrigido
with open('prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Schema convertido para MySQL!")
print("   - String[] → Json @default('[]')")
print("   - Json[] → Json @default('[]')")
