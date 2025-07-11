// /Pagina gerencia/gerencia_mesas.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login-gerencia';
        return;
    }

    // --- Elementos do DOM ---
    const formAddMesa = document.getElementById('form-add-mesa');
    const nomeMesaInput = document.getElementById('nome-mesa-input');
    const senhaMesaInput = document.getElementById('senha-mesa-input');
    const formMessage = document.getElementById('form-message');
    const listaMesas = document.getElementById('lista-mesas');
    const detalhesTitulo = document.getElementById('detalhes-titulo');
    const detalhesConteudo = document.getElementById('detalhes-conteudo');

    // Variável para guardar o ID da mesa atualmente selecionada
    let selectedMesaId = null;

    // --- FUNÇÕES DE LÓGICA ---

    /**
     * Carrega a lista de todas as mesas cadastradas na coluna da esquerda.
     */
    async function carregarMesas() {
        try {
            const response = await fetch('/api/mesas', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar mesas.');
            
            const mesas = await response.json();
            listaMesas.innerHTML = '';

            if (mesas.length === 0) {
                listaMesas.innerHTML = '<p>Nenhuma mesa cadastrada.</p>';
                return;
            }

            mesas.forEach(mesa => {
                const li = document.createElement('li');
                li.className = 'mesa-list-item';
                li.dataset.id = mesa.id;
                li.dataset.nome = mesa.nome_usuario;
                li.innerHTML = `
                    <span><i class="fas fa-tablet-alt"></i> ${mesa.nome_usuario}</span>
                    <button class="delete-btn" title="Remover Mesa"><i class="fas fa-trash-alt"></i></button>
                `;
                listaMesas.appendChild(li);
            });
        } catch (error) {
            listaMesas.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    /**
     * Carrega o histórico de sessões de uma mesa específica na coluna da direita.
     * @param {string} mesaId - O ID da mesa a ser consultada.
     * @param {string} mesaNome - O nome da mesa para exibir no título.
     */
    async function carregarDetalhesMesa(mesaId, mesaNome) {
        selectedMesaId = mesaId;
        detalhesTitulo.textContent = `Histórico da ${mesaNome}`;
        detalhesConteudo.innerHTML = '<p>Carregando histórico...</p>';

        // Destaca a mesa selecionada na lista
        document.querySelectorAll('#lista-mesas li').forEach(li => li.classList.remove('active'));
        document.querySelector(`#lista-mesas li[data-id='${mesaId}']`).classList.add('active');

        try {
            // Chama a nova rota da API para buscar o histórico da mesa
            const response = await fetch(`/api/mesas/${mesaId}/sessoes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar o histórico.');

            const sessoes = await response.json();
            detalhesConteudo.innerHTML = '';

            if (sessoes.length === 0) {
                detalhesConteudo.innerHTML = '<p>Esta mesa ainda não teve nenhuma sessão de cliente.</p>';
                return;
            }

            sessoes.forEach(sessao => {
                const div = document.createElement('div');
                div.className = `session-card ${sessao.status}`; // Adiciona classe 'ativa' ou 'finalizada'

                const totalGasto = sessao.total_gasto ? parseFloat(sessao.total_gasto).toFixed(2) : '0.00';
                const dataInicio = new Date(sessao.data_inicio).toLocaleString('pt-BR');

                // Monta o card de cada sessão
                div.innerHTML = `
                    <div class="session-header">
                        <strong><i class="fas fa-user"></i> ${sessao.nome_cliente}</strong>
                        <span class="status-tag ${sessao.status}">${sessao.status}</span>
                    </div>
                    <div class="session-body">
                        <p><strong>Início:</strong> ${dataInicio}</p>
                        <p><strong>Total Parcial:</strong> R$ ${totalGasto}</p>
                    </div>
                    ${sessao.status === 'ativa' ? `
                    <div class="session-actions">
                        <button class="action-btn print-btn" data-sessao-id="${sessao.id}"><i class="fas fa-print"></i> Imprimir Conta</button>
                        <button class="action-btn close-btn" data-sessao-id="${sessao.id}"><i class="fas fa-check-circle"></i> Fechar Conta</button>
                    </div>
                    ` : ''}
                `;
                detalhesConteudo.appendChild(div);
            });

        } catch (error) {
            detalhesConteudo.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    /**
     * Deleta uma mesa do sistema.
     * @param {string} mesaId - O ID da mesa a ser deletada.
     * @param {string} mesaNome - O nome da mesa para a mensagem de confirmação.
     */
    async function deletarMesa(mesaId, mesaNome) {
        if (confirm(`Tem certeza que deseja remover a ${mesaNome}? Esta ação não pode ser desfeita.`)) {
            try {
                const response = await fetch(`/api/mesas/${mesaId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao remover a mesa.');
                
                // Limpa os detalhes se a mesa deletada era a que estava selecionada
                if (selectedMesaId === mesaId) {
                    detalhesTitulo.textContent = 'Selecione uma mesa para ver o histórico';
                    detalhesConteudo.innerHTML = '<p class="placeholder-text"><i class="fas fa-info-circle"></i>A mesa que estava selecionada foi removida.</p>';
                }
                
                carregarMesas(); // Atualiza a lista de mesas
            } catch (error) {
                alert(error.message);
            }
        }
    }

    // --- EVENT LISTENERS (QUEM FAZ A MÁGICA ACONTECER) ---

    // Evento para adicionar uma nova mesa
    formAddMesa.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = nomeMesaInput.value.trim();
        const senha = senhaMesaInput.value.trim();

        try {
            const response = await fetch('/api/mesas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome_usuario: nome, senha: senha })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            formMessage.textContent = `Mesa "${nome}" adicionada!`;
            formMessage.style.color = 'green';
            formAddMesa.reset();
            carregarMesas(); // Recarrega a lista de mesas
        } catch (error) {
            formMessage.textContent = error.message;
            formMessage.style.color = 'red';
        }
        setTimeout(() => formMessage.textContent = '', 3000);
    });

    // Evento de clique na lista de mesas (para selecionar ou deletar)
    listaMesas.addEventListener('click', (e) => {
        const itemMesa = e.target.closest('.mesa-list-item');
        const deleteButton = e.target.closest('.delete-btn');

        if (deleteButton) {
            e.stopPropagation(); // Impede que o clique no botão de deletar também selecione a mesa
            deletarMesa(itemMesa.dataset.id, itemMesa.dataset.nome);
        } else if (itemMesa) {
            carregarDetalhesMesa(itemMesa.dataset.id, itemMesa.dataset.nome);
        }
    });

    // Evento de clique nos botões de ação (Imprimir, Fechar Conta)
    detalhesConteudo.addEventListener('click', async (e) => {
        const closeButton = e.target.closest('.close-btn');
        if (closeButton) {
            const sessaoId = closeButton.dataset.sessaoId;
            if (confirm('Tem certeza que deseja fechar esta conta? A ação não pode ser desfeita.')) {
                try {
                    const response = await fetch(`/api/sessoes/${sessaoId}/fechar`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    
                    alert('Conta fechada com sucesso!');
                    // Recarrega os detalhes da mesa para refletir a mudança de status
                    const mesaNome = detalhesTitulo.textContent.replace('Histórico da ', '');
                    carregarDetalhesMesa(selectedMesaId, mesaNome);

                } catch (error) {
                    alert(`Erro: ${error.message}`);
                }
            }
        }

        const printButton = e.target.closest('.print-btn');
        if (printButton) {
            alert('Funcionalidade de impressão ainda não implementada.');
            // No futuro, aqui entraria a lógica para gerar um recibo e chamar a janela de impressão.
        }
    });

    // --- INICIALIZAÇÃO ---
    // Carrega a lista de mesas assim que a página é aberta
    carregarMesas();
});
