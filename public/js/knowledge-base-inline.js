// ==========================================
// KNOWLEDGE BASE SYSTEM - EXTRACTED FROM INDEX.HTML
// ==========================================

// Global variables
let knowledgeBase = [];
let ragChunks = [];
let uploadedDocuments = [];
let currentUploadTab = 'documents';

// Make variables globally accessible
window.knowledgeBase = knowledgeBase;
window.ragChunks = ragChunks;
window.uploadedDocuments = uploadedDocuments;

// ==========================================
// KNOWLEDGE BASE PERSISTENCE FUNCTIONS
// ==========================================

// Save knowledge base to localStorage
function saveKnowledgeBaseToStorage() {
    try {
        localStorage.setItem('academiaKnowledgeBase', JSON.stringify(knowledgeBase));
        localStorage.setItem('academiaRAGChunks', JSON.stringify(ragChunks));
    } catch (error) {
        console.error('Error saving knowledge base:', error);
    }
}

// Load knowledge base from localStorage
function loadKnowledgeBaseFromStorage() {
    try {
        const storedKnowledgeBase = localStorage.getItem('academiaKnowledgeBase');
        const storedRAGChunks = localStorage.getItem('academiaRAGChunks');

        if (storedKnowledgeBase) {
            knowledgeBase = JSON.parse(storedKnowledgeBase);
        }

        if (storedRAGChunks) {
            ragChunks = JSON.parse(storedRAGChunks);
        } else if (knowledgeBase.length > 0) {
            // Regenerate chunks if knowledge base exists but chunks don't
            generateRAGChunks();
        }

        return knowledgeBase.length > 0;
    } catch (error) {
        console.error('Error loading knowledge base:', error);
        return false;
    }
}

// Clear knowledge base from localStorage
function clearKnowledgeBaseStorage() {
    try {
        localStorage.removeItem('academiaKnowledgeBase');
        localStorage.removeItem('academiaRAGChunks');
        knowledgeBase = [];
        ragChunks = [];
    } catch (error) {
        console.error('Error clearing knowledge base:', error);
    }
}

// Make functions globally accessible
window.loadKnowledgeBaseFromStorage = loadKnowledgeBaseFromStorage;
window.clearKnowledgeBaseStorage = clearKnowledgeBaseStorage;
window.saveKnowledgeBaseToStorage = saveKnowledgeBaseToStorage;

// Define essential functions immediately
window.openKnowledgeUploader = function() {
    try {
        openDocumentUploader();
    } catch (error) {
        console.error('Error opening knowledge uploader:', error);
    }
};

window.reindexKnowledgeBase = function() {
    try {
        if (typeof generateRAGChunks === 'function') {
            generateRAGChunks();
        }
        if (typeof updateKnowledgeBaseStats === 'function') {
            updateKnowledgeBaseStats();
        }
        if (typeof showToast === 'function') {
            showToast('Base reindexada!', 'success');
        }
    } catch (error) {
        console.error('Error reindexing knowledge base:', error);
    }
};

// ==========================================
// RAG CHUNK GENERATION
// ==========================================

function generateRAGChunks() {
    console.log('🧠 Generating RAG chunks from knowledge base...');
    ragChunks = [];
    
    knowledgeBase.forEach(item => {
        if (item.content && item.content.length > 0) {
            // Split content into chunks
            const chunks = splitIntoChunks(item.content, 500); // 500 chars per chunk
            chunks.forEach((chunk, index) => {
                ragChunks.push({
                    id: `${item.id}_${index}`,
                    sourceId: item.id,
                    sourceTitle: item.title,
                    content: chunk,
                    type: item.type,
                    tags: item.tags || [],
                    embedding: null // Will be populated later if needed
                });
            });
        }
    });
    
    console.log(`✅ Generated ${ragChunks.length} RAG chunks`);
    saveKnowledgeBaseToStorage();
}

function splitIntoChunks(text, maxLength) {
    const chunks = [];
    let currentChunk = '';
    
    const sentences = text.split(/[.!?]+/);
    
    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > maxLength) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = sentence;
        } else {
            currentChunk += sentence + '.';
        }
    }
    
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

// ==========================================
// KNOWLEDGE BASE OPERATIONS
// ==========================================

function addToKnowledgeBase(item) {
    if (!item.id) {
        item.id = Date.now().toString();
    }
    
    knowledgeBase.push(item);
    generateRAGChunks();
    
    if (typeof updateKnowledgeBaseStats === 'function') {
        updateKnowledgeBaseStats();
    }
    
    console.log('✅ Added item to knowledge base:', item.title);
}

function removeFromKnowledgeBase(itemId) {
    const index = knowledgeBase.findIndex(item => item.id === itemId);
    if (index > -1) {
        knowledgeBase.splice(index, 1);
        generateRAGChunks();
        
        if (typeof updateKnowledgeBaseStats === 'function') {
            updateKnowledgeBaseStats();
        }
        
        console.log('✅ Removed item from knowledge base:', itemId);
    }
}

function searchKnowledgeBase(query) {
    const results = [];
    const searchTerms = query.toLowerCase().split(' ');
    
    ragChunks.forEach(chunk => {
        const content = chunk.content.toLowerCase();
        let score = 0;
        
        searchTerms.forEach(term => {
            if (content.includes(term)) {
                score += 1;
            }
        });
        
        if (score > 0) {
            results.push({
                ...chunk,
                score
            });
        }
    });
    
    return results.sort((a, b) => b.score - a.score);
}

// ==========================================
// DOCUMENT UPLOAD FUNCTIONS
// ==========================================

function openDocumentUploader() {
    console.log('Opening document uploader...');
    // This would typically open a modal or dedicated upload interface
    // For now, we'll just log the action
}

function processUploadedDocument(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const content = e.target.result;
            
            const document = {
                id: Date.now().toString(),
                title: file.name,
                content: content,
                type: file.type,
                uploadDate: new Date().toISOString(),
                tags: []
            };
            
            addToKnowledgeBase(document);
            resolve(document);
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

// ==========================================
// STATS AND UI FUNCTIONS
// ==========================================

function updateKnowledgeBaseStats() {
    const totalItems = knowledgeBase.length;
    const totalChunks = ragChunks.length;
    const totalDocuments = knowledgeBase.filter(item => item.type === 'document').length;
    
    // Update UI elements if they exist
    const statsElements = {
        'kb-total-items': totalItems,
        'kb-total-chunks': totalChunks,
        'kb-total-documents': totalDocuments
    };
    
    Object.entries(statsElements).forEach(([elementId, value]) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    });
    
    console.log('📊 Knowledge Base Stats:', {
        totalItems,
        totalChunks,
        totalDocuments
    });
}

// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.addToKnowledgeBase = addToKnowledgeBase;
window.removeFromKnowledgeBase = removeFromKnowledgeBase;
window.searchKnowledgeBase = searchKnowledgeBase;
window.generateRAGChunks = generateRAGChunks;
window.updateKnowledgeBaseStats = updateKnowledgeBaseStats;
window.processUploadedDocument = processUploadedDocument;

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🧠 Knowledge Base System loaded');
    
    // Load existing knowledge base
    if (loadKnowledgeBaseFromStorage()) {
        console.log('✅ Knowledge base loaded from storage');
        updateKnowledgeBaseStats();
    } else {
        console.log('📝 No existing knowledge base found');
    }
});

console.log('📚 Knowledge Base inline system initialized');