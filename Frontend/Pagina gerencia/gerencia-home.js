/**
 * ==================================================================
 * SCRIPT DA PÁGINA INICIAL DA GERÊNCIA (Gerencia-Home.html)
 * ==================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserRole = document.getElementById('dropdown-user-role');
    // Novo elemento para o contador
    const chamadosBadge = document.getElementById('chamados-count-badge');

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

    function configurarDashboard(nivelAcesso) {
        const elementosGerais = document.querySelectorAll('.permissao-geral');
        if (nivelAcesso !== 'geral') {
            elementosGerais.forEach(el => el.style.display = 'none');
        }
    }

    function preencherPerfil(usuario) {
        if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
        if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;
    }

    /**
     * Busca a contagem de chamados pendentes e atualiza o badge.
     */
    async function atualizarContadorChamados() {
        if (!chamadosBadge) return; // Se não houver badge na página, não faz nada

        try {
            const response = await fetch('/api/chamados/pendentes/count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return; // Falha silenciosamente para não incomodar o usuário

            const data = await response.json();
            const count = data.count || 0;

            chamadosBadge.textContent = count;
            if (count > 0) {
                chamadosBadge.classList.remove('hidden');
            } else {
                chamadosBadge.classList.add('hidden');
            }
        } catch (error) {
            console.error("Erro ao atualizar contador de chamados:", error);
        }
    }

    /**
     * Conecta ao WebSocket para notificações em tempo real.
     */
    function conectarWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl );

        ws.onmessage = (event) => {
            try {
                const mensagem = JSON.parse(event.data);
                if (mensagem.type === 'CHAMADO_GARCOM') {
                    // ATUALIZAÇÃO: Ao receber um novo chamado, atualiza o contador
                    atualizarContadorChamados(); 
                    
                    Swal.fire({
                        title: '<strong>Chamado!</strong>',
                        html: `<h2>A <strong>${mensagem.nomeMesa}</strong> está solicitando atendimento.</h2>`,
                        icon: 'warning',
                        confirmButtonText: 'OK, Entendido!',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                    });
                }
            } catch (error) {
                console.error('Erro ao processar mensagem WebSocket:', error);
            }
        };
        ws.onclose = () => setTimeout(conectarWebSocket, 5000);
    }

    // --- Event Listeners ---
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

    // --- Inicialização ---
    configurarDashboard(usuario.nivel_acesso);
    preencherPerfil(usuario);
    conectarWebSocket();
    atualizarContadorChamados(); // Busca a contagem inicial ao carregar a página
});
