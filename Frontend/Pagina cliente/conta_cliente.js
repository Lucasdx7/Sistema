/**
 * ==================================================================
 * SCRIPT DA PÁGINA DA CONTA DO CLIENTE (conta_cliente.html)
 * ==================================================================
 * Exibe o resumo dos pedidos, permite o logout e o chamado de garçom.
 *
 * Depende do objeto `Notificacao` fornecido por `notificacoes.js`.
 */

function agruparPedidos(pedidos) {
    // ... (função agruparPedidos permanece a mesma)
    if (!pedidos || pedidos.length === 0) return [];
    const itensAgrupados = {};
    pedidos.forEach(pedido => {
        const chave = `${pedido.nome_produto}-${pedido.status}-${pedido.observacao || ''}`;
        if (itensAgrupados[chave]) {
            itensAgrupados[chave].quantidade += pedido.quantidade;
        } else {
            itensAgrupados[chave] = { ...pedido, quantidade: pedido.quantidade };
        }
    });
    return Object.values(itensAgrupados);
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Autenticação ---
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId');
    const dadosCliente = JSON.parse(localStorage.getItem('dadosCliente'));
    const nomeMesa = localStorage.getItem('nomeMesa');

    if (!token || !sessaoId) {
        Notificacao.erro('Sessão não encontrada', 'Redirecionando para a tela de login.')
            .then(() => window.location.href = '/login');
        return;
    }

    // --- Elementos do DOM ---
    const clienteNomeEl = document.getElementById('cliente-nome');
    const clienteMesaEl = document.getElementById('cliente-mesa');
    const listaPedidos = document.getElementById('lista-pedidos');
    const subtotalEl = document.getElementById('subtotal-valor');
    const taxaEl = document.getElementById('taxa-servico');
    const totalEl = document.getElementById('total-valor');
    const hiddenButton = document.getElementById('hidden-logout-button');
    const logoutModal = document.getElementById('logout-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const logoutForm = document.getElementById('logout-form');
    
    // ==================================================
    // NOVO ELEMENTO DO DOM
const chamarGarcomBtn = document.querySelector('.call-waiter-btn');

    // ==================================================

    // --- Preenche os detalhes do cliente ---
    if (clienteNomeEl) clienteNomeEl.textContent = dadosCliente?.nome || 'Cliente';
    if (clienteMesaEl) clienteMesaEl.textContent = nomeMesa || 'Mesa';

    // --- Funções ---

    async function carregarConta() {
        // ... (função carregarConta permanece a mesma)
        listaPedidos.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> Carregando sua conta...</p>';
        try {
            const response = await fetch(`/api/sessoes/${sessaoId}/conta`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            listaPedidos.innerHTML = '';
            
            if (data.pedidos && data.pedidos.length > 0) {
                const pedidosAgrupados = agruparPedidos(data.pedidos);
                pedidosAgrupados.forEach(item => {
                    const li = document.createElement('li');
                    const isCanceled = item.status === 'cancelado';
                    const temObservacao = item.observacao && item.observacao.trim() !== '';
                    if (isCanceled) li.classList.add('cancelado');

                    li.innerHTML = `
                        <div class="produto-info">
                            <img src="${item.imagem_svg || '/img/placeholder.svg'}" alt="${item.nome_produto}">
                            <div>
                                <strong>${item.nome_produto}</strong>
                                <span>${item.quantidade} x R$ ${parseFloat(item.preco_unitario).toFixed(2)}</span>
                                ${isCanceled ? '<span class="cancelado-tag">Cancelado pela gerência</span>' : ''}
                                ${temObservacao ? `<p class="observacao-info">Obs: <em>${item.observacao}</em></p>` : ''}
                            </div>
                        </div>
                        <span>R$ ${(item.quantidade * item.preco_unitario).toFixed(2)}</span>
                    `;
                    listaPedidos.appendChild(li);
                });
            } else {
                listaPedidos.innerHTML = '<p>Ainda não há pedidos registrados nesta conta.</p>';
            }

            const subtotal = parseFloat(data.total) || 0;
            const taxa = subtotal * 0.10;
            const total = subtotal + taxa;

            subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
            taxaEl.textContent = `R$ ${taxa.toFixed(2)}`;
            totalEl.textContent = `R$ ${total.toFixed(2)}`;
        } catch (error) {
            Notificacao.erro('Erro ao Carregar Conta', error.message);
            listaPedidos.innerHTML = `<p class="error-message">Não foi possível carregar os detalhes da sua conta.</p>`;
        }
    }

    // ==================================================
    // NOVA FUNÇÃO PARA CHAMAR O GARÇOM
    // ==================================================
    async function chamarGarcom() {
        // Desabilita o botão para evitar múltiplos cliques
        chamarGarcomBtn.disabled = true;
        chamarGarcomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chamando...';

        try {
            const response = await fetch('/api/mesas/chamar-garcom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
                // Não precisamos enviar corpo (body), pois o token já identifica a mesa.
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Não foi possível completar a chamada.');
            }

            // Notifica o cliente que a chamada foi feita com sucesso.
            Notificacao.sucesso('Chamado Enviado!', 'Um garçom foi notificado e virá até sua mesa em breve.');

        } catch (error) {
            Notificacao.erro('Falha na Chamada', error.message);
        } finally {
            // Reabilita o botão após 10 segundos para evitar spam
            setTimeout(() => {
                chamarGarcomBtn.disabled = false;
                chamarGarcomBtn.innerHTML = '<i class="fas fa-bell"></i> Chamar Garçom';
            }, 10000); // 10 segundos de cooldown
        }
    }
    // ==================================================

    // --- Lógica do Modal de Logout ---
    function fecharModalLogout() {
        // ... (função fecharModalLogout permanece a mesma)
        logoutModal.classList.add('hidden');
        logoutForm.reset();
    }

    hiddenButton.addEventListener('click', () => {
        // ... (lógica do botão de logout permanece a mesma)
        logoutModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', fecharModalLogout);

    logoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = logoutForm.querySelector('button[type="submit"]');
    const usuarioMesa = document.getElementById('mesa-usuario').value;
    const senhaMesa = document.getElementById('mesa-senha').value;
    const formaPagamento = formaPagamentoInput.value; // Pega o valor do pagamento

    if (!usuarioMesa || !senhaMesa) {
        return Notificacao.erro('Campos Vazios', 'Usuário e senha da mesa são obrigatórios.');
    }
    // Validação da forma de pagamento
    if (!formaPagamento) {
        return Notificacao.erro('Campo Obrigatório', 'Por favor, selecione a forma de pagamento.');
    }

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

    try {
        // 1. Autentica as credenciais da mesa (sem alterações aqui)
        const authResponse = await fetch('/auth/login-cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_usuario: usuarioMesa, senha: senhaMesa })
        });
        const authResult = await authResponse.json();
        if (!authResponse.ok) throw new Error(authResult.message);

        // 2. Se a autenticação for bem-sucedida, fecha a conta ENVIANDO A FORMA DE PAGAMENTO
        const closeResponse = await fetch(`/api/sessoes/${sessaoId}/fechar`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', // Adiciona o header
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ forma_pagamento: formaPagamento }) // Envia o dado no corpo
        });
        const closeResult = await closeResponse.json();
        if (!closeResponse.ok) throw new Error(closeResult.message);

        // 3. Limpa o localStorage e redireciona (sem alterações aqui)
        localStorage.removeItem('token');
        localStorage.removeItem('sessaoId');
        localStorage.removeItem('mesaId');
        localStorage.removeItem('nomeMesa');
        localStorage.removeItem('dadosCliente');
        localStorage.removeItem('carrinho');

        Notificacao.sucesso('Sessão Encerrada!', 'Obrigado pela preferência e volte sempre.');

        setTimeout(() => {
            window.location.href = '/login';
        }, 2500);

    } catch (error) {
        Notificacao.erro('Falha no Logout', error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = 'Confirmar e Sair';
    }
});

    const paymentOptions = document.querySelector('.payment-options');
const formaPagamentoInput = document.getElementById('forma-pagamento-input');

// Adicione este event listener para os botões de pagamento
paymentOptions.addEventListener('click', (e) => {
    const selectedBtn = e.target.closest('.payment-btn');
    if (!selectedBtn) return;

    // Remove a seleção de todos os botões
    paymentOptions.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('selected'));
    // Adiciona a seleção ao botão clicado
    selectedBtn.classList.add('selected');
    // Guarda o valor no input escondido
    formaPagamentoInput.value = selectedBtn.dataset.payment;
});

    // --- Inicialização ---
    carregarConta();
    
    // ==================================================
    // NOVO EVENT LISTENER
    if (chamarGarcomBtn) {
        chamarGarcomBtn.addEventListener('click', chamarGarcom);
    }
    // ==================================================
});
