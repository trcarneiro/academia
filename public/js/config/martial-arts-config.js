/**
 * Configuração de Modalidades de Artes Marciais
 * Sistema flexível para diferentes academias
 */

(function() {
    'use strict';

    // Configuração global de modalidades de artes marciais
    window.MartialArtsConfig = {
        // Modalidades disponíveis (pode ser customizado por academia)
        modalidades: {
            'karate': {
                nome: 'Karatê',
                icon: '👊',
                cor: '#FF6B35',
                graduacoes: ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta'],
                categorias: ['Kata', 'Kumite', 'Kihon'],
                origem: 'Japão'
            },
            'judo': {
                nome: 'Judô',
                icon: '🥋',
                cor: '#4169E1',
                graduacoes: ['Branca', 'Amarela', 'Laranja', 'Verde', 'Azul', 'Marrom', 'Preta'],
                categorias: ['Nage-waza', 'Katame-waza', 'Atemi-waza'],
                origem: 'Japão'
            },
            'jiu-jitsu': {
                nome: 'Jiu-Jitsu',
                icon: '🤼',
                cor: '#8B4513',
                graduacoes: ['Branca', 'Azul', 'Roxa', 'Marrom', 'Preta'],
                categorias: ['Posições', 'Finalizações', 'Passagens'],
                origem: 'Brasil/Japão'
            },
            'muay-thai': {
                nome: 'Muay Thai',
                icon: '🥊',
                cor: '#DC143C',
                graduacoes: ['Iniciante', 'Básico', 'Intermediário', 'Avançado', 'Especialista'],
                categorias: ['Clinch', 'Chutes', 'Joelhadas', 'Cotoveladas'],
                origem: 'Tailândia'
            },
            'boxing': {
                nome: 'Boxe',
                icon: '🥊',
                cor: '#B22222',
                graduacoes: ['Iniciante', 'Amador', 'Semi-Pro', 'Profissional'],
                categorias: ['Jab', 'Cross', 'Hook', 'Uppercut'],
                origem: 'Inglaterra'
            },
            'taekwondo': {
                nome: 'Taekwondo',
                icon: '🦵',
                cor: '#FF4500',
                graduacoes: ['Branca', 'Amarela', 'Verde', 'Azul', 'Vermelha', 'Preta'],
                categorias: ['Poomsae', 'Kyorugi', 'Kyeokpa'],
                origem: 'Coreia do Sul'
            },
            'krav-maga': {
                nome: 'Krav Maga',
                icon: '⚔️',
                cor: '#2F4F4F',
                graduacoes: ['P1', 'P2', 'P3', 'P4', 'P5', 'G1', 'G2', 'G3', 'G4', 'G5'],
                categorias: ['Defesa Pessoal', 'Combate', 'Táticas'],
                origem: 'Israel'
            },
            'capoeira': {
                nome: 'Capoeira',
                icon: '🤸',
                cor: '#32CD32',
                graduacoes: ['Crua', 'Amarela', 'Laranja', 'Azul', 'Verde', 'Roxa', 'Marrom', 'Preta'],
                categorias: ['Ginga', 'Ataques', 'Esquivas', 'Acrobacias'],
                origem: 'Brasil'
            },
            'aikido': {
                nome: 'Aikido',
                icon: '🌀',
                cor: '#4682B4',
                graduacoes: ['6º Kyu', '5º Kyu', '4º Kyu', '3º Kyu', '2º Kyu', '1º Kyu', '1º Dan'],
                categorias: ['Irimi', 'Tenkan', 'Kokyu'],
                origem: 'Japão'
            },
            'kung-fu': {
                nome: 'Kung Fu',
                icon: '🐉',
                cor: '#FFD700',
                graduacoes: ['Branca', 'Amarela', 'Verde', 'Azul', 'Marrom', 'Preta'],
                categorias: ['Formas', 'Aplicações', 'Sparring'],
                origem: 'China'
            }
        },

        // Configuração padrão para novas academias
        configuracaoPadrao: {
            modalidadePrincipal: 'krav-maga',
            permitirMultiplasModalidades: true,
            sistemaGraduacao: 'faixas', // 'faixas', 'kyu-dan', 'levels'
            avaliacaoObrigatoria: true,
            idadeMinima: 4,
            idadeMaxima: 99
        },

        // Métodos utilitários
        getModalidade: function(id) {
            return this.modalidades[id] || null;
        },

        getAllModalidades: function() {
            return Object.keys(this.modalidades).map(id => ({
                id: id,
                ...this.modalidades[id]
            }));
        },

        getModalidadesByOrigin: function(origem) {
            return Object.keys(this.modalidades)
                .filter(id => this.modalidades[id].origem === origem)
                .map(id => ({ id: id, ...this.modalidades[id] }));
        },

        getGraduacoes: function(modalidadeId) {
            const modalidade = this.getModalidade(modalidadeId);
            return modalidade ? modalidade.graduacoes : [];
        },

        getCategorias: function(modalidadeId) {
            const modalidade = this.getModalidade(modalidadeId);
            return modalidade ? modalidade.categorias : [];
        },

        // Configuração específica da academia (pode ser sobrescrita)
        academiaConfig: {
            nome: 'Academia de Artes Marciais',
            modalidades: ['krav-maga'], // Modalidades ativas
            logoUrl: '/assets/logo.png',
            cores: {
                primaria: '#10B981',
                secundaria: '#059669',
                acento: '#34D399'
            }
        },

        // Métodos para configuração da academia
        setAcademiaConfig: function(config) {
            this.academiaConfig = { ...this.academiaConfig, ...config };
            this.salvarConfiguracao();
        },

        getAcademiaConfig: function() {
            return this.academiaConfig;
        },

        // Persistência local
        salvarConfiguracao: function() {
            try {
                localStorage.setItem('martialArtsConfig', JSON.stringify(this.academiaConfig));
            } catch (e) {
                console.warn('Não foi possível salvar configuração:', e);
            }
        },

        carregarConfiguracao: function() {
            try {
                const saved = localStorage.getItem('martialArtsConfig');
                if (saved) {
                    this.academiaConfig = { ...this.academiaConfig, ...JSON.parse(saved) };
                }
            } catch (e) {
                console.warn('Não foi possível carregar configuração:', e);
            }
        },

        // Inicialização
        init: function() {
            this.carregarConfiguracao();
            console.log('🥋 Configuração de Artes Marciais carregada');
            
            // Aplicar configurações visuais
            this.aplicarTema();
        },

        aplicarTema: function() {
            const config = this.getAcademiaConfig();
            if (config.cores) {
                document.documentElement.style.setProperty('--primary-color', config.cores.primaria);
                document.documentElement.style.setProperty('--secondary-color', config.cores.secundaria);
                document.documentElement.style.setProperty('--accent-color', config.cores.acento);
            }
        }
    };

    // Inicializar quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.MartialArtsConfig.init());
    } else {
        window.MartialArtsConfig.init();
    }

    console.log('✅ Configuração de Artes Marciais carregada');

})();
