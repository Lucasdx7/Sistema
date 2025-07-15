/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE LOGS DO SISTEMA (logs.html)
 * ==================================================================
 * Controla a exibição de logs, a lógica de permissão, o menu de perfil
 * e a escuta de notificações em tempo real.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const logsTableBody = document.querySelector('#logs-table tbody');
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserRole = document.getElementById('dropdown-user-role');

    // --- Verificação de Autenticação ---
    const token = localStorage.getItem('authToken');
    const usuarioString = localStorage.getItem('usuario');

    if (!token || !usuarioString) {
        Notificacao.erro('Acesso Negado', 'Você precisa estar logado para acessar esta página.')
            .then(() => {
                window.location.href = '/login-gerencia';
            });
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
        setTimeout(() => {
            window.location.href = '/login-gerencia';
        }, 1500);
    }

    /**
     * Busca os logs da API e os renderiza na tabela.
     */
    async function carregarLogs() {
        try {
            const response = await fetch('/api/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Não foi possível obter uma resposta do servidor.' }));
                throw new Error(errorData.message);
            }
            
            const logs = await response.json();
            logsTableBody.innerHTML = '';

            if (logs.length === 0) {
                logsTableBody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum log encontrado no sistema.</td></tr>';
                return;
            }

            logs.forEach(log => {
                const tr = document.createElement('tr');
                const dataFormatada = new Date(log.data_hora).toLocaleString('pt-BR');
                tr.innerHTML = `
                    <td>${dataFormatada}</td>
                    <td>${log.nome_usuario || 'Usuário Deletado'}</td>
                    <td><span class="log-action">${log.acao}</span></td>
                    <td>${log.detalhes}</td>
                `;
                logsTableBody.appendChild(tr);
            });

        } catch (error) {
            Notificacao.erro('Falha ao Carregar Logs', error.message);
            logsTableBody.innerHTML = `<tr><td colspan="4" class="text-center error-message">Não foi possível carregar os logs.</td></tr>`;
        }
    }

    /**
     * Conecta ao WebSocket para receber notificações em tempo real.
     */
    function conectarWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl );

        ws.onopen = () => console.log('Conexão WebSocket estabelecida para a gerência.');

        ws.onmessage = (event) => {
            try {
                const mensagem = JSON.parse(event.data);
                if (mensagem.type === 'CHAMADO_GARCOM') {
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

        ws.onclose = () => {
            console.log('Conexão WebSocket fechada. Tentando reconectar em 5 segundos...');
            setTimeout(conectarWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
            ws.close();
        };
    }

    // --- Event Listeners do Menu de Perfil ---
    if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
    if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;

    profileMenuBtn.addEventListener('click', () => {
        profileDropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmado = await Notificacao.confirmar('Sair do Sistema', 'Você tem certeza que deseja fazer logout?');
        if (confirmado) {
            fazerLogout();
        }
    });

    // --- Inicialização ---
    carregarLogs();
    conectarWebSocket();
});
