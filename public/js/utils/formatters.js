/**
 * Data Formatters Module
 * Utilities for formatting data display
 */

class Formatters {
    /**
     * Format date to Brazilian format
     */
    static formatDate(date, options = {}) {
        if (!date) return '-';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';

        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'America/Sao_Paulo',
            ...options
        };

        return dateObj.toLocaleDateString('pt-BR', defaultOptions);
    }

    /**
     * Format date and time
     */
    static formatDateTime(date, options = {}) {
        if (!date) return '-';
        
        const defaultOptions = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
            ...options
        };

        return this.formatDate(date, defaultOptions);
    }

    /**
     * Format time only
     */
    static formatTime(date) {
        if (!date) return '-';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';

        return dateObj.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });
    }

    /**
     * Format relative time (e.g., "2 days ago")
     */
    static formatRelativeTime(date) {
        if (!date) return '-';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '-';

        const now = new Date();
        const diffMs = now - dateObj;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffSeconds < 60) {
            return 'agora mesmo';
        } else if (diffMinutes < 60) {
            return `${diffMinutes}m atrás`;
        } else if (diffHours < 24) {
            return `${diffHours}h atrás`;
        } else if (diffDays < 7) {
            return `${diffDays}d atrás`;
        } else {
            return this.formatDate(date);
        }
    }

    /**
     * Format currency (Brazilian Real)
     */
    static formatCurrency(value, currency = 'BRL') {
        if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currency
        }).format(value);
    }

    /**
     * Format number with locale
     */
    static formatNumber(value, options = {}) {
        if (value === null || value === undefined || isNaN(value)) return '0';

        const defaultOptions = {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
            ...options
        };

        return new Intl.NumberFormat('pt-BR', defaultOptions).format(value);
    }

    /**
     * Format percentage
     */
    static formatPercentage(value, decimals = 1) {
        if (value === null || value === undefined || isNaN(value)) return '0%';

        return `${this.formatNumber(value, { 
            minimumFractionDigits: decimals, 
            maximumFractionDigits: decimals 
        })}%`;
    }

    /**
     * Format phone number (Brazilian format)
     */
    static formatPhone(phone) {
        if (!phone) return '-';
        
        // Remove all non-digits
        const digits = phone.replace(/\D/g, '');
        
        if (digits.length === 11) {
            // Mobile: (11) 99999-9999
            return `(${digits.substr(0, 2)}) ${digits.substr(2, 5)}-${digits.substr(7, 4)}`;
        } else if (digits.length === 10) {
            // Landline: (11) 9999-9999
            return `(${digits.substr(0, 2)}) ${digits.substr(2, 4)}-${digits.substr(6, 4)}`;
        } else {
            return phone;
        }
    }

    /**
     * Format CPF (Brazilian document)
     */
    static formatCPF(cpf) {
        if (!cpf) return '-';
        
        const digits = cpf.replace(/\D/g, '');
        
        if (digits.length === 11) {
            return `${digits.substr(0, 3)}.${digits.substr(3, 3)}.${digits.substr(6, 3)}-${digits.substr(9, 2)}`;
        } else {
            return cpf;
        }
    }

    /**
     * Format CEP (Brazilian postal code)
     */
    static formatCEP(cep) {
        if (!cep) return '-';
        
        const digits = cep.replace(/\D/g, '');
        
        if (digits.length === 8) {
            return `${digits.substr(0, 5)}-${digits.substr(5, 3)}`;
        } else {
            return cep;
        }
    }

    /**
     * Format student status with badge
     */
    static formatStudentStatus(status) {
        const statusMap = {
            'active': { label: 'Ativo', class: 'success', icon: '✅' },
            'inactive': { label: 'Inativo', class: 'secondary', icon: '⏸️' },
            'suspended': { label: 'Suspenso', class: 'warning', icon: '⚠️' },
            'graduated': { label: 'Formado', class: 'info', icon: '🎓' },
            'defaulted': { label: 'Inadimplente', class: 'danger', icon: '⚡' }
        };

        const statusInfo = statusMap[status] || { label: status || 'Desconhecido', class: 'secondary', icon: '❓' };
        
        return `<span class="badge ${statusInfo.class}">
            ${statusInfo.icon} ${statusInfo.label}
        </span>`;
    }

    /**
     * Format belt level with emoji
     */
    static formatBeltLevel(level) {
        const beltMap = {
            'white': '⚪ Faixa Branca',
            'yellow': '🟡 Faixa Amarela', 
            'orange': '🟠 Faixa Laranja',
            'green': '🟢 Faixa Verde',
            'blue': '🔵 Faixa Azul',
            'brown': '🟤 Faixa Marrom',
            'black': '⚫ Faixa Preta'
        };

        return beltMap[level] || level || 'Não definido';
    }

    /**
     * Format attendance percentage with color
     */
    static formatAttendancePercentage(percentage) {
        if (percentage === null || percentage === undefined) return '-';
        
        const percent = parseFloat(percentage);
        let colorClass = 'text-success';
        
        if (percent < 70) {
            colorClass = 'text-danger';
        } else if (percent < 85) {
            colorClass = 'text-warning';
        }

        return `<span class="${colorClass}">${this.formatPercentage(percent)}</span>`;
    }

    /**
     * Format file size
     */
    static formatFileSize(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        
        return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
    }

    /**
     * Format duration (in minutes)
     */
    static formatDuration(minutes) {
        if (!minutes || minutes === 0) return '0 min';
        
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
        } else {
            return `${mins}m`;
        }
    }

    /**
     * Format text with character limit
     */
    static truncateText(text, limit = 50, suffix = '...') {
        if (!text) return '-';
        
        if (text.length <= limit) return text;
        
        return text.substring(0, limit) + suffix;
    }

    /**
     * Format class schedule
     */
    static formatSchedule(schedule) {
        if (!schedule) return '-';
        
        if (typeof schedule === 'string') {
            return schedule;
        }
        
        if (schedule.days && schedule.time) {
            const days = Array.isArray(schedule.days) ? schedule.days.join(', ') : schedule.days;
            return `${days} às ${schedule.time}`;
        }
        
        return JSON.stringify(schedule);
    }

    /**
     * Format address
     */
    static formatAddress(address) {
        if (!address) return '-';
        
        if (typeof address === 'string') return address;
        
        const parts = [];
        if (address.street) parts.push(address.street);
        if (address.number) parts.push(address.number);
        if (address.neighborhood) parts.push(address.neighborhood);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        
        return parts.join(', ') || '-';
    }

    /**
     * Format age from birth date
     */
    static formatAge(birthDate) {
        if (!birthDate) return '-';
        
        const birth = new Date(birthDate);
        if (isNaN(birth.getTime())) return '-';
        
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return `${age} anos`;
    }

    /**
     * Format payment status
     */
    static formatPaymentStatus(status) {
        const statusMap = {
            'paid': { label: 'Pago', class: 'success', icon: '✅' },
            'pending': { label: 'Pendente', class: 'warning', icon: '⏳' },
            'overdue': { label: 'Vencido', class: 'danger', icon: '⚡' },
            'cancelled': { label: 'Cancelado', class: 'secondary', icon: '❌' }
        };

        const statusInfo = statusMap[status] || { label: status || 'Desconhecido', class: 'secondary', icon: '❓' };
        
        return `<span class="badge ${statusInfo.class}">
            ${statusInfo.icon} ${statusInfo.label}
        </span>`;
    }

    /**
     * Format plan type
     */
    static formatPlanType(type) {
        const typeMap = {
            'monthly': 'Mensal',
            'quarterly': 'Trimestral',
            'semiannual': 'Semestral',
            'annual': 'Anual',
            'unlimited': 'Ilimitado',
            'trial': 'Experimental'
        };

        return typeMap[type] || type || 'Não definido';
    }
}

// Global access for legacy compatibility
window.Formatters = Formatters;
window.Format = Formatters;