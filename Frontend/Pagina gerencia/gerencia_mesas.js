document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login-gerencia';
        return;
    }

    // --- Elementos do DOM ---
    const listaMesas = document.getElementById('lista-mesas');
    const detalhesTitulo = document.getElementById('detalhes-titulo');
    const detalhesConteudo = document.getElementById('detalhes-conteudo');
    const formAddMesa = document.getElementById('form-add-mesa');

    // --- Elementos dos Modais ---
    const editModal = document.getElementById('edit-modal');
    const editModalCloseBtn = document.getElementById('modal-close-btn');
    const editModalBody = document.getElementById('modal-body');
    const editModalTitulo = document.getElementById('modal-titulo');

    const detailsModal = document.getElementById('details-modal');
    const detailsModalCloseBtn = document.getElementById('details-modal-close-btn');
    const detailsModalBody = document.getElementById('details-modal-body');
    const detailsModalTitulo = document.getElementById('details-modal-titulo');

    let selectedMesaId = null;
    let currentSessaoId = null;

    // --- FUNÇÕES DE LÓGICA ---

    async function carregarMesas() {
        // ... (código sem alterações)
        try {
            const response = await fetch('/api/mesas', { headers: { 'Authorization': `Bearer ${token}` } });
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

    async function carregarDetalhesMesa(mesaId, mesaNome) {
        // ... (código sem alterações)
        selectedMesaId = mesaId;
        detalhesTitulo.textContent = `Detalhes da ${mesaNome}`;
        detalhesConteudo.innerHTML = '<p>Carregando histórico...</p>';
        document.querySelectorAll('#lista-mesas li').forEach(li => li.classList.remove('active'));
        document.querySelector(`#lista-mesas li[data-id='${mesaId}']`).classList.add('active');

        try {
            const sessoesResponse = await fetch(`/api/mesas/${mesaId}/sessoes`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!sessoesResponse.ok) throw new Error('Falha ao carregar o histórico.');
            const sessoes = await sessoesResponse.json();
            detalhesConteudo.innerHTML = '';
            if (sessoes.length === 0) {
                detalhesConteudo.innerHTML = '<p>Esta mesa ainda não teve nenhuma sessão de cliente.</p>';
                return;
            }

            for (const sessao of sessoes) {
                const div = document.createElement('div');
                div.className = `session-card ${sessao.status}`;
                const totalGasto = parseFloat(sessao.total_gasto || 0).toFixed(2);
                const dataInicio = new Date(sessao.data_inicio).toLocaleString('pt-BR');
                const dataFim = sessao.data_fim ? new Date(sessao.data_fim).toLocaleString('pt-BR') : '';

                let actionsHTML = '';
                if (sessao.status === 'ativa') {
                    actionsHTML = `
                    <div class="session-actions">
                        <button class="action-btn print-btn" data-sessao-id="${sessao.id}"><i class="fas fa-print"></i> Imprimir Conta</button>
                        <button class="action-btn edit-btn" data-sessao-id="${sessao.id}"><i class="fas fa-edit"></i> Editar Pedidos</button>
                        <button class="action-btn close-btn" data-sessao-id="${sessao.id}"><i class="fas fa-check-circle"></i> Fechar Conta</button>
                    </div>`;
                } else {
                    actionsHTML = `
                    <div class="session-actions">
                        <button class="action-btn view-details-btn" data-sessao-id="${sessao.id}"><i class="fas fa-receipt"></i> Ver Detalhes</button>
                    </div>`;
                }

                div.innerHTML = `
                    <div class="session-header">
                        <strong><i class="fas fa-user"></i> ${sessao.nome_cliente}</strong>
                        <span class="status-tag ${sessao.status}">${sessao.status}</span>
                    </div>
                    <div class="session-body">
                        <p><strong>Início:</strong> ${dataInicio}</p>
                        ${dataFim ? `<p><strong>Fim:</strong> ${dataFim}</p>` : ''}
                        <p><strong>Total Gasto:</strong> R$ ${totalGasto}</p>
                    </div>
                    ${actionsHTML}
                `;
                detalhesConteudo.appendChild(div);
            }
        } catch (error) {
            detalhesConteudo.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    async function deletarMesa(mesaId, mesaNome) {
        // ... (código sem alterações)
        if (confirm(`Tem certeza que deseja remover a ${mesaNome}?`)) {
            try {
                const response = await fetch(`/api/mesas/${mesaId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                if (!response.ok) throw new Error('Falha ao remover a mesa.');
                if (selectedMesaId === mesaId) {
                    detalhesTitulo.textContent = 'Selecione uma mesa';
                    detalhesConteudo.innerHTML = '<p class="placeholder-text"><i class="fas fa-info-circle"></i>A mesa selecionada foi removida.</p>';
                }
                carregarMesas();
            } catch (error) {
                alert(error.message);
            }
        }
    }

    async function abrirModalDeEdicao(sessaoId) {
        currentSessaoId = sessaoId;
        editModalTitulo.textContent = `Editando Pedidos (Sessão #${sessaoId})`;
        editModalBody.innerHTML = '<p>Carregando pedidos...</p>';
        editModal.classList.remove('hidden');

        try {
            const response = await fetch(`/api/sessoes/${sessaoId}/pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao carregar pedidos.');
            const pedidos = await response.json();
            
            if (pedidos.length === 0) {
                editModalBody.innerHTML = '<p>Nenhum pedido feito nesta sessão.</p>';
                return;
            }

            let pedidosHTML = '<ul>';
            pedidos.forEach(pedido => {
                const isCanceled = pedido.status === 'cancelado';
                // O contêiner do lado direito agora tem um ID para ser facilmente manipulado
                pedidosHTML += `
                    <li class="pedido-item ${isCanceled ? 'cancelado' : ''}" data-pedido-id="${pedido.id}">
                        <span>${pedido.quantidade}x ${pedido.nome_produto}</span>
                        <div class="item-actions" id="actions-for-${pedido.id}">
                            ${!isCanceled ? `
                            <button class="cancel-item-btn" title="Cancelar Item">
                                <i class="fas fa-times-circle"></i>
                            </button>` : `
                            <span class="motivo-cancelamento" title="Motivo: ${pedido.motivo_cancelamento}">(Cancelado: ${pedido.motivo_cancelamento})</span>`}
                        </div>
                    </li>`;
            });
            pedidosHTML += '</ul>';
            editModalBody.innerHTML = pedidosHTML;
        } catch (error) {
            editModalBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    async function abrirModalDeDetalhes(sessaoId) {
        // ... (código sem alterações)
        currentSessaoId = sessaoId;
        detailsModalTitulo.textContent = `Recibo da Sessão #${sessaoId}`;
        detailsModalBody.innerHTML = '<p>Carregando detalhes...</p>';
        detailsModal.classList.remove('hidden');

        try {
            const response = await fetch(`/api/sessoes/${sessaoId}/pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao carregar detalhes da sessão.');
            const pedidos = await response.json();

            let subtotal = 0;
            let pedidosHTML = '<ul>';
            
            if (pedidos.length > 0) {
                pedidos.forEach(pedido => {
                    const isCanceled = pedido.status === 'cancelado';
                    if (!isCanceled) {
                        subtotal += pedido.quantidade * pedido.preco_unitario;
                    }
                    pedidosHTML += `
                        <li class="pedido-item ${isCanceled ? 'cancelado' : ''}">
                            <span>${pedido.quantidade}x ${pedido.nome_produto}</span>
                            ${isCanceled ? `
                            <span class="motivo-cancelamento">(Cancelado)</span>` : `
                            <span>R$ ${(pedido.quantidade * pedido.preco_unitario).toFixed(2)}</span>`}
                        </li>`;
                });
            } else {
                pedidosHTML += '<p>Nenhum pedido registrado nesta sessão.</p>';
            }
            pedidosHTML += '</ul>';

            const taxaServico = subtotal * 0.10;
            const totalFinal = subtotal + taxaServico;

            pedidosHTML += `
                <div class="details-summary">
                    <div class="summary-item">
                        <span>Subtotal</span>
                        <span>R$ ${subtotal.toFixed(2)}</span>
                    </div>
                    <div class="summary-item">
                        <span>Taxa de Serviço (10%)</span>
                        <span>R$ ${taxaServico.toFixed(2)}</span>
                    </div>
                    <div class="summary-item total">
                        <span>TOTAL PAGO</span>
                        <span>R$ ${totalFinal.toFixed(2)}</span>
                    </div>
                </div>
            `;
            
            detailsModalBody.innerHTML = pedidosHTML;
        } catch (error) {
            detailsModalBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    // --- EVENT LISTENERS ---

    // ... (código dos listeners de formAddMesa e listaMesas, sem alterações)
    formAddMesa.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-mesa-input').value.trim();
        const senha = document.getElementById('senha-mesa-input').value.trim();
        try {
            const response = await fetch('/api/mesas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome_usuario: nome, senha })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            document.getElementById('form-message').textContent = `Mesa "${nome}" adicionada!`;
            document.getElementById('form-message').style.color = 'green';
            formAddMesa.reset();
            carregarMesas();
        } catch (error) {
            document.getElementById('form-message').textContent = error.message;
            document.getElementById('form-message').style.color = 'red';
        }
        setTimeout(() => document.getElementById('form-message').textContent = '', 3000);
    });

    listaMesas.addEventListener('click', (e) => {
        const itemMesa = e.target.closest('.mesa-list-item');
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            e.stopPropagation();
            deletarMesa(itemMesa.dataset.id, itemMesa.dataset.nome);
        } else if (itemMesa) {
            carregarDetalhesMesa(itemMesa.dataset.id, itemMesa.dataset.nome);
        }
    });

    detalhesConteudo.addEventListener('click', async (e) => {
        const editButton = e.target.closest('.edit-btn');
        if (editButton) {
            abrirModalDeEdicao(editButton.dataset.sessaoId);
            return;
        }

        const viewDetailsButton = e.target.closest('.view-details-btn');
        if (viewDetailsButton) {
            abrirModalDeDetalhes(viewDetailsButton.dataset.sessaoId);
            return;
        }

        const closeButton = e.target.closest('.close-btn');
        if (closeButton) {
            const sessaoId = closeButton.dataset.sessaoId;
            if (confirm('Tem certeza que deseja fechar esta conta?')) {
                try {
                    const response = await fetch(`/api/sessoes/${sessaoId}/fechar`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                    if (!response.ok) throw new Error((await response.json()).message);
                    alert('Conta fechada com sucesso!');
                    carregarDetalhesMesa(selectedMesaId, document.querySelector(`#lista-mesas li[data-id='${selectedMesaId}']`).dataset.nome);
                } catch (error) {
                    alert(`Erro: ${error.message}`);
                }
            }
            return;
        }

        const printButton = e.target.closest('.print-btn');
        if (printButton) {
            alert('Funcionalidade de impressão ainda não implementada.');
        }
    });

    // ====================================================================
    // --- LISTENER PROFISSIONAL PARA O MODAL DE EDIÇÃO ---
    // ====================================================================
    editModalBody.addEventListener('click', async (e) => {
        const pedidoItem = e.target.closest('.pedido-item');
        if (!pedidoItem) return;
        const pedidoId = pedidoItem.dataset.pedidoId;
        const actionsContainer = pedidoItem.querySelector('.item-actions');

        // --- Ação: Clicou no botão inicial de cancelar (X) ---
        if (e.target.closest('.cancel-item-btn')) {
            actionsContainer.innerHTML = `
                <div class="cancel-form-container">
                    <input type="text" class="motivo-input" placeholder="Motivo do cancelamento..." required>
                    <button class="confirm-cancel-btn" title="Confirmar"><i class="fas fa-check"></i></button>
                    <button class="undo-cancel-btn" title="Desfazer"><i class="fas fa-undo"></i></button>
                </div>
            `;
        }

        // --- Ação: Clicou no botão de confirmar o cancelamento (✓) ---
        if (e.target.closest('.confirm-cancel-btn')) {
            const motivoInput = actionsContainer.querySelector('.motivo-input');
            const motivo = motivoInput.value.trim();

            if (!motivo) {
                alert('O motivo do cancelamento é obrigatório.');
                motivoInput.focus();
                return;
            }

            try {
                const response = await fetch(`/api/pedidos/${pedidoId}/cancelar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ motivo })
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                
                alert('Item cancelado com sucesso!');
                
                pedidoItem.classList.add('cancelado');
                actionsContainer.innerHTML = `<span class="motivo-cancelamento" title="Motivo: ${motivo}">(Cancelado: ${motivo})</span>`;

                const mesaAtiva = document.querySelector('#lista-mesas li.active');
                if (mesaAtiva) {
                    await carregarDetalhesMesa(mesaAtiva.dataset.id, mesaAtiva.dataset.nome);
                }
            } catch (error) {
                alert(`Erro ao cancelar: ${error.message}`);
            }
        }

        // --- Ação: Clicou no botão de desfazer a ação de cancelar ---
        if (e.target.closest('.undo-cancel-btn')) {
            actionsContainer.innerHTML = `
                <button class="cancel-item-btn" title="Cancelar Item">
                    <i class="fas fa-times-circle"></i>
                </button>
            `;
        }
    });

    // Listeners para fechar os modais
    editModalCloseBtn.addEventListener('click', () => editModal.classList.add('hidden'));
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.add('hidden');
    });

    detailsModalCloseBtn.addEventListener('click', () => detailsModal.classList.add('hidden'));
    detailsModal.addEventListener('click', (e) => {
        if (e.target === detailsModal) detailsModal.classList.add('hidden');
    });

    // --- INICIALIZAÇÃO ---
    carregarMesas();
});
