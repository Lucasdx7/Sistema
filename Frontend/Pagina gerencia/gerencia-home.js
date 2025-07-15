/**
 * ==================================================================
 * SCRIPT DA PÁGINA INICIAL DA GERÊNCIA (Gerencia-Home.html )
 * ==================================================================
 * Este arquivo controla o menu de perfil, logout e permissões do dashboard.
 *
 * Ele depende do objeto `Notificacao` fornecido por `notificacoes.js`.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserRole = document.getElementById('dropdown-user-role');

    // --- Verificação de Autenticação ---
    const token = localStorage.getItem('authToken');
    const usuarioString = localStorage.getItem('usuario');

    // Se não houver token ou dados do usuário, notifica e redireciona.
    if (!token || !usuarioString) {
        // Usa a notificação para informar o usuário antes de redirecionar.
        // O `then()` garante que o redirecionamento ocorra após o usuário fechar o alerta.
        Notificacao.erro('Acesso Negado', 'Você precisa estar logado para acessar esta página.')
            .then(() => {
                window.location.href = '/login-gerencia';
            });
        return; // Interrompe a execução do resto do script.
    }

    const usuario = JSON.parse(usuarioString);

    // --- Funções ---

    /**
     * Esconde ou mostra elementos do dashboard com base no nível de acesso do usuário.
     * @param {string} nivelAcesso - O nível de acesso do usuário (ex: 'geral').
     */
    function configurarDashboard(nivelAcesso) {
        const elementosGerais = document.querySelectorAll('.permissao-geral');
        // Se o nível não for 'geral', esconde os elementos restritos.
        if (nivelAcesso !== 'geral') {
            elementosGerais.forEach(el => el.style.display = 'none');
        }
    }

    /**
     * Preenche as informações do usuário no menu de perfil.
     * @param {object} usuario - O objeto do usuário com nome e nivel_acesso.
     */
    function preencherPerfil(usuario) {
        if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
        if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;
    }

    /**
     * Realiza o logout do usuário, limpando o localStorage e redirecionando.
     */
    function fazerLogout() {
        // Limpa os dados da sessão local
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        
        // Mostra uma notificação de sucesso antes de redirecionar
        Notificacao.sucesso('Logout realizado com sucesso!')
            .then(() => {
                window.location.href = '/login-gerencia';
            });
    }

    // --- Event Listeners ---

    // Abre/fecha o menu de perfil
    profileMenuBtn.addEventListener('click', () => {
        profileDropdown.classList.toggle('hidden');
    });

    // Fecha o menu de perfil se o usuário clicar fora dele
    window.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });

    // Adiciona um listener para o botão de logout
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Pede confirmação antes de fazer o logout
        const confirmado = await Notificacao.confirmar('Sair do Sistema', 'Você tem certeza que deseja fazer logout?');
        
        if (confirmado) {
            fazerLogout();
        }
    });

    // --- Inicialização ---
    configurarDashboard(usuario.nivel_acesso);
    preencherPerfil(usuario);
});
