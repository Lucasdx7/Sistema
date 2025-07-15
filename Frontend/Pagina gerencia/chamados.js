/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE CHAMADOS DE GARÇOM (chamados.html)
 * ==================================================================
 * Controla a exibição e gerenciamento dos chamados em tempo real.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const chamadosGrid = document.getElementById('chamados-grid');
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserRole = document.getElementById('dropdown-user-role');

    // --- Autenticação ---
    const token = localStorage.getItem('authToken');
    const usuarioString = localStorage.getItem('usuario');

    if (!token || !usuarioString) {
        Notificacao.erro('Acesso Negado', 'Você precisa estar logado.')
            .then(() => window.location.href = '/login-gerencia');
        return;
    }
    const usuario = JSON.parse(usuarioString);

    // --- Funções ---

    function fazerLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        Notificacao.sucesso('Logout realizado com sucesso!');
        setTimeout(() => window.location.href = '/login-gerencia', 1500);
    }

    /**
     * Cria o HTML para um único card de chamado.
     * @param {object} chamado - O objeto do chamado com id, nome_mesa, data_hora, status.
     * @returns {string} - O HTML do card.
     */
    function criarCardChamado(chamado) {
        const data = new Date(chamado.data_hora);
        const horarioFormatado = data.toLocaleTimeString('pt-BR');
        const isAtendido = chamado.status === 'atendido';

        return `
            <div class="chamado-card ${chamado.status}" data-id="${chamado.id}">
                <div class="card-header">
                    <i class="fas fa-bell"></i>
                    <h3 class="mesa-nome">${chamado.nome_mesa}</h3>
                </div>
                <div class="card-body">
                    <p class="horario">Chamado às: <strong>${horarioFormatado}</strong></p>
                </div>
                <div class="card-footer">
                    ${!isAtendido ? 
                        `<button class="btn-atender">Marcar como Atendido</button>` : 
                        `<span><i class="fas fa-check-circle"></i> Atendido</span>`
                    }
                </div>
            </div>
        `;
    }

    /**
     * Busca os chamados da API e renderiza na tela.
     */
    async function carregarChamados() {
        try {
            // NOTA: A rota '/api/chamados' ainda precisa ser criada no backend!
            const response = await fetch('/api/chamados', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao buscar chamados.');
            
            const chamados = await response.json();
            chamadosGrid.innerHTML = ''; // Limpa a área

            if (chamados.length === 0) {
                chamadosGrid.innerHTML = '<p class="empty-message">Nenhum chamado registrado hoje.</p>';
                return;
            }

            // Ordena para que os pendentes apareçam primeiro
            chamados.sort((a, b) => (a.status === 'pendente' ? -1 : 1) - (b.status === 'pendente' ? -1 : 1));

            chamados.forEach(chamado => {
                chamadosGrid.innerHTML += criarCardChamado(chamado);
            });

        } catch (error) {
            Notificacao.erro('Erro ao Carregar', error.message);
            chamadosGrid.innerHTML = `<p class="empty-message error-message">${error.message}</p>`;
        }
    }

    /**
     * Marca um chamado como atendido.
     * @param {string} chamadoId - O ID do chamado a ser atualizado.
     */
    async function atenderChamado(chamadoId) {
        try {
            // NOTA: A rota PATCH '/api/chamados/:id' ainda precisa ser criada!
            const response = await fetch(`/api/chamados/${chamadoId}/atender`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao atualizar o status do chamado.');

            // Atualiza a interface sem recarregar a página
            const card = document.querySelector(`.chamado-card[data-id='${chamadoId}']`);
            if (card) {
                card.classList.remove('pendente');
                card.classList.add('atendido');
                const footer = card.querySelector('.card-footer');
                footer.innerHTML = '<span><i class="fas fa-check-circle"></i> Atendido</span>';
            }
            Notificacao.sucesso('Chamado atendido!');

        } catch (error) {
            Notificacao.erro('Erro', error.message);
        }
    }
    
    /**
     * Conecta ao WebSocket para receber novos chamados em tempo real.
     */
    function conectarWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl );

        ws.onmessage = (event) => {
            const mensagem = JSON.parse(event.data);
            if (mensagem.type === 'CHAMADO_GARCOM') {
                // Ao receber um novo chamado, simplesmente recarrega a lista de cards
                carregarChamados();
                // E mostra o alerta modal
                Swal.fire({
                    title: '<strong>Novo Chamado!</strong>',
                    html: `<h2>A <strong>${mensagem.nomeMesa}</strong> está solicitando atendimento.</h2>`,
                    icon: 'warning',
                    confirmButtonText: 'OK, Entendido!',
                });
            }
        };
        ws.onclose = () => setTimeout(conectarWebSocket, 5000);
    }

    // --- Event Listeners ---
    if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
    if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;
    profileMenuBtn.addEventListener('click', () => profileDropdown.classList.toggle('hidden'));
    window.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmado = await Notificacao.confirmar('Sair do Sistema', 'Deseja mesmo sair?');
        if (confirmado) fazerLogout();
    });

    // Delegação de eventos para os botões "Atender"
    chamadosGrid.addEventListener('click', (e) => {
        const atenderBtn = e.target.closest('.btn-atender');
        if (atenderBtn) {
            const card = atenderBtn.closest('.chamado-card');
            const chamadoId = card.dataset.id;
            atenderBtn.disabled = true;
            atenderBtn.textContent = 'Aguarde...';
            atenderChamado(chamadoId);
        }
    });

    // --- Inicialização ---
    carregarChamados();
    conectarWebSocket();
});
