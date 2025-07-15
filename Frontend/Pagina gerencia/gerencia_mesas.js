/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE GERENCIAMENTO DE MESAS (gerencia_mesas.html)
 * ==================================================================
 * Controla a visualização, adição e gerenciamento de mesas e suas sessões.
 *
 * Depende do objeto `Notificacao` fornecido por `notificacoes.js`.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Autenticação e Permissão ---
    const token = localStorage.getItem('authToken');
    if (!token) {
        Notificacao.erro('Acesso Negado', 'Você precisa estar logado para acessar esta página.')
            .then(() => window.location.href = '/login-gerencia');
        return;
    }

    // --- Elementos do DOM ---
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

    // --- Variáveis de Estado ---
    let selectedMesaId = null;
    let currentSessaoId = null;

    // --- Funções Principais de Renderização ---

    async function carregarMesas() {
        try {
            const response = await fetch('/api/mesas', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao carregar mesas do servidor.');
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
            Notificacao.erro('Erro de Rede', error.message);
            listaMesas.innerHTML = `<p class="error-message">Não foi possível carregar as mesas.</p>`;
        }
    }

    async function carregarDetalhesMesa(mesaId, mesaNome) {
        selectedMesaId = mesaId;
        detalhesTitulo.textContent = `Detalhes da ${mesaNome}`;
        detalhesConteudo.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando histórico...</p>';
        document.querySelectorAll('#lista-mesas li').forEach(li => li.classList.remove('active'));
        document.querySelector(`#lista-mesas li[data-id='${mesaId}']`).classList.add('active');
        try {
            const sessoesResponse = await fetch(`/api/mesas/${mesaId}/sessoes`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!sessoesResponse.ok) throw new Error('Falha ao carregar o histórico de sessões.');
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
            Notificacao.erro('Erro ao Carregar Detalhes', error.message);
            detalhesConteudo.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    async function abrirModalDeDetalhes(sessaoId) {
        currentSessaoId = sessaoId;
        detailsModalTitulo.textContent = `Recibo da Sessão #${sessaoId}`;
        detailsModalBody.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando detalhes...</p>';
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
            Notificacao.erro('Erro no Modal', error.message);
            detailsModalBody.innerHTML = `<p class="error-message">${error.message}</p>`;
            throw error;
        }
    }

    async function abrirModalDeEdicao(sessaoId) {
        currentSessaoId = sessaoId;
        editModalTitulo.textContent = `Editando Pedidos (Sessão #${sessaoId})`;
        editModalBody.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando pedidos...</p>';
        editModal.classList.remove('hidden');
        try {
            const response = await fetch(`/api/sessoes/${sessaoId}/pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao carregar pedidos para edição.');
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
            Notificacao.erro('Erro no Modal', error.message);
            editModalBody.innerHTML = `<p class="error-message">${error.message}</p>`;
        }
    }

    // --- Funções Auxiliares para Geração do Recibo ---
    function generateReceiptHtml(conta, sessaoInfo, sessaoId) { /* ... seu código sem alterações ... */ }
    function generateReceiptCss() { /* ... seu código sem alterações ... */ }

    // --- Event Listeners ---

    formAddMesa.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nomeInput = document.getElementById('nome-mesa-input');
        const senhaInput = document.getElementById('senha-mesa-input');
        const nome = nomeInput.value.trim();
        const senha = senhaInput.value.trim();

        if (!nome || !senha) {
            return Notificacao.erro('Campos Obrigatórios', 'Nome de usuário e senha da mesa são necessários.');
        }

        try {
            const response = await fetch('/api/mesas', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ nome_usuario: nome, senha }) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            Notificacao.sucesso(`Mesa "${nome}" adicionada!`);
            formAddMesa.reset();
            await carregarMesas();
        } catch (error) {
            Notificacao.erro('Falha ao Adicionar', error.message);
        }
    });

    listaMesas.addEventListener('click', async (e) => {
        const itemMesa = e.target.closest('.mesa-list-item');
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            e.stopPropagation();
            const mesaId = itemMesa.dataset.id;
            const mesaNome = itemMesa.dataset.nome;
            const confirmado = await Notificacao.confirmar('Excluir Mesa', `Tem certeza que deseja excluir a mesa "${mesaNome}"? Todas as suas sessões e pedidos serão perdidos. Esta ação é irreversível.`);
            if (confirmado) {
                try {
                    const response = await fetch(`/api/mesas/${mesaId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    if (!response.ok) throw new Error((await response.json()).message);
                    Notificacao.sucesso(`Mesa "${mesaNome}" excluída.`);
                    await carregarMesas();
                    // Limpa o painel de detalhes se a mesa excluída estava selecionada
                    if (selectedMesaId == mesaId) {
                        detalhesTitulo.textContent = 'Detalhes da Mesa';
                        detalhesConteudo.innerHTML = '<p>Selecione uma mesa para ver os detalhes.</p>';
                    }
                } catch (error) {
                    Notificacao.erro('Falha ao Excluir', error.message);
                }
            }
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
        const printButton = e.target.closest('.print-btn, .view-details-btn');
        if (printButton) {
            const sessaoId = printButton.dataset.sessaoId;
            printButton.disabled = true;
            printButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
            try {
                await abrirModalDeDetalhes(sessaoId);
            } catch (error) {
                Notificacao.erro('Erro ao Carregar Detalhes', error.message);
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
            const confirmado = await Notificacao.confirmar('Fechar Conta', 'Tem certeza que deseja fechar esta conta? Esta ação não pode ser desfeita.');
            if (confirmado) {
                try {
                    const response = await fetch(`/api/sessoes/${sessaoId}/fechar`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                    if (!response.ok) throw new Error((await response.json()).message);
                    Notificacao.sucesso('Conta fechada com sucesso!');
                    const mesaAtiva = document.querySelector('#lista-mesas li.active');
                    if (mesaAtiva) await carregarDetalhesMesa(mesaAtiva.dataset.id, mesaAtiva.dataset.nome);
                } catch (error) {
                    Notificacao.erro('Erro ao Fechar Conta', error.message);
                }
            }
        }
    });

    editModalBody.addEventListener('click', async (e) => {
        const pedidoItem = e.target.closest('.pedido-item');
        if (!pedidoItem) return;
        const pedidoId = pedidoItem.dataset.pedidoId;
        const actionsContainer = pedidoItem.querySelector('.item-actions');
        if (e.target.closest('.cancel-item-btn')) {
            actionsContainer.innerHTML = `<div class="cancel-form-container"><input type="text" class="motivo-input" placeholder="Motivo..." required><button class="confirm-cancel-btn" title="Confirmar"><i class="fas fa-check"></i></button><button class="undo-cancel-btn" title="Desfazer"><i class="fas fa-undo"></i></button></div>`;
            actionsContainer.querySelector('.motivo-input').focus();
        }
        if (e.target.closest('.confirm-cancel-btn')) {
            const motivoInput = actionsContainer.querySelector('.motivo-input');
            const motivo = motivoInput.value.trim();
            if (!motivo) {
                return Notificacao.erro('Campo Obrigatório', 'O motivo do cancelamento é obrigatório.');
            }
            try {
                const response = await fetch(`/api/pedidos/${pedidoId}/cancelar`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ motivo }) });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                Notificacao.sucesso('Item cancelado com sucesso!');
                pedidoItem.classList.add('cancelado');
                actionsContainer.innerHTML = `<span class="motivo-cancelamento" title="Motivo: ${motivo}">(Cancelado: ${motivo})</span>`;
                const mesaAtiva = document.querySelector('#lista-mesas li.active');
                if (mesaAtiva) await carregarDetalhesMesa(mesaAtiva.dataset.id, mesaAtiva.dataset.nome);
            } catch (error) {
                Notificacao.erro('Erro ao Cancelar', error.message);
            }
        }
        if (e.target.closest('.undo-cancel-btn')) {
            actionsContainer.innerHTML = `<button class="cancel-item-btn" title="Cancelar Item"><i class="fas fa-times-circle"></i></button>`;
        }
    });

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
                Notificacao.erro("Falha ao Gerar Modelo", error.message);
            } finally {
                printButton.disabled = false;
                printButton.innerHTML = '<i class="fas fa-eye"></i> Gerar Modelo do Recibo';
            }
        }
    });

    editModalCloseBtn.addEventListener('click', () => editModal.classList.add('hidden'));
    editModal.addEventListener('click', (e) => { if (e.target === editModal) editModal.classList.add('hidden'); });

    // --- INICIALIZAÇÃO ---
    carregarMesas();
});
