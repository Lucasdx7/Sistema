/**
 * ==================================================================
 * SCRIPT DA PÁGINA DA CONTA DO CLIENTE (conta_cliente.html)
 * ==================================================================
 * Exibe o resumo dos pedidos, permite o logout (com teclado virtual)
 * e o chamado de garçom.
 *
 * Depende do objeto `Notificacao` fornecido por `notificacoes.js`.
 */

/**
 * Agrupa pedidos com o mesmo nome, status e observação para exibição.
 * @param {Array} pedidos - A lista de pedidos vinda da API.
 * @returns {Array} - A lista de pedidos agrupados.
 */
function agruparPedidos(pedidos) {
    if (!pedidos || pedidos.length === 0) return [];

    const itensAgrupados = {};
    pedidos.forEach(pedido => {
        // A chave de agrupamento considera o produto, status e observação
        const chave = `${pedido.nome_produto}-${pedido.status}-${pedido.observacao || ''}`;
        if (itensAgrupados[chave]) {
            itensAgrupados[chave].quantidade += pedido.quantidade;
        } else {
            // Clona o objeto para evitar mutações inesperadas
            itensAgrupados[chave] = { ...pedido };
        }
    });
    return Object.values(itensAgrupados);
}

document.addEventListener('DOMContentLoaded', () => {
    // --- Autenticação e Dados da Sessão ---
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId');
    const dadosCliente = JSON.parse(localStorage.getItem('dadosCliente'));
    const nomeMesa = localStorage.getItem('nomeMesa');

    // Se não houver token ou sessão, o acesso é inválido.
    if (!token || !sessaoId) {
        Notificacao.erro('Sessão não encontrada', 'Redirecionando para a tela de login.')
            .then(() => window.location.href = '/login');
        return; // Esta linha para a execução de todo o script
    }

    // --- Seletores de Elementos do DOM ---
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
    const chamarGarcomBtn = document.querySelector('.call-waiter-btn');
    const paymentOptions = document.querySelector('.payment-options');
    const formaPagamentoInput = document.getElementById('forma-pagamento-input');

    // --- Preenche os detalhes do cliente na tela ---
    if (clienteNomeEl) clienteNomeEl.textContent = dadosCliente?.nome || 'Cliente';
    if (clienteMesaEl) clienteMesaEl.textContent = nomeMesa || 'Mesa';

    // ==================================================================
    // INÍCIO DA LÓGICA DO TECLADO VIRTUAL
    // ==================================================================
    const keyboard = document.getElementById('virtual-keyboard-alphanumeric');
    const inputs = document.querySelectorAll('.virtual-input'); // Inputs que ativarão o teclado
    const shiftKey = document.getElementById('shift-key');
    const alphaKeys = keyboard.querySelectorAll('.keyboard-key[data-key]');

    let activeInput = null;
    let isShiftActive = false;

    const showKeyboard = (inputElement) => {
        activeInput = inputElement;
        const label = document.querySelector(`label[for=${activeInput.id}]`);
        const keyboardLabel = keyboard.querySelector('#keyboard-target-label');
        
        if (keyboardLabel && label) {
            keyboardLabel.textContent = `Digite: ${label.textContent}`;
        }

        keyboard.classList.remove('hidden');
        setTimeout(() => keyboard.classList.add('visible'), 10); // Pequeno delay para a transição CSS
        document.body.classList.add('keyboard-active');
    };

    const hideKeyboard = () => {
        if (!keyboard.classList.contains('visible')) return;
        keyboard.classList.remove('visible');
        setTimeout(() => keyboard.classList.add('hidden'), 300); // Espera a transição de saída
        document.body.classList.remove('keyboard-active');
        activeInput = null;
    };

    const toggleShift = () => {
        isShiftActive = !isShiftActive;
        shiftKey.classList.toggle('active', isShiftActive);
        alphaKeys.forEach(key => {
            const char = key.dataset.key;
            // Altera apenas caracteres alfabéticos
            if (char.length === 1 && char.match(/[a-zç]/i)) {
                key.textContent = isShiftActive ? char.toUpperCase() : char.toLowerCase();
            }
        });
    };

    // Adiciona o evento de clique para cada input que deve abrir o teclado
    inputs.forEach(input => {
        input.addEventListener('click', (e) => {
            e.stopPropagation(); // Impede que o clique se propague e feche o teclado
            showKeyboard(input);
        });
    });

    // Gerenciador de cliques centralizado para o teclado
    keyboard.addEventListener('click', (e) => {
        if (!activeInput) return;
        const target = e.target.closest('.keyboard-key');
        if (!target) return;

        const key = target.dataset.key;

        if (key) { // Se for uma tecla de caractere (letra, número, espaço)
            let char = key;
            if (isShiftActive) {
                activeInput.value += char.toUpperCase();
                toggleShift(); // Desativa o shift automaticamente após um uso
            } else {
                activeInput.value += char;
            }
        } else if (target.id === 'shift-key') {
            toggleShift();
        } else if (target.id === 'backspace-key') {
            activeInput.value = activeInput.value.slice(0, -1);
        } else if (target.id === 'confirm-key') {
            hideKeyboard();
        }
    });

    // Fecha o teclado se o usuário clicar fora dele
    document.addEventListener('click', (e) => {
        if (activeInput && !keyboard.contains(e.target) && !e.target.matches('.virtual-input')) {
            hideKeyboard();
        }
    });
    
    // Fecha o teclado pelo botão "X" no cabeçalho
    keyboard.querySelector('.keyboard-close-btn').addEventListener('click', hideKeyboard);
    // ==================================================================
    // FIM DA LÓGICA DO TECLADO VIRTUAL
    // ==================================================================

    /**
     * Carrega os dados da conta (pedidos e totais) da API.
     */
    async function carregarConta() {
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

    /**
     * Envia uma notificação para a cozinha/bar para chamar um garçom.
     */
    async function chamarGarcom() {
        chamarGarcomBtn.disabled = true;
        chamarGarcomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chamando...';

        try {
            const response = await fetch('/api/mesas/chamar-garcom', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Não foi possível completar a chamada.');
            }

            Notificacao.sucesso('Chamado Enviado!', 'Um garçom foi notificado e virá até sua mesa em breve.');

        } catch (error) {
            Notificacao.erro('Falha na Chamada', error.message);
        } finally {
            // Adiciona um cooldown para evitar spam de chamadas
            setTimeout(() => {
                chamarGarcomBtn.disabled = false;
                chamarGarcomBtn.innerHTML = '<i class="fas fa-bell"></i> Chamar Garçom';
            }, 10000); // 10 segundos
        }
    }

    /**
     * Fecha o modal de logout e reseta o formulário.
     */
    function fecharModalLogout() {
        hideKeyboard(); // Garante que o teclado seja fechado junto com o modal
        logoutModal.classList.add('hidden');
        logoutForm.reset();
        // Limpa a seleção visual dos botões de pagamento
        paymentOptions.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('selected'));
    }

    // --- Event Listeners ---

    // Botão "secreto" para abrir o modal de logout
    hiddenButton.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
    });

    // Botão para fechar o modal
    closeModalBtn.addEventListener('click', fecharModalLogout);

    // Botão para chamar o garçom
    if (chamarGarcomBtn) {
        chamarGarcomBtn.addEventListener('click', chamarGarcom);
    }

    // Lógica para os botões de seleção de pagamento
    paymentOptions.addEventListener('click', (e) => {
        const selectedBtn = e.target.closest('.payment-btn');
        if (!selectedBtn) return;

        paymentOptions.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('selected'));
        selectedBtn.classList.add('selected');
        formaPagamentoInput.value = selectedBtn.dataset.payment;
    });

    // Submissão do formulário de logout
    logoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        hideKeyboard(); // Garante que o teclado feche ao submeter

        const submitButton = logoutForm.querySelector('button[type="submit"]');
        const usuarioMesa = document.getElementById('mesa-usuario').value;
        const senhaMesa = document.getElementById('mesa-senha').value;
        const formaPagamento = formaPagamentoInput.value;

        if (!usuarioMesa || !senhaMesa) {
            return Notificacao.erro('Campos Vazios', 'Usuário e senha da mesa são obrigatórios.');
        }
        if (!formaPagamento) {
            return Notificacao.erro('Campo Obrigatório', 'Por favor, selecione a forma de pagamento.');
        }

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

        try {
            // 1. Autentica as credenciais da mesa
            const authResponse = await fetch('/auth/login-cliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_usuario: usuarioMesa, senha: senhaMesa })
            });
            const authResult = await authResponse.json();
            if (!authResponse.ok) throw new Error(authResult.message);

            // 2. Se autenticado, fecha a conta enviando a forma de pagamento
            const closeResponse = await fetch(`/api/sessoes/${sessaoId}/fechar`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ forma_pagamento: formaPagamento })
            });
            const closeResult = await closeResponse.json();
            if (!closeResponse.ok) throw new Error(closeResult.message);

            // 3. Limpa o localStorage e redireciona para a tela de login
            localStorage.clear(); // Limpa tudo para garantir uma saída limpa

            await Notificacao.sucesso('Sessão Encerrada!', 'Obrigado pela preferência e volte sempre.');

            window.location.href = '/login';

        } catch (error) {
            Notificacao.erro('Falha no Logout', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Confirmar e Encerrar';
        }
    });

    // --- Inicialização da Página ---
    carregarConta();
});
