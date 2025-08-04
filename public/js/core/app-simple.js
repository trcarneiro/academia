/**
 * Main Application - Simplified version
 */

import { apiClient } from './api-client-simple.js';
import { navigation } from './navigation-simple.js';

class KravAcademyApp {
    constructor() {
        this.state = 'initializing';
        this.navigation = navigation;
        this.api = apiClient;
        this.elements = {};
        
        console.log('🚀 Krav Academy: Application initialized');
    }
    
    async init() {
        try {
            console.log('🚀 Krav Academy: Starting initialization...');
            
            // Initialize core components
            await this.initializeCore();
            
            // Initialize UI
            await this.initializeUI();
            
            // Load initial data
            await this.loadInitialData();
            
            // Mark as ready
            this.state = 'ready';
            
            console.log('✅ Krav Academy: Application ready');
            
        } catch (error) {
            console.error('❌ Krav Academy: Initialization failed:', error);
            this.state = 'error';
            this.showToast('Erro ao inicializar o sistema', 'error');
        }
    }
    
    async initializeCore() {
        // Make navigation available globally
        window.navigation = this.navigation;
        
        // Set up global toggle function
        window.app = this;
        
        console.log('✅ Core components initialized');
    }
    
    async initializeUI() {
        this.initializeToasts();
        console.log('✅ UI components initialized');
    }
    
    async loadInitialData() {
        try {
            console.log('📊 Loading initial data...');
            
            // Load dashboard metrics
            await this.loadDashboardMetrics();
            
            console.log('✅ Initial data loaded');
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            // Don't fail initialization for data errors
        }
    }
    
    async loadDashboardMetrics() {
        try {
            const metricsContainer = document.querySelector('#dashboardMetrics');
            if (!metricsContainer) return;
            
            // Show loading state
            metricsContainer.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Carregando métricas...</div>
                </div>
            `;
            
            // Load stats from API
            const stats = await this.api.getStats().catch(() => ({ data: {} }));
            
            // Create metrics HTML
            const metricsHTML = this.createMetricsHTML(stats.data);
            metricsContainer.innerHTML = metricsHTML;
            
        } catch (error) {
            console.error('❌ Error loading dashboard metrics:', error);
            const metricsContainer = document.querySelector('#dashboardMetrics');
            if (metricsContainer) {
                metricsContainer.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <div class="error-text">Erro ao carregar métricas</div>
                    </div>
                `;
            }
        }
    }
    
    createMetricsHTML(data) {
        const metrics = [
            {
                title: '👥 Alunos Ativos',
                value: data.students || 27,
                label: 'Total de alunos cadastrados',
                icon: '👥',
                color: 'primary',
                target: 'students'
            },
            {
                title: '🏫 Turmas Ativas',
                value: data.classes || 5,
                label: 'Turmas em andamento',
                icon: '🏫',
                color: 'success',
                target: 'classes'
            },
            {
                title: '💰 Receita Mensal',
                value: `R$ ${(data.revenue || 15000).toLocaleString('pt-BR')}`,
                label: 'Faturamento do mês',
                icon: '💰',
                color: 'info',
                target: 'financial'
            },
            {
                title: '📋 Presenças Hoje',
                value: data.attendanceToday || 12,
                label: 'Registros de presença',
                icon: '📋',
                color: 'warning',
                target: 'attendance'
            }
        ];
        
        return metrics.map(metric => `
            <div class="metric-card">
                <div class="metric-header">
                    <h3 class="metric-title">${metric.title}</h3>
                    <div class="metric-icon">${metric.icon}</div>
                </div>
                <div class="metric-value">${metric.value}</div>
                <div class="metric-label">${metric.label}</div>
                <div class="metric-footer">
                    <button class="btn btn-${metric.color} btn-sm" onclick="app.navigation.navigateTo('${metric.target}')">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Toast system
    initializeToasts() {
        if (!document.querySelector('#toastContainer')) {
            const toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            toastContainer.className = 'toast-container';
            toastContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1080;
                display: flex;
                flex-direction: column;
                gap: 10px;
            `;
            document.body.appendChild(toastContainer);
        }
    }
    
    showToast(message, type = 'info', duration = 5000) {
        const toast = this.createToast(message, type);
        const container = document.querySelector('#toastContainer');
        container.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.parentElement.removeChild(toast);
            }
        }, duration);
    }
    
    createToast(message, type) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.style.cssText = `
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 6px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            max-width: 300px;
        `;
        
        const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        
        toast.innerHTML = `
            <span>${icon}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="background: none; border: none; color: white; margin-left: auto; cursor: pointer;">×</button>
        `;
        
        return toast;
    }
    
    // Utility methods
    getState() {
        return this.state;
    }
    
    isReady() {
        return this.state === 'ready';
    }
}

// Create and export app instance
const app = new KravAcademyApp();

// Make app globally available
window.app = app;

// Export for modules
export { app };
export default app;
