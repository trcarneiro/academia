/**
 * @fileoverview Módulo de Check-in Unificado
 * @description Gerencia o check-in de alunos por matrícula e QR code.
 */

// Estado do módulo
let activeStudentForCheckin = null;
let qrScanner = null;

/**
 * Inicializa os event listeners do módulo de check-in.
 */
export function initCheckin() {
    const searchInput = document.getElementById('checkinSearch');
    const checkinBtn = document.getElementById('checkinBtn');
    const qrBtn = document.getElementById('qrBtn');

    if (searchInput) {
        searchInput.addEventListener('keyup', handleSearchInput);
    }
    if (checkinBtn) {
        checkinBtn.addEventListener('click', performCheckin);
    }
    if (qrBtn) {
        qrBtn.addEventListener('click', toggleQRScanner);
    }

    console.log('✅ Módulo de Check-in inicializado.');
}

/**
 * Lida com a entrada no campo de busca.
 * @param {KeyboardEvent} event
 */
async function handleSearchInput(event) {
    const input = event.target;
    const query = input.value.trim();
    const resultDiv = document.getElementById('checkinResult');

    if (event.key === 'Enter' && query) {
        await performCheckin();
        return;
    }

    if (!query) {
        activeStudentForCheckin = null;
        resultDiv.innerHTML = '<span>Digite para buscar...</span>';
        return;
    }

    try {
        resultDiv.innerHTML = '<span style="color: #F59E0B;">Buscando...</span>';

        const response = await fetch(`/api/students/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            // Pega o primeiro resultado para o check-in rápido
            activeStudentForCheckin = result.data[0];
            const studentName = `${activeStudentForCheckin.user.firstName} ${activeStudentForCheckin.user.lastName}`;
            resultDiv.innerHTML = `<span style="color: #10B981;">✅ Aluno encontrado: <strong>${studentName}</strong>. Pressione Enter para confirmar.</span>`;
        } else {
            activeStudentForCheckin = null;
            resultDiv.innerHTML = '<span style="color: #EF4444;">❌ Nenhum aluno encontrado.</span>';
        }
    } catch (error) {
        activeStudentForCheckin = null;
        resultDiv.innerHTML = '<span style="color: #EF4444;">⚠️ Erro de conexão.</span>';
        console.error('Erro na busca:', error);
    }
}

/**
 * Executa o check-in para o aluno ativo.
 */
async function performCheckin() {
    if (!activeStudentForCheckin) {
        window.showToast('Nenhum aluno selecionado para check-in.', 'error');
        return;
    }

    const studentId = activeStudentForCheckin.id;
    const studentName = `${activeStudentForCheckin.user.firstName} ${activeStudentForCheckin.user.lastName}`;
    const resultDiv = document.getElementById('checkinResult');
    const checkinBtn = document.getElementById('checkinBtn');

    try {
        checkinBtn.disabled = true;
        checkinBtn.innerHTML = '⏳ Processando...';
        resultDiv.innerHTML = `<span style="color: #3B82F6;">Confirmando check-in para ${studentName}...</span>`;

        const response = await fetch('/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                studentId,
                method: 'QUICK_CHECKIN'
            })
        });

        const result = await response.json();

        if (result.success) {
            window.showToast(`Check-in de ${studentName} realizado com sucesso!`, 'success');
            resultDiv.innerHTML = `<span style="color: #10B981;">✅ Check-in de <strong>${studentName}</strong> confirmado!</span>`;

            document.getElementById('checkinSearch').value = '';
            activeStudentForCheckin = null;

            // Adicionar à lista de check-ins recentes, se houver uma
            if (window.addToRecentCheckins) {
                window.addToRecentCheckins(activeStudentForCheckin);
            }
        } else {
            throw new Error(result.message || 'Erro desconhecido no servidor.');
        }
    } catch (error) {
        window.showToast(`Falha no check-in: ${error.message}`, 'error');
        resultDiv.innerHTML = `<span style="color: #EF4444;">❌ Falha no check-in: ${error.message}</span>`;
    } finally {
        checkinBtn.disabled = false;
        checkinBtn.innerHTML = '⚡ CHECK-IN RÁPIDO';
    }
}

/**
 * Inicia ou para o scanner de QR code.
 */
function toggleQRScanner() {
    const videoContainer = document.getElementById('qrVideoContainer');

    if (qrScanner) {
        qrScanner.stop();
        qrScanner = null;
        videoContainer.style.display = 'none';
        document.getElementById('qrBtn').textContent = '📷 Ler QR Code';
    } else {
        videoContainer.style.display = 'block';
        document.getElementById('qrBtn').textContent = '🛑 Parar Scanner';

        const videoElement = document.getElementById('qrVideo');

        // Importar a biblioteca de scanner de QR
        // Exemplo usando jsQR, que precisaria ser importada no HTML
        // <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"></script>

        // Lógica do scanner aqui...
        // Ao detectar um QR code com um studentId:
        // activeStudentForCheckin = await fetchStudentById(qrCodeData.data);
        // await performCheckin();

        window.showToast('Scanner de QR Code em desenvolvimento.', 'info');
    }
}

/**
 * Busca um aluno pelo ID (para uso com QR Code).
 * @param {string} studentId - ID do aluno
 * @returns {Promise<Object|null>} - Dados do aluno ou null se não encontrado
 */
async function fetchStudentById(studentId) {
    try {
        const response = await fetch(`/api/students/${studentId}`);
        const result = await response.json();

        if (result.success && result.data) {
            return result.data;
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar aluno por ID:', error);
        return null;
    }
}

// Exportar funções para uso externo se necessário
export { activeStudentForCheckin, performCheckin, fetchStudentById };
