/**
 * Enhanced Kiosk Features
 * Melhorias visuais para o kiosk existente
 */

// Wait for the main kiosk to load and then enhance it
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the main kiosk to initialize
    setTimeout(() => {
        enhanceKioskVisuals();
    }, 1000);
});

function enhanceKioskVisuals() {
    // Enhance progress bar animation
    enhanceProgressBar();
    
    // Add AI recommendations
    addAIRecommendations();
    
    // Add staggered animations to stat cards
    animateStatCards();
}

function enhanceProgressBar() {
    const attendanceElement = document.getElementById('attendance-rate');
    if (!attendanceElement) return;
    
    // Get current attendance percentage
    const attendanceText = attendanceElement.textContent;
    const percentage = parseInt(attendanceText) || 0;
    
    // Find or create progress bar
    const progressFill = document.getElementById('attendance-progress-fill');
    if (progressFill) {
        // Animate the progress bar
        setTimeout(() => {
            progressFill.style.width = `${Math.min(percentage, 100)}%`;
        }, 500);
    }
}

function addAIRecommendations() {
    const container = document.getElementById('ai-recommendations');
    if (!container) return;
    
    // Generate recommendations based on visible data
    const recommendations = generateSmartRecommendations();
    
    container.innerHTML = recommendations.map((rec, index) => `
        <div class="recommendation-card ${rec.priority}-priority" style="animation-delay: ${index * 0.1}s">
            <div class="recommendation-header">
                <div class="recommendation-icon">
                    <i class="${rec.icon}"></i>
                </div>
                <div class="recommendation-content">
                    <h4>${rec.title}</h4>
                    <p>${rec.description}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function generateSmartRecommendations() {
    const recommendations = [];
    
    // Get attendance rate from the page
    const attendanceElement = document.getElementById('attendance-rate');
    const attendanceRate = attendanceElement ? parseInt(attendanceElement.textContent) || 0 : 0;
    
    // Get classes this month
    const classesElement = document.getElementById('classes-month');
    const classesThisMonth = classesElement ? parseInt(classesElement.textContent) || 0 : 0;
    
    // Attendance-based recommendations
    if (attendanceRate < 70) {
        recommendations.push({
            priority: 'high',
            title: 'Melhore sua Frequência',
            description: `Sua frequência está em ${attendanceRate}%. Tente manter pelo menos 80% para melhor progresso!`,
            icon: 'fas fa-calendar-exclamation'
        });
    } else if (attendanceRate >= 90) {
        recommendations.push({
            priority: 'normal',
            title: 'Excelente Frequência!',
            description: `Parabéns! Sua frequência de ${attendanceRate}% é exemplar. Continue assim!`,
            icon: 'fas fa-trophy'
        });
    } else if (attendanceRate >= 80) {
        recommendations.push({
            priority: 'normal',
            title: 'Boa Frequência!',
            description: `${attendanceRate}% de frequência é muito bom! Tente chegar aos 90% para ser exemplar.`,
            icon: 'fas fa-thumbs-up'
        });
    }
    
    // Progress-based recommendations
    if (classesThisMonth === 0) {
        recommendations.push({
            priority: 'high',
            title: 'Primeira Aula do Mês',
            description: 'Que tal começar o mês com força total? Faça sua primeira aula hoje!',
            icon: 'fas fa-play-circle'
        });
    } else if (classesThisMonth >= 12) {
        recommendations.push({
            priority: 'low',
            title: 'Guerreiro Incansável!',
            description: `${classesThisMonth} aulas este mês! Considere um dia de descanso para recuperação.`,
            icon: 'fas fa-bed'
        });
    } else if (classesThisMonth < 5) {
        recommendations.push({
            priority: 'normal',
            title: 'Aumente o Ritmo',
            description: `${classesThisMonth} aulas este mês. Que tal aumentar a frequência para evoluir mais rápido?`,
            icon: 'fas fa-arrow-up'
        });
    }
    
    // Equipment/Store recommendations
    recommendations.push({
        priority: 'low',
        title: 'Equipamentos de Treino',
        description: 'Considere adquirir equipamentos próprios para treinar em casa também!',
        icon: 'fas fa-shopping-bag'
    });
    
    // Generic motivation if no specific recommendations
    if (recommendations.length === 0) {
        recommendations.push({
            priority: 'normal',
            title: 'Continue Praticando!',
            description: 'Você está indo bem! Mantenha a consistência nos treinos para evoluir sempre.',
            icon: 'fas fa-fist-raised'
        });
    }
    
    // Return maximum 3 recommendations
    return recommendations.slice(0, 3);
}

function animateStatCards() {
    const statCards = document.querySelectorAll('.stat-card-enhanced');
    statCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.1}s`;
        card.classList.add('animate-in');
    });
}

// Export functions for global access
window.enhanceKioskVisuals = enhanceKioskVisuals;
window.enhanceProgressBar = enhanceProgressBar;
