/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE LOGS DO SISTEMA (logs.html )
 * ==================================================================
 * Este arquivo controla a exibição de logs e a lógica de permissão e perfil.
 *
 * Ele depende do objeto `Notificacao` fornecido por `notificacoes.js`.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const logsTableBody = document.querySelector('#logs-table tbody');
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserRole = document.getElementById('dropdown-user-role');

    // --- Verificação de Autenticação e Permissão ---
    const token = localStorage.getItem('authToken');
    const usuarioString = localStorage.getItem('usuario');

    // 1. Verifica se o usuário está logado
    if (!token || !usuarioString) {
        Notificacao.erro('Acesso Negado', 'Você precisa estar logado para acessar esta página.')
            .then(() => {
                window.location.href = '/login-gerencia';
            });
        return; // Interrompe a execução
    }

    const usuario = JSON.parse(usuarioString);

    // 2. Verifica se o usuário tem permissão de 'geral'
    if (usuario.nivel_acesso !== 'geral') {
        Notificacao.erro('Acesso Restrito', 'Você não tem permissão para visualizar os logs do sistema.')
            .then(() => {
                window.location.href = '/gerencia-home';
            });
        return; // Interrompe a execução
    }

    // --- Funções ---

    /**
     * Preenche as informações do usuário no menu de perfil.
     */
    function preencherPerfil() {
        if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
        if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;
    }

    /**
     * Realiza o logout do usuário de forma segura.
     */
    async function fazerLogout() {
        const confirmado = await Notificacao.confirmar('Sair do Sistema', 'Você tem certeza que deseja fazer logout?');
        if (confirmado) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('usuario');
            Notificacao.sucesso('Logout realizado com sucesso!')
                .then(() => {
                    // Redireciona para a tela de login da gerência
                    window.location.href = '/login-gerencia';
                });
        }
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
            logsTableBody.innerHTML = ''; // Limpa a tabela antes de preencher

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
            console.error("Erro ao carregar logs:", error);
            // Mostra um erro amigável na tela
            Notificacao.erro('Falha ao Carregar Logs', error.message);
            logsTableBody.innerHTML = `<tr><td colspan="4" class="text-center error-message">Não foi possível carregar os logs. Tente novamente mais tarde.</td></tr>`;
        }
    }

    // --- Event Listeners ---
    profileMenuBtn.addEventListener('click', () => profileDropdown.classList.toggle('hidden'));
    
    window.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fazerLogout();
    });

    // --- Inicialização ---
    preencherPerfil();
    carregarLogs();
});
