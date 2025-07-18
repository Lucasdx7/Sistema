/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE CONFIGURAÇÕES (configuracoes.js) - VERSÃO FINAL
 * Com a exibição correta de "Mesas Fechadas" no relatório de atividade.
 * ==================================================================
 */ 


document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserRole = document.getElementById('dropdown-user-role');
    const fonteClienteSelect = document.getElementById('fonte-cliente-select');
    const salvarFonteBtn = document.getElementById('salvar-fonte-btn');
    const relatorioUsuarioSelect = document.getElementById('relatorio-usuario-select');
    const relatorioPeriodoSelect = document.getElementById('relatorio-periodo-select');
    const gerarRelatorioBtn = document.getElementById('gerar-relatorio-btn');
    const relatorioResultadoContainer = document.getElementById('relatorio-resultado-container');
    const permissoesForm = document.getElementById('permissoes-form');
    const permissoesGrid = document.querySelector('.permissions-grid');
    const resetDbBtn = document.getElementById('reset-db-btn');

    // --- Autenticação ---
    const token = localStorage.getItem('authToken');
    const usuario = JSON.parse(localStorage.getItem('usuario'));

    if (!token || !usuario || usuario.nivel_acesso !== 'geral') {
        document.body.innerHTML = '<div class="error-page"><h1>Acesso Negado</h1><p>Você não tem permissão para acessar esta página.</p></div>';
        return;
    }

    // --- Funções ---
    function fazerLogout() {
        localStorage.clear();
        window.location.href = '/login-gerencia';
    }

    async function salvarConfiguracoes(configs) {
        try {
            const response = await fetch('/api/configuracoes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(configs)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            Notificacao.sucesso('Configuração salva!', result.message);
        } catch (error) {
            Notificacao.erro('Erro ao Salvar', error.message);
        }
    }

    async function carregarConfiguracoesIniciais() {
        try {
            const chaves = 'fonte_cliente,permissoes_home';
            const response = await fetch(`/api/configuracoes/${chaves}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao carregar dados.');
            const configs = await response.json();
            if (configs.fonte_cliente) fonteClienteSelect.value = configs.fonte_cliente;
            renderizarCheckboxesPermissao(configs.permissoes_home || []);
            await carregarUsuariosParaRelatorio();
        } catch (error) {
            Notificacao.erro('Erro de Carregamento', error.message);
        }
    }

    // --- Seção de Personalização ---
    salvarFonteBtn.addEventListener('click', () => {
        const novaFonte = fonteClienteSelect.value;
        salvarConfiguracoes({ 'fonte_cliente': novaFonte });
    });

    // --- Seção de Relatórios ---
    async function carregarUsuariosParaRelatorio() {
        try {
            const response = await fetch('/api/usuarios-para-relatorio', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao buscar funcionários.');
            const usuarios = await response.json();
            relatorioUsuarioSelect.innerHTML = '<option value="">Selecione um funcionário</option>';
            usuarios.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.nome} (${user.nivel_acesso || 'N/A'})`;
                option.dataset.nome = user.nome;
                relatorioUsuarioSelect.appendChild(option);
            });
        } catch (error) {
            Notificacao.erro('Erro', error.message);
        }
    }

    async function gerarRelatorio() {
        const usuarioId = relatorioUsuarioSelect.value;
        const periodo = relatorioPeriodoSelect.value;
        if (!usuarioId) return Notificacao.aviso('Campo Obrigatório', 'Por favor, selecione um funcionário.');

        const selectedOption = relatorioUsuarioSelect.options[relatorioUsuarioSelect.selectedIndex];
        const nomeUsuario = selectedOption.dataset.nome;
        
        let deleteButton = document.getElementById('delete-user-btn');
        if (deleteButton) deleteButton.remove();

        if (usuarioId != usuario.id) {
            deleteButton = document.createElement('button');
            deleteButton.id = 'delete-user-btn';
            deleteButton.className = 'btn btn-danger';
            deleteButton.innerHTML = `<i class="fas fa-trash-alt"></i> Deletar ${nomeUsuario}`;
            deleteButton.onclick = () => deletarUsuario(usuarioId, nomeUsuario);
            gerarRelatorioBtn.parentNode.insertBefore(deleteButton, gerarRelatorioBtn.nextSibling);
        }

        gerarRelatorioBtn.disabled = true;
        gerarRelatorioBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
        relatorioResultadoContainer.classList.add('hidden');

        try {
            const response = await fetch(`/api/relatorio-atividade?usuarioId=${usuarioId}&periodo=${periodo}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const atividades = await response.json();
            if (!response.ok) throw new Error(atividades.message);
            relatorioResultadoContainer.classList.remove('hidden');
            
            if (atividades.length === 0) {
                relatorioResultadoContainer.innerHTML = '<p>Nenhuma atividade encontrada para este funcionário no período selecionado.</p>';
            } else {
                let htmlResult = '<ul>';
                atividades.forEach(ativ => {
                    // ==================================================================
                    // --- AQUI ESTÁ A CORREÇÃO ---
                    // Se a ação for 'Mesas Fechadas', usamos o texto diretamente.
                    // Caso contrário, formatamos como antes.
                    // ==================================================================
                    const acaoFormatada = ativ.acao === 'Mesas Fechadas' 
                        ? ativ.acao 
                        : ativ.acao.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                    
                    htmlResult += `<li><strong>${acaoFormatada}:</strong> ${ativ.total} vezes</li>`;
                });
                htmlResult += '</ul>';
                relatorioResultadoContainer.innerHTML = htmlResult;
            }
        } catch (error) {
            Notificacao.erro('Erro ao Gerar Relatório', error.message);
        } finally {
            gerarRelatorioBtn.disabled = false;
            gerarRelatorioBtn.textContent = 'Gerar Relatório';
        }
    }
    gerarRelatorioBtn.addEventListener('click', gerarRelatorio);
    relatorioUsuarioSelect.addEventListener('change', () => {
        relatorioResultadoContainer.classList.add('hidden');
        const deleteButton = document.getElementById('delete-user-btn');
        if (deleteButton) deleteButton.remove();
    });

    async function deletarUsuario(id, nome) {
        const confirmado = await Notificacao.confirmar('Deletar Funcionário', `Tem certeza que deseja deletar permanentemente o funcionário '${nome}'?`);
        if (confirmado) {
            try {
                const response = await fetch(`/api/usuarios/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                Notificacao.sucesso('Funcionário Deletado!', result.message);
                carregarUsuariosParaRelatorio();
                relatorioResultadoContainer.classList.add('hidden');
                const deleteButton = document.getElementById('delete-user-btn');
                if (deleteButton) deleteButton.remove();
            } catch (error) {
                Notificacao.erro('Falha ao Deletar', error.message);
            }
        }
    }

    // --- Seção de Permissões ---
    function renderizarCheckboxesPermissao(permissoesAtivas = []) {
        const modulos = [
            { id: 'card-cardapio', label: 'Gerenciar Cardápio' },
            { id: 'card-mesas', label: 'Gerenciar Mesas' },
            { id: 'card-chamados', label: 'Chamados de Garçom' },
            { id: 'card-logs', label: 'Logs do Sistema' },
            { id: 'card-pedidos', label: 'Acompanhar Pedidos' },
            { id: 'card-relatorios', label: 'Relatórios de Vendas' },
            { id: 'card-config', label: 'Configurações' }
        ];
        permissoesGrid.innerHTML = '';
        modulos.forEach(modulo => {
            const isChecked = permissoesAtivas.includes(modulo.id);
            permissoesGrid.innerHTML += `<div class="permission-item"><input type="checkbox" id="perm-${modulo.id}" name="permissoes" value="${modulo.id}" ${isChecked ? 'checked' : ''}><label for="perm-${modulo.id}">${modulo.label}</label></div>`;
        });
    }

    permissoesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const checkboxes = document.querySelectorAll('input[name="permissoes"]:checked');
        const permissoesSelecionadas = Array.from(checkboxes).map(cb => cb.value);
        salvarConfiguracoes({ 'permissoes_home': permissoesSelecionadas });
    });

    // --- Seção de Zona de Perigo (RESET) ---
    resetDbBtn.addEventListener('click', async () => {
        const { value: formValues } = await Swal.fire({
            title: 'CONFIRMAÇÃO EXTREMA',
            html: `<p class="swal-text">Esta ação é <strong>IRREVERSÍVEL</strong>. Para confirmar, digite <strong>RESETAR SISTEMA</strong> e forneça a chave de acesso para reset.</p>
                   <input id="swal-confirm-text" class="swal2-input" placeholder="RESETAR SISTEMA">
                   <input id="swal-secret-key" class="swal2-input" placeholder="Chave de Acesso para Reset" type="password">`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Confirmar Reset',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d33',
            preConfirm: () => {
                return {
                    confirmText: document.getElementById('swal-confirm-text').value,
                    secretKey: document.getElementById('swal-secret-key').value
                }
            }
        });

        if (formValues) {
            const { confirmText, secretKey } = formValues;

            if (confirmText !== 'RESETAR SISTEMA') {
                return Notificacao.erro('Confirmação Incorreta', 'O texto de confirmação não foi digitado corretamente.');
            }
            if (!secretKey) {
                return Notificacao.erro('Chave Necessária', 'A chave de acesso para reset é obrigatória.');
            }

            try {
                const response = await fetch('/api/reset-database', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ secretKey: secretKey })
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message);
                }

                Notificacao.sucesso('Sistema Resetado!', result.message);
                setTimeout(() => window.location.reload(), 2000);

            } catch (error) {
                Notificacao.erro('Falha no Reset', error.message);
            }
        }
    });

    // --- Inicialização e Menu de Perfil ---
    if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
    if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;
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

    carregarConfiguracoesIniciais();
});
