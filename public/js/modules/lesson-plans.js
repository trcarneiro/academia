// lesson-plans.js
// Módulo de Planos de Aulas

(function() {
    window.initializeLessonPlansModule = function() {
        const container = document.getElementById('lessonPlansContainer');
        if (!container) {
            console.error('lessonPlansContainer não encontrado');
            return;
        }
        
        console.log('📚 Initializing Lesson Plans Module...');
        
        container.innerHTML = `
            <div class="lesson-plans-container">
                <div class="lesson-plans-header">
                    <h2>Planos de Aulas</h2>
                    <button id="newLessonPlanBtn" class="btn btn-primary">
                        <span class="icon">+</span>
                        Novo Plano de Aula
                    </button>
                </div>
                
                <div class="lesson-plans-filters">
                    <select id="courseFilter" class="form-select">
                        <option value="">Todos os Cursos</option>
                        <option value="krav-maga">Krav Maga</option>
                        <option value="defesa-pessoal">Defesa Pessoal</option>
                    </select>
                    
                    <select id="levelFilter" class="form-select">
                        <option value="">Todos os Níveis</option>
                        <option value="faixa-branca">Faixa Branca</option>
                        <option value="faixa-azul">Faixa Azul</option>
                        <option value="faixa-roxa">Faixa Roxa</option>
                        <option value="faixa-marrom">Faixa Marrom</option>
                        <option value="faixa-preta">Faixa Preta</option>
                    </select>
                </div>
                
                <div id="lessonPlansList" class="lesson-plans-grid">
                    <div class="empty-state">
                        <p>Nenhum plano de aula cadastrado</p>
                        <button class="btn btn-outline" onclick="document.getElementById('newLessonPlanBtn').click()">
                            Criar primeiro plano
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('newLessonPlanBtn').addEventListener('click', createNewLessonPlan);
        
        console.log('✅ Lesson Plans Module loaded successfully');
    };
    
    function createNewLessonPlan() {
        console.log('📝 Creating new lesson plan...');
        // TODO: Implement lesson plan creation modal/form
        alert('Funcionalidade de criar novo plano de aula será implementada em breve!');
    }
})();
