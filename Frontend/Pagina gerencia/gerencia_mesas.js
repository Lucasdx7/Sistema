/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE GERENCIAMENTO DE MESAS (gerencia_mesas.html)
 * ==================================================================
 * Controla a visualização, adição e gerenciamento de mesas, suas sessões,
 * e a geração de recibos detalhados.
 * 
 */
document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserRole = document.getElementById('dropdown-user-role');
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

    // --- Autenticação ---
    const token = localStorage.getItem('authToken');
    const usuarioString = localStorage.getItem('usuario');

    if (!token || !usuarioString) {
        Notificacao.erro('Acesso Negado', 'Você precisa estar logado.')
            .then(() => window.location.href = '/login-gerencia');
        return;
    }
    const usuario = JSON.parse(usuarioString);

    // --- Variáveis de Estado ---
    let selectedMesaId = null;
    let currentSessaoId = null;

    // --- Funções ---

    function fazerLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        Notificacao.sucesso('Logout realizado com sucesso!');
        setTimeout(() => window.location.href = '/login-gerencia', 1500);
    }

    async function carregarMesas() {
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
            Notificacao.erro('Erro de Rede', error.message);
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
        if (!sessoesResponse.ok) throw new Error('Falha ao carregar o histórico.');
        
        const sessoes = await sessoesResponse.json();
        detalhesConteudo.innerHTML = '';
        if (sessoes.length === 0) {
            detalhesConteudo.innerHTML = '<p>Esta mesa ainda não teve nenhuma sessão.</p>';
            return;
        }

        sessoes.forEach(sessao => {
            const div = document.createElement('div');
            div.className = `session-card ${sessao.status}`;
            const totalGasto = parseFloat(sessao.total_gasto || 0).toFixed(2);
            const dataInicio = new Date(sessao.data_inicio).toLocaleString('pt-BR');
            const dataFim = sessao.data_fim ? new Date(sessao.data_fim).toLocaleString('pt-BR') : '';

            let pagamentoHTML = '';
            if (sessao.forma_pagamento) {
                const pagamentoFormatado = sessao.forma_pagamento.charAt(0).toUpperCase() + sessao.forma_pagamento.slice(1);
                pagamentoHTML = `<p><strong>Pagamento:</strong> ${pagamentoFormatado}</p>`;
            }

            // ==================================================================
            // --- AQUI ESTÁ A MUDANÇA: Adicionando a linha "Finalizado por" ---
            // ==================================================================
            let finalizadoPorHTML = '';
            if (sessao.status === 'finalizada' && sessao.finalizado_por) {
                finalizadoPorHTML = `<p class="finalizado-por"><strong>Finalizado por:</strong> ${sessao.finalizado_por}</p>`;
            }

            const actionsHTML = sessao.status === 'ativa'
                ? `<div class="session-actions">
                       <button class="action-btn print-btn" data-sessao-id="${sessao.id}"><i class="fas fa-receipt"></i> Ver Conta</button>
                       <button class="action-btn edit-btn" data-sessao-id="${sessao.id}"><i class="fas fa-edit"></i> Editar Pedidos</button>
                   </div>`
                : `<div class="session-actions">
                       <button class="action-btn view-details-btn" data-sessao-id="${sessao.id}"><i class="fas fa-receipt"></i> Ver Detalhes</button>
                   </div>`;

            div.innerHTML = `
                <div class="session-header">
                    <strong><i class="fas fa-user"></i> ${sessao.nome_cliente}</strong>
                    <span class="status-tag ${sessao.status}">${sessao.status}</span>
                </div>
                <div class="session-body">
                    <p><strong>Início:</strong> ${dataInicio}</p>
                    ${dataFim ? `<p><strong>Fim:</strong> ${dataFim}</p>` : ''}
                    <p><strong>Total Gasto:</strong> R$ ${totalGasto}</p>
                    ${pagamentoHTML}
                    ${finalizadoPorHTML} <!-- Linha adicionada aqui -->
                </div>
                ${actionsHTML}`;
            detalhesConteudo.appendChild(div);
        });
    } catch (error) {
        Notificacao.erro('Erro ao Carregar Detalhes', error.message);
    }
}

    // Em /Pagina gerencia/gerencia_mesas.js
// SUBSTITUA A FUNÇÃO INTEIRA POR ESTA VERSÃO FINAL

async function abrirModalDeEdicao(sessaoId) {
    currentSessaoId = sessaoId;
    editModalTitulo.textContent = `Editando Pedidos (Sessão #${sessaoId})`;
    editModalBody.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando pedidos...</p>';
    editModal.classList.remove('hidden');

    try {
        // A rota /api/sessoes/:id/pedidos já busca o motivo do cancelamento.
        // Se não buscar, você precisará ajustar a API para incluir p.motivo_cancelamento
        const response = await fetch(`/api/sessoes/${sessaoId}/pedidos`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao carregar os pedidos para edição.');
        
        const pedidos = await response.json();
        if (pedidos.length === 0) {
            editModalBody.innerHTML = '<p class="placeholder-text">Nenhum pedido feito nesta sessão ainda.</p>';
            return;
        }

        let pedidosHTML = '<ul class="edit-pedidos-list">';
        pedidos.forEach(pedido => {
            const isCanceled = pedido.status === 'cancelado';
            // Calcula o preço total do item, se não estiver cancelado
            const totalItem = !isCanceled ? (pedido.quantidade * pedido.preco_unitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';

            pedidosHTML += `
                <li class="edit-pedido-item ${isCanceled ? 'cancelado' : ''}" 
                    data-pedido-id="${pedido.id}" 
                    data-quantidade="${pedido.quantidade}"
                    data-nome-produto="${pedido.nome_produto}">
                    
                    <div class="item-info">
                        <span class="item-nome">${pedido.quantidade}x ${pedido.nome_produto}</span>
                        ${!isCanceled ? `<span class="item-preco">${totalItem}</span>` : ''}
                        
                        <!-- ================================================================== -->
                        <!-- --- AQUI ESTÁ A MUDANÇA: Exibindo o motivo do cancelamento --- -->
                        <!-- ================================================================== -->
                        ${isCanceled && pedido.motivo_cancelamento ? `
                            <span class="motivo-texto">Motivo: ${pedido.motivo_cancelamento}</span>
                        ` : ''}

                    </div>

                    <div class="item-actions">
                        ${!isCanceled ? `
                            <button class="action-btn cancel-item-btn" title="Cancelar Item">
                                <i class="fas fa-times-circle"></i> Cancelar
                            </button>` 
                        : `
                            <span class="status-cancelado" title="Este item foi cancelado.">
                                <i class="fas fa-check-circle"></i> Cancelado
                            </span>`
                        }
                    </div>
                </li>`;
        });
        pedidosHTML += '</ul>';
        editModalBody.innerHTML = pedidosHTML;

    } catch (error) {
        Notificacao.erro('Erro ao Abrir Modal', error.message);
        editModalBody.innerHTML = `<p class="error-message">${error.message}</p>`;
    }
}


    // Em /Pagina gerencia/gerencia_mesas.js

// Em /Pagina gerencia/gerencia_mesas.js

function generateReceiptHtml(conta, sessaoInfo, sessaoId) {
    // --- Cabeçalho do Recibo ---
    const header = `
        <div class="receipt-header">
            <h1>Skina 67</h1>
            <p>Rua da Esquina, 123 - Centro</p>
            <p>Telefone: (99) 99999-9999</p>
            <p>CNPJ: 12.345.678/0001-99</p>
        </div>
    `;

    // --- Informações da Transação ---
    const dataHora = new Date().toLocaleString('pt-BR');
    const sessionDetails = `
        <div class="receipt-info">
            <p><strong>Data:</strong> ${dataHora}</p>
            <p><strong>Sessão:</strong> #${sessaoId} / <strong>Mesa:</strong> ${sessaoInfo.nome_usuario}</p>
            <p><strong>Cliente:</strong> ${sessaoInfo.nome_cliente || 'Não informado'}</p>
            <p><strong>Telefone:</strong> ${sessaoInfo.telefone_cliente || 'Não informado'}</p>
            <p><strong>CPF:</strong> ${sessaoInfo.cpf_cliente || 'Não informado'}</p>
            <!-- ================================================== -->

        </div>
    `;

    // --- Itens Consumidos ---
    let itensHtml = '<div class="receipt-items-header"><span>Qtd. Descrição</span><span>Valor</span></div>';
    conta.pedidos.filter(p => p.status !== 'cancelado').forEach(p => {
        const nomeProduto = `${p.quantidade}x ${p.nome_produto}`;
        const precoItem = `R$ ${(p.quantidade * p.preco_unitario).toFixed(2)}`;
        const nomeProdutoCortado = nomeProduto.length > 28 ? nomeProduto.substring(0, 25) + '...' : nomeProduto;
        itensHtml += `
            <div class="receipt-item">
                <span>${nomeProdutoCortado}</span>
                <span>${precoItem}</span>
            </div>
        `;
    });
    const itemsSection = `<div class="receipt-items-body">${itensHtml}</div>`;

    // --- Resumo Financeiro ---
    const subtotal = parseFloat(conta.total) || 0;
    const taxa = subtotal * 0.10;
    const total = subtotal + taxa;
    const summary = `
        <div class="receipt-summary">
            <div class="summary-item">
                <span>Subtotal</span>
                <span>R$ ${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span>Taxa de Serviço (10%)</span>
                <span>R$ ${taxa.toFixed(2)}</span>
            </div>
            <div class="summary-item total">
                <span>TOTAL</span>
                <span>R$ ${total.toFixed(2)}</span>
            </div>
        </div>
    `;

    // --- Forma de Pagamento ---
    let paymentMethodHtml = '';
    if (sessaoInfo.forma_pagamento) {
        const pagamentoFormatado = sessaoInfo.forma_pagamento.charAt(0).toUpperCase() + sessaoInfo.forma_pagamento.slice(1);
        paymentMethodHtml = `
            <div class="receipt-payment">
                <p>Forma de Pagamento: ${pagamentoFormatado}</p>
            </div>
        `;
    }

    // --- Rodapé ---
    const footer = `
        <div class="receipt-footer">
            <p>Obrigado pela preferência!</p>
            <p>Volte Sempre!</p>
        </div>
    `;

    // --- Monta o recibo completo ---
    return `
        <div class="receipt-wrapper">
            ${header}
            ${sessionDetails}
            ${itemsSection}
            <hr class="dashed">
            ${summary}
            <hr class="dashed">
            ${paymentMethodHtml}
            ${footer}
        </div>
    `;
}



    // Em /Pagina gerencia/gerencia_mesas.js

function generateReceiptCss() {
    return `
        /* Importa uma fonte monoespaçada do Google Fonts */
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code&display=swap' );
        
        /* Reseta estilos padrão do navegador */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Fira Code', monospace; /* Fonte crucial para alinhamento */
            color: #000; /* Cor preta pura */
            background-color: #fff; /* Fundo branco */
            width: 80mm; /* Largura exata da impressora */
            font-size: 10pt; /* Tamanho de fonte legível para recibos */
        }

        .receipt-wrapper {
            padding: 5mm;
        }

        .receipt-header, .receipt-footer, .receipt-payment {
            text-align: center;
        }

        .receipt-header h1 {
            font-size: 1.4em;
            margin-bottom: 5px;
        }

        .receipt-header p, .receipt-footer p, .receipt-info p {
            font-size: 0.9em;
            margin-bottom: 2px;
        }

        hr.dashed {
            border: none;
            border-top: 1px dashed #000;
            margin: 8px 0;
        }

        .receipt-items-header, .receipt-item, .summary-item {
            display: flex;
            justify-content: space-between;
            font-size: 0.9em;
        }
        
        .receipt-items-header {
            font-weight: 600;
            border-bottom: 1px dashed #000;
            margin-bottom: 5px;
            padding-bottom: 5px;
        }

        .receipt-item {
            margin-bottom: 3px;
        }

        .summary-item {
            margin: 4px 0;
        }

        .summary-item.total {
            font-weight: 600;
            font-size: 1.1em;
            border-top: 1px dashed #000;
            padding-top: 5px;
            margin-top: 8px;
        }

        /* Configurações específicas para a impressão */
        @media print {
            /* Remove margens e paddings que o navegador pode adicionar */
            @page {
                margin: 0;
                size: 80mm auto; /* Define o tamanho do papel */
            }
            body {
                margin: 0;
            }
        }
    `;
}

    function conectarWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl );
        ws.onmessage = (event) => {
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
        };
        ws.onclose = () => setTimeout(conectarWebSocket, 5000);
    }

    // --- Event Listeners ---

    // Menu de Perfil
    if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
    if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;
    profileMenuBtn.addEventListener('click', () => profileDropdown.classList.toggle('hidden'));
    window.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });
    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmado = await Notificacao.confirmar('Sair do Sistema', 'Deseja mesmo sair?');
        if (confirmado) fazerLogout();
    });

    // Adicionar Mesa
    formAddMesa.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('nome-mesa-input').value.trim();
        const senha = document.getElementById('senha-mesa-input').value.trim();
        if (!nome || !senha) return Notificacao.erro('Campos Obrigatórios', 'Nome e senha são necessários.');
        try {
            const response = await fetch('/api/mesas', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ nome_usuario: nome, senha }) });
            if (!response.ok) throw new Error((await response.json()).message);
            Notificacao.sucesso(`Mesa "${nome}" adicionada!`);
            formAddMesa.reset();
            await carregarMesas();
        } catch (error) {
            Notificacao.erro('Falha ao Adicionar', error.message);
        }
    });

    // Selecionar ou Deletar Mesa da Lista
    listaMesas.addEventListener('click', async (e) => {
        const itemMesa = e.target.closest('.mesa-list-item');
        if (e.target.closest('.delete-btn')) {
            e.stopPropagation();
            const mesaId = itemMesa.dataset.id;
            const mesaNome = itemMesa.dataset.nome;
            const confirmado = await Notificacao.confirmar('Excluir Mesa', `Deseja mesmo excluir a mesa "${mesaNome}"?`);
            if (confirmado) {
                try {
                    await fetch(`/api/mesas/${mesaId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    Notificacao.sucesso(`Mesa "${mesaNome}" excluída.`);
                    await carregarMesas();
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

    // Ações nos Cards de Sessão (Ver Conta, Editar, Fechar)
    detalhesConteudo.addEventListener('click', async (e) => {
        const target = e.target;
        const sessaoId = target.closest('[data-sessao-id]')?.dataset.sessaoId;
        if (!sessaoId) return;

        if (target.closest('.edit-btn')) {
            abrirModalDeEdicao(sessaoId);
        } else if (target.closest('.print-btn, .view-details-btn')) {
            abrirModalDeDetalhes(sessaoId);
        } else if (target.closest('.close-btn')) {
            // A lógica de fechar conta agora precisa do modal, então foi removida daqui.
            // O ideal seria abrir um modal para o gerente confirmar a forma de pagamento.
            Notificacao.info('Ação Inválida', 'Para fechar a conta, o cliente deve usar a tela da conta no tablet.');
        }
    });

    // Ações no Modal de Edição de Pedidos
    editModalBody.addEventListener('click', async (e) => {
    const cancelButton = e.target.closest('.cancel-item-btn');
    if (!cancelButton) return;

    const pedidoItem = cancelButton.closest('.edit-pedido-item');
    const pedidoId = pedidoItem.dataset.pedidoId;
    const quantidadeAtual = parseInt(pedidoItem.dataset.quantidade, 10);
    const nomeProduto = pedidoItem.dataset.nomeProduto;

    let quantidadeParaCancelar = 1;
    let motivo = '';

    // Se a quantidade for maior que 1, pergunta quantos cancelar.
    if (quantidadeAtual > 1) {
        const { value: formValues, isConfirmed } = await Swal.fire({
            title: `Cancelar "${nomeProduto}"`,
            html: `
                <p>Existem <strong>${quantidadeAtual}</strong> unidades deste item. Quantas você deseja cancelar?</p>
                <input type="number" id="swal-quantidade" class="swal2-input" value="1" min="1" max="${quantidadeAtual}">
                <input type="text" id="swal-motivo" class="swal2-input" placeholder="Motivo do cancelamento (obrigatório)">
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Confirmar Cancelamento',
            cancelButtonText: 'Voltar',
            showDenyButton: true,
            denyButtonText: 'Cancelar Todos',
            confirmButtonColor: '#dc3545',
            denyButtonColor: '#b02a37',
            preConfirm: () => {
                const qtd = document.getElementById('swal-quantidade').value;
                const mot = document.getElementById('swal-motivo').value.trim();
                if (!mot) {
                    Swal.showValidationMessage('O motivo do cancelamento é obrigatório.');
                    return false;
                }
                if (!qtd || qtd < 1 || qtd > quantidadeAtual) {
                    Swal.showValidationMessage(`A quantidade deve ser entre 1 e ${quantidadeAtual}.`);
                    return false;
                }
                return { quantidade: parseInt(qtd, 10), motivo: mot };
            }
        });

        if (!isConfirmed) { // Se o usuário clicou em "Cancelar" ou "Cancelar Todos"
             if (Swal.getDenyButton().ariaPressed) { // Se clicou em "Cancelar Todos"
                const { value: motivoTodos, isConfirmed: isConfirmedTodos } = await Swal.fire({
                    title: 'Cancelar TODOS os itens?',
                    input: 'text',
                    inputLabel: 'Motivo do cancelamento (obrigatório)',
                    inputPlaceholder: 'Digite o motivo aqui...',
                    showCancelButton: true,
                    confirmButtonText: 'Sim, cancelar todos',
                    cancelButtonText: 'Voltar',
                    inputValidator: (value) => {
                        if (!value) {
                            return 'Você precisa informar um motivo!';
                        }
                    }
                });
                if(isConfirmedTodos) {
                    quantidadeParaCancelar = quantidadeAtual;
                    motivo = motivoTodos;
                } else {
                    return; // Usuário desistiu
                }
            } else {
                return; // Usuário fechou ou cancelou
            }
        } else { // Se o usuário confirmou o cancelamento parcial
            quantidadeParaCancelar = formValues.quantidade;
            motivo = formValues.motivo;
        }

    } else { // Se a quantidade for 1, apenas pede o motivo.
        const { value: motivoUnico, isConfirmed } = await Swal.fire({
            title: `Cancelar "${nomeProduto}"`,
            input: 'text',
            inputLabel: 'Qual o motivo do cancelamento?',
            inputPlaceholder: 'Digite o motivo aqui...',
            showCancelButton: true,
            confirmButtonText: 'Confirmar',
            cancelButtonText: 'Voltar',
            inputValidator: (value) => {
                if (!value) {
                    return 'Você precisa informar um motivo!';
                }
            }
        });
        if (!isConfirmed) return;
        motivo = motivoUnico;
    }

    // Envia a requisição para a API
    try {
        const response = await fetch(`/api/pedidos/${pedidoId}/cancelar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ motivo, quantidade: quantidadeParaCancelar })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Falha ao processar o cancelamento.');

        Notificacao.sucesso('Item(s) cancelado(s) com sucesso!');
        
        // Recarrega o modal e os detalhes da mesa para refletir a mudança
        abrirModalDeEdicao(currentSessaoId);
        const mesaAtiva = document.querySelector('#lista-mesas li.active');
        if (mesaAtiva) {
            carregarDetalhesMesa(mesaAtiva.dataset.id, mesaAtiva.dataset.nome);
        }

    } catch (error) {
        Notificacao.erro('Erro ao Cancelar', error.message);
    }
});

    // Ações no Modal de Detalhes da Conta (Gerar Recibo)
    // Em /Pagina gerencia/gerencia_mesas.js

detailsModalBody.addEventListener('click', async (e) => {
    const printButton = e.target.closest('#print-receipt-btn');
    if (!printButton) return;

    if (printButton.disabled) return;
    printButton.disabled = true;
    printButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando...';

    try {
        if (!currentSessaoId) throw new Error("ID da Sessão não encontrado.");
        
        // Busca todos os dados necessários em paralelo
        const [contaResponse, sessaoInfoResponse] = await Promise.all([
            fetch(`/api/sessoes/${currentSessaoId}/conta`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`/api/sessoes/${currentSessaoId}/info`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!contaResponse.ok || !sessaoInfoResponse.ok) throw new Error('Falha ao buscar dados para o recibo.');

        const conta = await contaResponse.json();
        const sessaoInfo = await sessaoInfoResponse.json();

        // Busca a forma de pagamento (que não vem nas rotas acima)
        const sessoesResponse = await fetch(`/api/mesas/${selectedMesaId}/sessoes`, { headers: { 'Authorization': `Bearer ${token}` } });
        const sessoes = await sessoesResponse.json();
        const sessaoAtual = sessoes.find(s => s.id == currentSessaoId);
        sessaoInfo.forma_pagamento = sessaoAtual?.forma_pagamento;

        // Gera o HTML e o CSS do recibo
        const receiptHtml = generateReceiptHtml(conta, sessaoInfo, currentSessaoId);
        const receiptCss = generateReceiptCss();

        // --- NOVA LÓGICA DE IMPRESSÃO DIRETA ---
        // 1. Cria um iframe invisível
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        // 2. Escreve o conteúdo do recibo no iframe
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(`<!DOCTYPE html><html><head><title>Recibo Sessão #${currentSessaoId}</title><style>${receiptCss}</style></head><body>${receiptHtml}</body></html>`);
        iframeDoc.close();

        // 3. Aciona a impressão e remove o iframe depois
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
        // -----------------------------------------
        
    } catch (error) {
        Notificacao.erro("Falha ao Gerar Recibo", error.message);
    } finally {
        printButton.disabled = false;
        printButton.innerHTML = '<i class="fas fa-print"></i> Gerar Recibo';
    }
});


    // Fechar Modais
    editModal.addEventListener('click', (e) => { if (e.target === editModal) editModal.classList.add('hidden'); });
    editModalCloseBtn.addEventListener('click', () => editModal.classList.add('hidden'));
    detailsModal.addEventListener('click', (e) => { if (e.target === detailsModal) detailsModal.classList.add('hidden'); });
    detailsModalCloseBtn.addEventListener('click', () => detailsModal.classList.add('hidden'));

    // --- Inicialização ---
    carregarMesas();
    conectarWebSocket();
});
