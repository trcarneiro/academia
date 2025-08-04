
// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Logs a message to the console only if it includes specific emojis.
 * @param {string} message - The message to log.
 * @param {...any} args - Additional arguments to log.
 */
function logQuiet(message, ...args) {
    if (message.includes('✅') || message.includes('❌') || message.includes('⚠️')) {
        // console.log(message, ...args);
    }
}

/**
 * Gets a color based on a category.
 * @param {string} category - The category name.
 * @returns {string} The hex color code.
 */
function getCategoryColor(category) {
    const colors = {
        'STANCE': '#3B82F6',
        'STRIKE': '#EF4444',
        'DEFENSE': '#10B981',
        'GRAPPLING': '#8B5CF6',
        'COMBO': '#F59E0B',
        'MOVEMENT': '#06B6D4',
        'SCENARIO': '#EC4899',
        'CONDITIONING': '#84CC16'
    };
    return colors[category] || '#6B7280';
}

/**
 * Gets an icon based on a category.
 * @param {string} category - The category name.
 * @returns {string} The emoji icon.
 */
function getCategoryIcon(category) {
    const icons = {
        'STANCE': '🥋',
        'STRIKE': '👊',
        'DEFENSE': '🛡️',
        'GRAPPLING': '🤼',
        'COMBO': '⚡',
        'MOVEMENT': '🏃',
        'SCENARIO': '🎭',
        'CONDITIONING': '💪'
    };
    return icons[category] || '🥊';
}

/**
 * Gets the name of a category.
 * @param {string} category - The category key.
 * @returns {string} The category name.
 */
function getCategoryName(category) {
    const names = {
        'STANCE': 'Postura',
        'STRIKE': 'Golpe',
        'DEFENSE': 'Defesa',
        'GRAPPLING': 'Agarramento',
        'COMBO': 'Combinação',
        'MOVEMENT': 'Movimento',
        'SCENARIO': 'Cenário',
        'CONDITIONING': 'Condicionamento'
    };
    return names[category] || category;
}

/**
 * Gets a color based on a level.
 * @param {string} level - The level name.
 * @returns {string} The hex color code.
 */
function getLevelColor(level) {
    const colors = {
        'BEGINNER': '#10B981',
        'INTERMEDIATE': '#F59E0B',
        'ADVANCED': '#EF4444',
        'EXPERT': '#8B5CF6'
    };
    return colors[level] || '#6B7280';
}

/**
 * Gets the number of stars for a given level.
 * @param {string} level - The level name.
 * @returns {number} The number of stars.
 */
function getLevelStars(level) {
    const stars = {
        'BEGINNER': 1,
        'INTERMEDIATE': 2,
        'ADVANCED': 3,
        'EXPERT': 4
    };
    return stars[level] || 1;
}

/**
 * Gets the name of a level.
 * @param {string} level - The level key.
 * @returns {string} The level name.
 */
function getLevelName(level) {
    const names = {
        'BEGINNER': 'Iniciante',
        'INTERMEDIATE': 'Intermediário',
        'ADVANCED': 'Avançado',
        'EXPERT': 'Expert'
    };
    return names[level] || level;
}

/**
 * Gets an icon for a file extension.
 * @param {string} filename - The name of the file.
 * @returns {string} The emoji icon.
 */
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'txt': '📄',
        'md': '📋'
    };
    return icons[ext] || '📁';
}

/**
 * Formats a file size in bytes to a human-readable string.
 * @param {number} bytes - The file size in bytes.
 * @returns {string} The formatted file size.
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Gets a color for a given status.
 * @param {string} status - The status name.
 * @returns {string} The hex color code.
 */
function getStatusColor(status) {
    const colors = {
        'APPROVED': '#10B981',
        'PENDING': '#F59E0B',
        'REJECTED': '#EF4444'
    };
    return colors[status] || '#6B7280';
}

/**
 * Gets the name of a status.
 * @param {string} status - The status key.
 * @returns {string} The status name.
 */
function getStatusName(status) {
    const names = {
        'APPROVED': 'Aprovada',
        'PENDING': 'Pendente',
        'REJECTED': 'Rejeitada'
    };
    return names[status] || status;
}

/**
 * Pauses execution for a given number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise<void>} A promise that resolves after the given time.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Converts a hex color code to an RGB string.
 * @param {string} hex - The hex color code.
 * @returns {string} The RGB color string.
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
        '59, 130, 246';
}

/**
 * Shows a notification toast.
 * @param {string} message - The message to display.
 * @param {('info'|'success'|'error'|'warning')} type - The type of notification.
 */
function showNotification(message, type = 'info') {
    const colors = {
        success: '#10B981',
        error: '#EF4444',
        info: '#3B82F6',
        warning: '#F59E0B'
    };

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 1000;
        background: ${colors[type]}; color: white; padding: 1rem 1.5rem;
        border-radius: 8px; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translateX(100%); transition: transform 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Slide in
    setTimeout(() => notification.style.transform = 'translateX(0)', 100);

    // Auto remove
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Generates a unique ID.
 * @returns {string} A unique ID string.
 */
function generateId() {
    return 'kb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}
