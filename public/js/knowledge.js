// ==========================================
// KNOWLEDGE BASE MODULE
// ==========================================

// State variables
let knowledgeBase = [];
let ragChunks = [];
let uploadedDocuments = [];
let currentUploadTab = 'documents';

// Make variables globally accessible if needed (or manage through module exports)
window.ragChunks = ragChunks;

/**
 * Saves the current knowledge base and RAG chunks to localStorage.
 */
export function saveKnowledgeBaseToStorage() {
    try {
        localStorage.setItem('academiaKnowledgeBase', JSON.stringify(knowledgeBase));
        localStorage.setItem('academiaRAGChunks', JSON.stringify(ragChunks));
        console.log('💾 Base de conhecimento salva no localStorage');
    } catch (error) {
        console.error('❌ Erro ao salvar base de conhecimento:', error);
    }
}

/**
 * Loads the knowledge base and RAG chunks from localStorage.
 * @returns {boolean} True if data was loaded, false otherwise.
 */
export function loadKnowledgeBaseFromStorage() {
    try {
        const storedKnowledgeBase = localStorage.getItem('academiaKnowledgeBase');
        const storedRAGChunks = localStorage.getItem('academiaRAGChunks');
        
        if (storedKnowledgeBase) {
            knowledgeBase = JSON.parse(storedKnowledgeBase);
            console.log('📚 Base de conhecimento carregada do localStorage:', knowledgeBase.length, 'itens');
        }
        
        if (storedRAGChunks) {
            ragChunks = JSON.parse(storedRAGChunks);
            console.log('🧠 Chunks RAG carregados do localStorage:', ragChunks.length, 'chunks');
        } else if (knowledgeBase.length > 0) {
            // Regenerate chunks if knowledge base exists but chunks don't
            // This assumes generateRAGChunks is available in this module
            generateRAGChunks();
        }
        
        return knowledgeBase.length > 0;
    } catch (error) {
        console.error('❌ Erro ao carregar base de conhecimento:', error);
        return false;
    }
}

/**
 * Clears the knowledge base and RAG chunks from state and localStorage.
 */
export function clearKnowledgeBaseStorage() {
    try {
        localStorage.removeItem('academiaKnowledgeBase');
        localStorage.removeItem('academiaRAGChunks');
        knowledgeBase = [];
        ragChunks = [];
        console.log('🗑️ Base de conhecimento limpa do localStorage');
    } catch (error) {
        console.error('❌ Erro ao limpar base de conhecimento:', error);
    }
}

// NOTE: The following functions are placeholders.
// Their actual definitions need to be moved here from index.html

function generateRAGChunks() {
    console.warn('generateRAGChunks() is not yet implemented in knowledge.js');
}

function updateKnowledgeBaseStats() {
    console.warn('updateKnowledgeBaseStats() is not yet implemented in knowledge.js');
}

function searchKnowledgeContentInMain(query) {
    console.warn('searchKnowledgeContentInMain() is not yet implemented in knowledge.js', query);
}

function displayKnowledgeContentInMain() {
    console.warn('displayKnowledgeContentInMain() is not yet implemented in knowledge.js');
}

function openDocumentUploader() {
    console.warn('openDocumentUploader() is not yet implemented in knowledge.js');
}


// ==========================================
// PUBLIC API for the Knowledge Module
// These functions will be attached to the window object for HTML onclick handlers
// ==========================================

export function openKnowledgeUploader() {
    console.log('📚 Abrindo base de conhecimento...');
    try {
        openDocumentUploader();
    } catch (error) {
        console.error('❌ Erro ao abrir document uploader:', error);
        alert('Erro ao abrir o modal de upload. Verifique o console.');
    }
};

export function testRAGSystem() {
    console.log('🗺️ Abrindo teste RAG...');
    const ragTestModal = document.getElementById('ragTestModal');
    if (ragTestModal) {
        ragTestModal.classList.add('active');
    } else {
        console.error('RAG test modal not found');
    }
};

export function reindexKnowledgeBase() {
    console.log('⚡ Reindexando base...');
    try {
        if (typeof generateRAGChunks === 'function') {
            generateRAGChunks();
        }
        if (typeof updateKnowledgeBaseStats === 'function') {
            updateKnowledgeBaseStats();
        }
        if (typeof window.showToast === 'function') {
            window.showToast('Base reindexada!', 'success');
        }
    } catch (error) {
        console.error('❌ Erro ao reindexar:', error);
    }
};

export function searchKnowledgeBase() {
    console.log('🔍 Buscando...');
    try {
        const query = document.getElementById('knowledgeSearchInput')?.value.trim();
        if (query && typeof searchKnowledgeContentInMain === 'function') {
            searchKnowledgeContentInMain(query);
        } else if (typeof displayKnowledgeContentInMain === 'function') {
            displayKnowledgeContentInMain();
        }
    } catch (error) {
        console.error('❌ Erro na busca:', error);
    }
};
