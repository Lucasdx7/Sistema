/**
 * ==================================================================
 * SCRIPT DA PÁGINA INICIAL DA GERÊNCIA (Gerencia-Home.html)
 * VERSÃO COMPLETA E ATUALIZADA
 * ==================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserRole = document.getElementById('dropdown-user-role');
    const chamadosBadge = document.getElementById('chamados-count-badge');
    const pedidosBadge = document.getElementById('pedidos-count-badge'); // Badge para pedidos

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

    /**
     * Realiza o logout do usuário, limpando o localStorage e redirecionando.
     */
    function fazerLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        Notificacao.sucesso('Logout realizado com sucesso!');
        setTimeout(() => window.location.href = '/login-gerencia', 1500);
    }

    /**
     * Configura a visibilidade dos cards com base no nível de acesso do usuário.
     * @param {string} nivelAcesso - O nível de acesso do usuário ('geral', etc.).
     */
    function configurarDashboard(nivelAcesso) {
        const elementosGerais = document.querySelectorAll('.permissao-geral');
        if (nivelAcesso !== 'geral') {
            elementosGerais.forEach(el => el.style.display = 'none');
        }
    }

    /**
     * Preenche as informações do usuário no menu de perfil.
     * @param {object} usuario - O objeto do usuário logado.
     */
    function preencherPerfil(usuario) {
        if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
        if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;
    }

    /**
     * Busca a contagem de chamados de garçom pendentes e atualiza o badge.
     */
    async function atualizarContadorChamados() {
        if (!chamadosBadge) return; // Se o elemento não existir, não faz nada

        try {
            const response = await fetch('/api/chamados/pendentes/count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return; // Falha silenciosamente

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
     * Busca a contagem de itens de pedidos pendentes e atualiza o badge.
     */
    async function atualizarContadorPedidos() {
        if (!pedidosBadge) return; // Se o elemento não existir, não faz nada

        try {
            const response = await fetch('/api/pedidos/pendentes/count', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return; // Falha silenciosamente

            const data = await response.json();
            const count = data.count || 0;

            pedidosBadge.textContent = count;
            if (count > 0) {
                pedidosBadge.classList.remove('hidden');
            } else {
                pedidosBadge.classList.add('hidden');
            }
        } catch (error) {
            console.error("Erro ao atualizar contador de pedidos:", error);
        }
    }

    /**
     * Conecta ao WebSocket para receber notificações e atualizar a UI em tempo real.
     */
    function conectarWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl );

        ws.onmessage = (event) => {
            try {
                const mensagem = JSON.parse(event.data);

                // Lida com diferentes tipos de notificações
                switch (mensagem.type) {
                    case 'CHAMADO_GARCOM':
                        atualizarContadorChamados();
                        Swal.fire({
                            title: '<strong>Chamado!</strong>',
                            html: `<h2>A <strong>${mensagem.nomeMesa}</strong> está solicitando atendimento.</h2>`,
                            icon: 'warning',
                            confirmButtonText: 'OK, Entendido!',
                            allowOutsideClick: false,
                            allowEscapeKey: false,
                        });
                        break;
                    
                    case 'NOVO_PEDIDO':
                    case 'PEDIDO_ATUALIZADO':
                    case 'PAGAMENTO_FINALIZADO':
                        atualizarContadorPedidos();
                        break;
                }
            } catch (error) {
                console.error('Erro ao processar mensagem WebSocket:', error);
            }
        };

        ws.onclose = () => {
            console.log('Conexão WebSocket fechada. Tentando reconectar em 5 segundos...');
            setTimeout(conectarWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
            ws.close();
        };
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
        if (confirmado) {
            fazerLogout();
        }
    });

    // --- Inicialização ---
    configurarDashboard(usuario.nivel_acesso);
    preencherPerfil(usuario);
    conectarWebSocket();
    
    // Busca a contagem inicial dos dois contadores ao carregar a página
    atualizarContadorChamados();
    atualizarContadorPedidos();
});
