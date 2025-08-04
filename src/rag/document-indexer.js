import fs from 'fs';
import path from 'path';

class DocumentIndexer {
  constructor() {
    this.index = {
      modules: {},
      documentation: {},
      schemas: {},
      apis: {}
    };
  }

  async indexProject() {
    // Index documentation files
    await this.indexDirectory('docs', 'documentation');
    
    // Index API definitions
    await this.indexDirectory('src/routes', 'apis');
    
    // Index schemas
    await this.indexDirectory('src/schemas', 'schemas');
    
    // Save index
    await this.saveIndex();
  }

  async indexDirectory(dirPath, indexType) {
    const fullPath = path.join(process.cwd(), dirPath);
    
    if (!fs.existsSync(fullPath)) {
      console.warn(`Directory not found: ${dirPath}`);
      return;
    }

    const files = fs.readdirSync(fullPath);
    
    for (const file of files) {
      if (file.endsWith('.md') || file.endsWith('.js') || file.endsWith('.ts')) {
        const filePath = path.join(fullPath, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const moduleName = path.basename(file, path.extname(file));
        
        this.index[indexType][moduleName] = {
          path: filePath,
          content: content.substring(0, 1000) + '...', // Store first 1000 chars
          lastUpdated: fs.statSync(filePath).mtime
        };
      }
    }
  }

  async saveIndex() {
    const indexPath = path.join(process.cwd(), 'public/data/rag-index.json');
    fs.writeFileSync(indexPath, JSON.stringify(this.index, null, 2));
    console.log(`RAG index saved to: ${indexPath}`);
  }
}

export default new DocumentIndexer();
