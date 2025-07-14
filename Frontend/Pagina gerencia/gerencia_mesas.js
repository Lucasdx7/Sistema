document.addEventListener('DOMContentLoaded', () => {
    // Bloco de autenticação inicial
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login-gerencia';
        return;
    }

    // --- Bloco de declaração de variáveis do DOM ---
    const listaMesas = document.getElementById('lista-mesas');
    const detalhesTitulo = document.getElementById('detalhes-titulo');
    const detalhesConteudo = document.getElementById('detalhes-conteudo');
    const formAddMesa = document.getElementById('form-add-mesa');
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

    // --- Bloco de Funções Principais ---

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
                li.innerHTML = `<span><i class="fas fa-tablet-alt"></i> ${mesa.nome_usuario}</span><button class="delete-btn" title="Remover Mesa"><i class="fas fa-trash-alt"></i></button>`;
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
                let actionsHTML = (sessao.status === 'ativa')
                    ? `<div class="session-actions"><button class="action-btn print-btn" data-sessao-id="${sessao.id}"><i class="fas fa-receipt"></i> Ver Conta</button><button class="action-btn edit-btn" data-sessao-id="${sessao.id}"><i class="fas fa-edit"></i> Editar Pedidos</button><button class="action-btn close-btn" data-sessao-id="${sessao.id}"><i class="fas fa-check-circle"></i> Fechar Conta</button></div>`
                    : `<div class="session-actions"><button class="action-btn view-details-btn" data-sessao-id="${sessao.id}"><i class="fas fa-receipt"></i> Ver Detalhes</button></div>`;
                div.innerHTML = `<div class="session-header"><strong><i class="fas fa-user"></i> ${sessao.nome_cliente}</strong><span class="status-tag ${sessao.status}">${sessao.status}</span></div><div class="session-body"><p><strong>Início:</strong> ${dataInicio}</p>${dataFim ? `<p><strong>Fim:</strong> ${dataFim}</p>` : ''}<p><strong>Total Gasto:</strong> R$ ${totalGasto}</p></div>${actionsHTML}`;
                detalhesConteudo.appendChild(div);
            }
        } catch (error) {
            detalhesConteudo.innerHTML = `<p style="color: red;">${error.message}</p>`;
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
                    if (!isCanceled) subtotal += pedido.quantidade * pedido.preco_unitario;
                    pedidosHTML += `<li class="pedido-item ${isCanceled ? 'cancelado' : ''}"><span>${pedido.quantidade}x ${pedido.nome_produto}</span>${isCanceled ? `<span class="motivo-cancelamento">(Cancelado)</span>` : `<span>R$ ${(pedido.quantidade * pedido.preco_unitario).toFixed(2)}</span>`}</li>`;
                });
            } else {
                pedidosHTML += '<p>Nenhum pedido registrado nesta sessão.</p>';
            }
            pedidosHTML += '</ul>';
            const taxaServico = subtotal * 0.10;
            const totalFinal = subtotal + taxaServico;
            pedidosHTML += `<div class="details-summary"><div class="summary-item"><span>Subtotal</span><span>R$ ${subtotal.toFixed(2)}</span></div><div class="summary-item"><span>Taxa de Serviço (10%)</span><span>R$ ${taxaServico.toFixed(2)}</span></div><div class="summary-item total"><span>TOTAL PAGO</span><span>R$ ${totalFinal.toFixed(2)}</span></div></div><div class="modal-print-footer"><button id="print-receipt-btn" class="action-btn print-btn"><i class="fas fa-eye"></i> Gerar Modelo do Recibo</button></div>`;
            detailsModalBody.innerHTML = pedidosHTML;
        } catch (error) {
            detailsModalBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
            throw error;
        }
    }

    async function abrirModalDeEdicao(sessaoId) {
        // ... (código sem alterações)
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
                pedidosHTML += `<li class="pedido-item ${isCanceled ? 'cancelado' : ''}" data-pedido-id="${pedido.id}"><span>${pedido.quantidade}x ${pedido.nome_produto}</span><div class="item-actions" id="actions-for-${pedido.id}">${!isCanceled ? `<button class="cancel-item-btn" title="Cancelar Item"><i class="fas fa-times-circle"></i></button>` : `<span class="motivo-cancelamento" title="Motivo: ${pedido.motivo_cancelamento}">(Cancelado: ${pedido.motivo_cancelamento})</span>`}</div></li>`;
            });
            pedidosHTML += '</ul>';
            editModalBody.innerHTML = pedidosHTML;
        } catch (error) {
            editModalBody.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    // --- Bloco de Funções Auxiliares para Geração do Recibo (COM ATUALIZAÇÃO) ---

    function generateReceiptHtml(conta, sessaoInfo, sessaoId) {
        const subtotal = parseFloat(conta.total);
        const taxa = subtotal * 0.10;
        const total = subtotal + taxa;
        let itemsHtml = '';
        const pedidosValidos = conta.pedidos.filter(p => p.status !== 'cancelado');
        if (pedidosValidos.length > 0) {
            pedidosValidos.forEach(item => {
                const totalItem = (item.quantidade * item.preco_unitario).toFixed(2).replace('.', ',');
                itemsHtml += `<div class="item"><span>${item.quantidade}x ${item.nome_produto}</span><span>R$ ${totalItem}</span></div>${item.observacao ? `<div class="obs">Obs: ${item.observacao}</div>` : ''}`;
            });
        } else {
            itemsHtml = '<p>Nenhum item consumido.</p>';
        }
        // --- ATUALIZAÇÃO APLICADA AQUI ---
        return `<div class="receipt"><div class="header"><strong>SKINA 67 - COZINHA E BAR</strong><span>Rua Ficticia, 123 - Bairro Centro</span></div><div class="info"><span>SESSÃO: #${sessaoId} | MESA: ${sessaoInfo.nome_usuario}</span><span>CLIENTE: ${sessaoInfo.nome_cliente}</span>${sessaoInfo.cpf_cliente ? `<span>CPF/CNPJ: ${sessaoInfo.cpf_cliente}</span>` : ''}${sessaoInfo.telefone_cliente ? `<span>TELEFONE: ${sessaoInfo.telefone_cliente}</span>` : ''}<span>DATA: ${new Date().toLocaleString('pt-BR')}</span></div><div class="items-header"><strong>ITENS CONSUMIDOS</strong></div><div class="items-list">${itemsHtml}</div><div class="totals"><div class="line"><span>SUBTOTAL</span><span>R$ ${subtotal.toFixed(2).replace('.', ',')}</span></div><div class="line"><span>SERVIÇO (10%)</span><span>R$ ${taxa.toFixed(2).replace('.', ',')}</span></div><div class="line total"><strong>TOTAL</strong><strong>R$ ${total.toFixed(2).replace('.', ',')}</strong></div></div><div class="footer"><span>Obrigado pela preferência!</span></div></div>`;
    }

    function generateReceiptCss() {
        return `@import url('https://fonts.googleapis.com/css2?family=Inconsolata:wght@400;700&display=swap' ); body { background-color: #f0f0f0; display: flex; justify-content: center; align-items: flex-start; padding: 20px; font-family: 'Inconsolata', monospace; } .receipt { width: 302px; background-color: #fff; border: 1px solid #ccc; box-shadow: 0 0 10px rgba(0,0,0,0.1); padding: 15px; font-size: 14px; color: #000; } .header, .footer, .info, .items-header { text-align: center; margin-bottom: 10px; } .header strong { font-size: 16px; } .header span, .footer span { font-size: 12px; } .header, .info, .items-header, .totals { display: flex; flex-direction: column; gap: 5px; } .info, .items-header, .totals { border-top: 1px dashed #000; padding-top: 10px; } .items-list .item, .totals .line { display: flex; justify-content: space-between; } .items-list .obs { font-size: 12px; color: #555; padding-left: 10px; } .totals .total { font-size: 16px; } @page { size: auto; margin: 0mm; } @media print { body { background-color: #fff; padding: 0; } .receipt { width: 100%; border: none; box-shadow: none; } }`;
    }

    // --- Bloco de Event Listeners (COM ATUALIZAÇÃO) ---

    formAddMesa.addEventListener('submit', async (e) => {
        // ... (código sem alterações)
        e.preventDefault();
        const nome = document.getElementById('nome-mesa-input').value.trim();
        const senha = document.getElementById('senha-mesa-input').value.trim();
        try {
            const response = await fetch('/api/mesas', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ nome_usuario: nome, senha }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(`Mesa "${nome}" adicionada!`);
            formAddMesa.reset();
            carregarMesas();
        } catch (error) {
            alert(error.message);
        }
    });

    listaMesas.addEventListener('click', (e) => {
        // ... (código sem alterações)
        const itemMesa = e.target.closest('.mesa-list-item');
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            e.stopPropagation();
            alert('Funcionalidade de deletar a ser implementada.');
        } else if (itemMesa) {
            carregarDetalhesMesa(itemMesa.dataset.id, itemMesa.dataset.nome);
        }
    });

    detalhesConteudo.addEventListener('click', async (e) => {
        // ... (código sem alterações)
        const editButton = e.target.closest('.edit-btn');
        if (editButton) {
            abrirModalDeEdicao(editButton.dataset.sessaoId);
            return;
        }
        const printButton = e.target.closest('.print-btn, .view-details-btn');
        if (printButton) {
            const sessaoId = printButton.dataset.sessaoId;
            printButton.disabled = true;
            printButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
            try {
                await abrirModalDeDetalhes(sessaoId);
            } catch (error) {
                alert(`Não foi possível carregar os detalhes: ${error.message}`);
            } finally {
                setTimeout(() => {
                    printButton.disabled = false;
                    printButton.innerHTML = '<i class="fas fa-receipt"></i> Ver Conta';
                }, 500);
            }
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
                    const mesaAtiva = document.querySelector('#lista-mesas li.active');
                    if (mesaAtiva) carregarDetalhesMesa(mesaAtiva.dataset.id, mesaAtiva.dataset.nome);
                } catch (error) {
                    alert(`Erro: ${error.message}`);
                }
            }
        }
    });

    editModalBody.addEventListener('click', async (e) => {
        // ... (código sem alterações)
        const pedidoItem = e.target.closest('.pedido-item');
        if (!pedidoItem) return;
        const pedidoId = pedidoItem.dataset.pedidoId;
        const actionsContainer = pedidoItem.querySelector('.item-actions');
        if (e.target.closest('.cancel-item-btn')) {
            actionsContainer.innerHTML = `<div class="cancel-form-container"><input type="text" class="motivo-input" placeholder="Motivo..." required><button class="confirm-cancel-btn" title="Confirmar"><i class="fas fa-check"></i></button><button class="undo-cancel-btn" title="Desfazer"><i class="fas fa-undo"></i></button></div>`;
        }
        if (e.target.closest('.confirm-cancel-btn')) {
            const motivoInput = actionsContainer.querySelector('.motivo-input');
            const motivo = motivoInput.value.trim();
            if (!motivo) {
                alert('O motivo do cancelamento é obrigatório.');
                motivoInput.focus();
                return;
            }
            try {
                const response = await fetch(`/api/pedidos/${pedidoId}/cancelar`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ motivo }) });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                alert('Item cancelado com sucesso!');
                pedidoItem.classList.add('cancelado');
                actionsContainer.innerHTML = `<span class="motivo-cancelamento" title="Motivo: ${motivo}">(Cancelado: ${motivo})</span>`;
                const mesaAtiva = document.querySelector('#lista-mesas li.active');
                if (mesaAtiva) await carregarDetalhesMesa(mesaAtiva.dataset.id, mesaAtiva.dataset.nome);
            } catch (error) {
                alert(`Erro ao cancelar: ${error.message}`);
            }
        }
        if (e.target.closest('.undo-cancel-btn')) {
            actionsContainer.innerHTML = `<button class="cancel-item-btn" title="Cancelar Item"><i class="fas fa-times-circle"></i></button>`;
        }
    });

    // Listener unificado para o modal de detalhes (COM ATUALIZAÇÃO)
    detailsModal.addEventListener('click', async (e) => {
        if (e.target === detailsModal || e.target.closest('#details-modal-close-btn')) {
            detailsModal.classList.add('hidden');
        }
        if (e.target.closest('#print-receipt-btn')) {
            const printButton = document.getElementById('print-receipt-btn');
            if (printButton.disabled) return;
            printButton.disabled = true;
            printButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';
            try {
                if (!currentSessaoId) throw new Error("ID da Sessão não encontrado.");
                
                // --- ATUALIZAÇÃO APLICADA AQUI ---
                // Fazendo duas chamadas em paralelo para otimizar o tempo
                const [contaResponse, sessaoInfoResponse] = await Promise.all([
                    fetch(`/api/sessoes/${currentSessaoId}/conta`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`/api/sessoes/${currentSessaoId}/info`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                if (!contaResponse.ok) throw new Error((await contaResponse.json()).message || 'Falha ao buscar dados da conta.');
                if (!sessaoInfoResponse.ok) throw new Error((await sessaoInfoResponse.json()).message || 'Falha ao buscar informações da sessão.');

                const conta = await contaResponse.json();
                const sessaoInfo = await sessaoInfoResponse.json();
                
                const receiptHtml = generateReceiptHtml(conta, sessaoInfo, currentSessaoId);
                const receiptCss = generateReceiptCss();
                const printWindow = window.open('', '_blank');
                printWindow.document.write(`<!DOCTYPE html><html><head><title>Recibo Sessão #${currentSessaoId}</title><style>${receiptCss}</style></head><body>${receiptHtml}</body></html>`);
                printWindow.document.close();
            } catch (error) {
                console.error("Falha ao gerar modelo:", error);
                alert(`ERRO: ${error.message}`);
            } finally {
                printButton.disabled = false;
                printButton.innerHTML = '<i class="fas fa-eye"></i> Gerar Modelo do Recibo';
            }
        }
    });

    // Listeners para fechar o modal de edição
    editModalCloseBtn.addEventListener('click', () => editModal.classList.add('hidden'));
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) editModal.classList.add('hidden');
    });

    // --- INICIALIZAÇÃO ---
    carregarMesas();
});
