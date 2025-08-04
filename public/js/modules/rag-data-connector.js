(function() {
    'use strict';
    
    // RAG Data Connector - Integração com APIs do Sistema
    console.log('🔗 Initializing RAG Data Connector...');
    
    // Estado do conector
    let apiCache = new Map();
    let lastCacheUpdate = null;
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
    
    // Configuração das APIs disponíveis
    const API_ENDPOINTS = {
        students: {
            list: '/api/students',
            detail: '/api/students/{id}',
            financial: '/api/students/{id}/financials',
            courses: '/api/students/{id}/courses',
            attendance: '/api/students/{id}/attendance'
        },
        financial: {
            plans: '/api/financial/plans',
            subscriptions: '/api/financial/subscriptions',
            summary: '/api/financial/summary',
            overdue: '/api/financial/overdue'
        },
        courses: {
            list: '/api/courses',
            detail: '/api/courses/{id}',
            attendance: '/api/courses/{id}/attendance',
            progress: '/api/courses/{id}/progress'
        },
        analytics: {
            dashboard: '/api/analytics/dashboard',
            students: '/api/analytics/students',
            financial: '/api/analytics/financial'
        },
        techniques: {
            list: '/api/techniques',
            categories: '/api/techniques/categories'
        }
    };
    
    // Mapeamento de intenções para APIs relevantes
    const INTENT_API_MAP = {
        'financial': ['financial', 'students'],
        'students': ['students', 'financial'],
        'courses': ['courses', 'students'],
        'attendance': ['attendance', 'students', 'courses'],
        'techniques': ['techniques'],
        'analytics': ['analytics', 'students', 'financial']
    };
    
    // Palavras-chave para detecção de intenção
    const INTENT_KEYWORDS = {
        financial: ['financeiro', 'pagamento', 'inadimplente', 'receita', 'plano', 'mensalidade', 'assinatura'],
        students: ['aluno', 'estudante', 'matricula', 'cadastro', 'perfil'],
        courses: ['curso', 'aula', 'conteudo', 'modulo', 'programa'],
        attendance: ['frequencia', 'presença', 'falta', 'checkin', 'comparecimento'],
        techniques: ['tecnica', 'movimento', 'golpe', 'defesa', 'ataque', 'krav maga'],
        analytics: ['relatorio', 'estatistica', 'analise', 'metricas', 'dashboard', 'resumo']
    };
    
    // ==========================================
    // CORE RAG DATA CONNECTOR FUNCTIONS
    // ==========================================
    
    // Função principal de consulta híbrida
    async function hybridQuery(question, context = {}) {
        console.log('🤖 Processing hybrid query:', question);
        
        try {
            // 1. Detectar intenção da pergunta
            const intent = detectQueryIntent(question);
            console.log('🎯 Detected intent:', intent);
            
            // 2. Buscar em documentos (RAG atual)
            const docResults = await searchDocumentKnowledge(question);
            
            // 3. Buscar dados em tempo real nas APIs
            const apiResults = await fetchLiveData(intent, question, context);
            
            // 4. Combinar e gerar resposta inteligente
            const response = await generateHybridResponse(question, docResults, apiResults, intent);
            
            return response;
            
        } catch (error) {
            console.error('❌ Error in hybrid query:', error);
            return {
                success: false,
                error: error.message,
                fallback: await searchDocumentKnowledge(question)
            };
        }
    }
    
    // Detectar intenção da consulta baseada em palavras-chave
    function detectQueryIntent(question) {
        const lowerQuestion = question.toLowerCase();
        const detectedIntents = [];
        
        // Analisar palavras-chave de cada categoria
        Object.entries(INTENT_KEYWORDS).forEach(([intent, keywords]) => {
            const matchCount = keywords.filter(keyword => 
                lowerQuestion.includes(keyword)
            ).length;
            
            if (matchCount > 0) {
                detectedIntents.push({ intent, confidence: matchCount / keywords.length });
            }
        });
        
        // Retornar intenção com maior confiança
        if (detectedIntents.length > 0) {
            detectedIntents.sort((a, b) => b.confidence - a.confidence);
            return detectedIntents[0].intent;
        }
        
        return 'general'; // Fallback para consulta geral
    }
    
    // Buscar dados em tempo real nas APIs
    async function fetchLiveData(intent, question, context = {}) {
        console.log('📡 Fetching live data for intent:', intent);
        
        const relevantAPIs = INTENT_API_MAP[intent] || ['students'];
        const apiData = {};
        
        // Buscar dados em paralelo das APIs relevantes
        const fetchPromises = relevantAPIs.map(async apiGroup => {
            try {
                const groupData = await fetchAPIGroupData(apiGroup, context);
                apiData[apiGroup] = groupData;
            } catch (error) {
                console.warn(`⚠️ Failed to fetch ${apiGroup} data:`, error.message);
                apiData[apiGroup] = { error: error.message };
            }
        });
        
        await Promise.all(fetchPromises);
        
        return {
            intent,
            timestamp: new Date().toISOString(),
            data: apiData
        };
    }
    
    // Buscar dados de um grupo específico de APIs
    async function fetchAPIGroupData(apiGroup, context = {}) {
        const endpoints = API_ENDPOINTS[apiGroup];
        if (!endpoints) {
            throw new Error(`Unknown API group: ${apiGroup}`);
        }
        
        const groupData = {};
        
        // Buscar dados principais de cada endpoint
        switch (apiGroup) {
            case 'students':
                groupData.list = await fetchWithCache('/api/students');
                groupData.summary = await generateStudentsSummary(groupData.list);
                break;
                
            case 'financial':
                groupData.plans = await fetchWithCache('/api/financial/plans');
                groupData.summary = await fetchWithCache('/api/financial/summary');
                break;
                
            case 'courses':
                groupData.list = await fetchWithCache('/api/courses');
                groupData.summary = await generateCoursesSummary(groupData.list);
                break;
                
            case 'analytics':
                groupData.dashboard = await fetchWithCache('/api/analytics/dashboard');
                break;
                
            case 'techniques':
                groupData.list = await fetchWithCache('/api/techniques');
                break;
        }
        
        return groupData;
    }
    
    // Fazer fetch com cache inteligente
    async function fetchWithCache(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // Verificar cache válido
        if (apiCache.has(cacheKey)) {
            const cached = apiCache.get(cacheKey);
            const now = Date.now();
            
            if (now - cached.timestamp < CACHE_DURATION) {
                console.log('📦 Using cached data for:', url);
                return cached.data;
            }
        }
        
        try {
            console.log('🌐 Fetching fresh data from:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache the result
            apiCache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
            
        } catch (error) {
            console.error(`❌ Error fetching ${url}:`, error);
            throw error;
        }
    }
    
    // ==========================================
    // DATA ANALYSIS FUNCTIONS
    // ==========================================
    
    // Gerar resumo dos alunos
    async function generateStudentsSummary(studentsData) {
        if (!studentsData || !studentsData.success) {
            return { error: 'No students data available' };
        }
        
        const students = studentsData.data || [];
        
        return {
            total: students.length,
            active: students.filter(s => s.isActive).length,
            inactive: students.filter(s => !s.isActive).length,
            categories: {
                ADULT: students.filter(s => s.category === 'ADULT').length,
                TEEN: students.filter(s => s.category === 'TEEN').length,
                CHILD: students.filter(s => s.category === 'CHILD').length
            },
            recentRegistrations: students
                .filter(s => new Date(s.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                .length
        };
    }
    
    // Gerar resumo dos cursos
    async function generateCoursesSummary(coursesData) {
        if (!coursesData || !coursesData.success) {
            return { error: 'No courses data available' };
        }
        
        const courses = coursesData.data || [];
        
        return {
            total: courses.length,
            active: courses.filter(c => c.active).length,
            levels: {
                BEGINNER: courses.filter(c => c.category === 'BEGINNER').length,
                INTERMEDIATE: courses.filter(c => c.category === 'INTERMEDIATE').length,
                ADVANCED: courses.filter(c => c.category === 'ADVANCED').length
            }
        };
    }
    
    // ==========================================
    // RESPONSE GENERATION
    // ==========================================
    
    // Gerar resposta híbrida inteligente
    async function generateHybridResponse(question, docResults, apiResults, intent) {
        console.log('🧠 Generating hybrid response for intent:', intent);
        
        const response = {
            success: true,
            question,
            intent,
            timestamp: new Date().toISOString(),
            sources: {
                documents: docResults?.results?.length || 0,
                apis: Object.keys(apiResults.data).length
            }
        };
        
        // Gerar resposta baseada na intenção
        switch (intent) {
            case 'financial':
                response.answer = await generateFinancialResponse(apiResults, docResults);
                break;
                
            case 'students':
                response.answer = await generateStudentsResponse(apiResults, docResults);
                break;
                
            case 'courses':
                response.answer = await generateCoursesResponse(apiResults, docResults);
                break;
                
            case 'techniques':
                response.answer = await generateTechniquesResponse(apiResults, docResults);
                break;
                
            default:
                response.answer = await generateGeneralResponse(apiResults, docResults, question);
        }
        
        return response;
    }
    
    // Resposta financeira
    async function generateFinancialResponse(apiResults, docResults) {
        const financialData = apiResults.data.financial;
        const studentsData = apiResults.data.students;
        
        if (!financialData || financialData.error) {
            return "❌ Não foi possível acessar dados financeiros no momento.";
        }
        
        let response = "💰 **SITUAÇÃO FINANCEIRA DA ACADEMIA**\n\n";
        
        // Dados dos planos
        if (financialData.plans?.success) {
            const plans = financialData.plans.data;
            response += `📋 **Planos Disponíveis**: ${plans.length}\n`;
            
            if (plans.length > 0) {
                const activePlans = plans.filter(p => p.isActive);
                response += `• Planos Ativos: ${activePlans.length}\n`;
                
                // Plano mais popular (assumindo baseado no preço)
                const popularPlan = plans.reduce((prev, current) => 
                    (prev.price < current.price) ? prev : current
                );
                response += `• Plano Mais Popular: ${popularPlan.name} - R$ ${popularPlan.price}\n`;
            }
        }
        
        // Dados dos alunos
        if (studentsData?.summary) {
            const summary = studentsData.summary;
            response += `\n👥 **Alunos**: ${summary.active} ativos de ${summary.total} total\n`;
            response += `• Adultos: ${summary.categories.ADULT || 0}\n`;
            response += `• Adolescentes: ${summary.categories.TEEN || 0}\n`;
            response += `• Crianças: ${summary.categories.CHILD || 0}\n`;
            
            if (summary.recentRegistrations > 0) {
                response += `• Novas matrículas (30 dias): ${summary.recentRegistrations}\n`;
            }
        }
        
        // Adicionar insights dos documentos se disponível
        if (docResults && docResults.length > 0) {
            response += "\n📚 **Informações dos Documentos**:\n";
            docResults.slice(0, 2).forEach(doc => {
                response += `• ${doc.sourceTitle}: ${doc.content.substring(0, 100)}...\n`;
            });
        }
        
        return response;
    }
    
    // Resposta sobre alunos
    async function generateStudentsResponse(apiResults, docResults) {
        const studentsData = apiResults.data.students;
        
        if (!studentsData || studentsData.error) {
            return "❌ Não foi possível acessar dados dos alunos no momento.";
        }
        
        let response = "👥 **GESTÃO DE ALUNOS**\n\n";
        
        if (studentsData.summary) {
            const summary = studentsData.summary;
            response += `📊 **Resumo Geral**:\n`;
            response += `• Total: ${summary.total} alunos\n`;
            response += `• Ativos: ${summary.active} (${Math.round(summary.active/summary.total*100)}%)\n`;
            response += `• Inativos: ${summary.inactive}\n\n`;
            
            response += `📈 **Por Categoria**:\n`;
            response += `• Adultos: ${summary.categories.ADULT || 0}\n`;
            response += `• Adolescentes: ${summary.categories.TEEN || 0}\n`;
            response += `• Crianças: ${summary.categories.CHILD || 0}\n`;
            
            if (summary.recentRegistrations > 0) {
                response += `\n🆕 **Matrículas Recentes (30 dias)**: ${summary.recentRegistrations}\n`;
            }
        }
        
        return response;
    }
    
    // Resposta sobre cursos
    async function generateCoursesResponse(apiResults, docResults) {
        const coursesData = apiResults.data.courses;
        
        let response = "📚 **GESTÃO DE CURSOS**\n\n";
        
        if (coursesData?.summary) {
            const summary = coursesData.summary;
            response += `📊 **Resumo Geral**:\n`;
            response += `• Total: ${summary.total} cursos\n`;
            response += `• Ativos: ${summary.active}\n\n`;
            
            response += `📈 **Por Nível**:\n`;
            response += `• Iniciante: ${summary.levels.BEGINNER || 0}\n`;
            response += `• Intermediário: ${summary.levels.INTERMEDIATE || 0}\n`;
            response += `• Avançado: ${summary.levels.ADVANCED || 0}\n`;
        }
        
        // Adicionar informações do PDF de curso se disponível
        if (docResults && docResults.length > 0) {
            response += "\n📋 **Conteúdo dos Documentos de Curso**:\n";
            docResults.slice(0, 2).forEach(doc => {
                response += `• ${doc.sourceTitle.substring(0, 50)}...\n`;
            });
        }
        
        return response;
    }
    
    // Resposta sobre técnicas
    async function generateTechniquesResponse(apiResults, docResults) {
        const techniquesData = apiResults.data.techniques;
        
        let response = "🥋 **BASE DE TÉCNICAS KRAV MAGA**\n\n";
        
        if (techniquesData?.list?.success) {
            const techniques = techniquesData.list.data;
            response += `📊 **Técnicas Cadastradas**: ${techniques.length}\n`;
            
            // Agrupar por categoria
            const categories = {};
            techniques.forEach(tech => {
                const cat = tech.category || 'OUTROS';
                categories[cat] = (categories[cat] || 0) + 1;
            });
            
            response += "\n📈 **Por Categoria**:\n";
            Object.entries(categories).forEach(([cat, count]) => {
                response += `• ${cat}: ${count} técnicas\n`;
            });
        }
        
        // Adicionar técnicas dos documentos RAG
        if (docResults && docResults.length > 0) {
            response += "\n📚 **Técnicas Identificadas nos Documentos**:\n";
            docResults.slice(0, 3).forEach(doc => {
                response += `• ${doc.content.substring(0, 80)}...\n`;
            });
        }
        
        return response;
    }
    
    // Resposta geral
    async function generateGeneralResponse(apiResults, docResults, question) {
        let response = "🤖 **ASSISTENTE DA ACADEMIA**\n\n";
        
        response += `❓ **Sua Pergunta**: ${question}\n\n`;
        
        // Resumo dos dados disponíveis
        response += "📊 **Dados Disponíveis**:\n";
        Object.entries(apiResults.data).forEach(([source, data]) => {
            if (data && !data.error) {
                response += `• ✅ ${source.toUpperCase()}: Dados atualizados\n`;
            } else {
                response += `• ❌ ${source.toUpperCase()}: ${data?.error || 'Não disponível'}\n`;
            }
        });
        
        // Resultados dos documentos
        if (docResults && docResults.length > 0) {
            response += `\n📚 **Documentos Relacionados**: ${docResults.length} encontrados\n`;
        }
        
        response += "\n💡 **Dica**: Seja mais específico para obter informações detalhadas sobre alunos, cursos, finanças ou técnicas.";
        
        return response;
    }
    
    // ==========================================
    // UTILITY FUNCTIONS
    // ==========================================
    
    // Buscar conhecimento em documentos (integração com RAG atual)
    async function searchDocumentKnowledge(question) {
        try {
            if (window.searchKnowledgeBase) {
                return window.searchKnowledgeBase(question);
            } else {
                console.warn('⚠️ Knowledge base search not available');
                return [];
            }
        } catch (error) {
            console.error('❌ Error searching document knowledge:', error);
            return [];
        }
    }
    
    // Limpar cache quando necessário
    function clearCache() {
        apiCache.clear();
        lastCacheUpdate = null;
        console.log('🧹 API cache cleared');
    }
    
    // Verificar saúde das APIs
    async function checkAPIHealth() {
        const healthCheck = {
            timestamp: new Date().toISOString(),
            apis: {}
        };
        
        // Testar endpoints principais
        const endpoints = ['/api/students', '/api/courses', '/api/financial/plans'];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                healthCheck.apis[endpoint] = {
                    status: response.ok ? 'healthy' : 'error',
                    responseTime: Date.now() - performance.now()
                };
            } catch (error) {
                healthCheck.apis[endpoint] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
        
        return healthCheck;
    }
    
    // ==========================================
    // EXPORTS
    // ==========================================
    
    // Exportar funções globalmente
    window.RAGDataConnector = {
        hybridQuery,
        fetchLiveData,
        generateHybridResponse,
        clearCache,
        checkAPIHealth,
        detectQueryIntent
    };
    
    // Função de consulta rápida
    window.askRAG = hybridQuery;
    
    // Função de teste rápido
    window.testRAGConnector = async function() {
        console.log('🧪 Testing RAG Data Connector...');
        
        const testQueries = [
            "Como está nossa situação financeira?",
            "Quantos alunos temos ativos?",
            "Quais cursos estão disponíveis?",
            "Mostre as técnicas de Krav Maga"
        ];
        
        for (const query of testQueries) {
            console.log(`\n🔍 Testing: "${query}"`);
            try {
                const result = await hybridQuery(query);
                console.log('✅ Result:', result.answer?.substring(0, 200) + '...');
            } catch (error) {
                console.error('❌ Error:', error.message);
            }
        }
    };
    
    console.log('✅ RAG Data Connector initialized successfully');
    
})();