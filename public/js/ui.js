// Funções de manipulação de UI

/**
 * Displays a toast notification message.
 * @param {string} message The message to display.
 * @param {'info'|'success'|'error'|'warning'} type The type of toast notification.
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('Toast container not found!');
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-body">
            <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="toast-text">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.removeChild(toast);
        }, 500); // Wait for fade out animation
    }, duration);
}

/**
 * Toggles the sidebar visibility.
 */
export function toggleSidebar() {
    const container = document.getElementById('dashboardContainer');
    container.classList.toggle('collapsed');
}

/**
 * Shows or hides a specific content section.
 * @param {string} sectionId - The ID of the section to show.
 */
export function showSection(sectionId) {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.style.display = 'none';
    });

    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.style.display = 'block';
    } else {
        console.warn(`Section with ID "${sectionId}" not found.`);
    }
}
