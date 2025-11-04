import fs from 'fs';

const filePath = 'h:/projetos/academia/src/controllers/hybridAgendaController.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Corrigir todas as referências firstName e lastName dentro de instructor
content = content.replace(/instructor\.firstName/g, 'instructor.user.firstName');
content = content.replace(/instructor\.lastName/g, 'instructor.user.lastName');

// Corrigir todos os selects de instructor para incluir user
content = content.replace(
  /instructor: {\s*select: {\s*firstName: true,\s*lastName: true,\s*}\s*}/g,
  `instructor: {
            select: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                }
              }
            }
          }`
);

fs.writeFileSync(filePath, content);
console.log('✅ Arquivo corrigido com sucesso!');