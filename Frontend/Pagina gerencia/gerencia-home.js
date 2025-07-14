// /Frontend/Pagina gerencia/gerencia-home.js

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

    if (!token || !usuarioString) {
         window.location.href = '/login-gerencia';
        return;
    }

    const usuario = JSON.parse(usuarioString);

    // --- Funções ---
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

    function fazerLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        window.location.href = '/login-gerencia';
    }

    // --- Event Listeners ---
    profileMenuBtn.addEventListener('click', () => {
        profileDropdown.classList.toggle('hidden');
    });

    // Fecha o dropdown se clicar fora dele
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
    configurarDashboard(usuario.nivel_acesso);
    preencherPerfil(usuario);
});
