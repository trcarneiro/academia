import RAGEngine from './index.js';
import DocumentIndexer from './document-indexer.js';

export async function initializeRAG() {
  try {
    // First index all documents
    await DocumentIndexer.indexProject();
    
    // Then initialize the RAG engine
    await RAGEngine.initialize();
    
    // Make RAG available globally
    if (typeof window !== 'undefined') {
      window.RAG = RAGEngine;
    }
    
    console.log('RAG system initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize RAG system:', error);
    return false;
  }
}

// Auto-initialize in development
if (process.env.NODE_ENV === 'development') {
  initializeRAG();
}
