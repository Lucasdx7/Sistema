// /Frontend/Pagina gerencia/logs.js
document.addEventListener('DOMContentLoaded', () => {
    // Reutiliza a lógica de verificação de token e perfil
    const token = localStorage.getItem('authToken');
    const usuarioString = localStorage.getItem('usuario');

    if (!token || !usuarioString) {
        window.location.href = '/login-gerencia';
        return;
    }
    const usuario = JSON.parse(usuarioString);

    // Se não for gerente geral, redireciona para a home
    if (usuario.nivel_acesso !== 'geral') {
        alert('Acesso negado.');
        window.location.href = '/gerencia-home';
        return;
    }

    // --- Lógica do Menu de Perfil (reutilizada) ---
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    document.getElementById('dropdown-user-name').textContent = usuario.nome;
    document.getElementById('dropdown-user-role').textContent = usuario.nivel_acesso;

    profileMenuBtn.addEventListener('click', () => profileDropdown.classList.toggle('hidden'));
    window.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
    });

    // --- Lógica para Carregar e Exibir os Logs ---
    const logsTableBody = document.querySelector('#logs-table tbody');

    async function carregarLogs() {
        try {
            const response = await fetch('/api/logs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar logs.');
            
            const logs = await response.json();
            logsTableBody.innerHTML = ''; // Limpa a tabela

            if (logs.length === 0) {
                logsTableBody.innerHTML = '<tr><td colspan="4">Nenhum log encontrado.</td></tr>';
                return;
            }

            logs.forEach(log => {
                const tr = document.createElement('tr');
                
                // Formata a data para o padrão brasileiro
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
            console.error(error);
            logsTableBody.innerHTML = `<tr><td colspan="4">${error.message}</td></tr>`;
        }
    }

    // Carrega os logs ao iniciar a página
    carregarLogs();
});
