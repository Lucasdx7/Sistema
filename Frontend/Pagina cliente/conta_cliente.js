/**
 * ==================================================================
 * SCRIPT DA PÁGINA DA CONTA DO CLIENTE (conta_cliente.html)
 * ==================================================================
 * Exibe o resumo dos pedidos da sessão atual e permite o logout.
 *
 * Depende do objeto `Notificacao` fornecido por `notificacoes.js` (versão cliente).
 */

/**
 * Agrupa uma lista de pedidos por produto, status E observação.
 * Itens com observações diferentes serão listados separadamente.
 * @param {Array} pedidos - A lista de pedidos vinda da API.
 * @returns {Array} - Uma lista de itens agrupados.
 */
function agruparPedidos(pedidos) {
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

    // --- Preenche os detalhes do cliente ---
    if (clienteNomeEl) clienteNomeEl.textContent = dadosCliente?.nome || 'Cliente';
    if (clienteMesaEl) clienteMesaEl.textContent = nomeMesa || 'Mesa';

    /**
     * Carrega os dados da conta da API e renderiza na tela.
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

    // --- Lógica do Modal de Logout ---
    function fecharModalLogout() {
        logoutModal.classList.add('hidden');
        logoutForm.reset();
    }

    hiddenButton.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', fecharModalLogout);

    logoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = logoutForm.querySelector('button[type="submit"]');
        const usuarioMesa = document.getElementById('mesa-usuario').value;
        const senhaMesa = document.getElementById('mesa-senha').value;

        if (!usuarioMesa || !senhaMesa) {
            return Notificacao.erro('Campos Vazios', 'Usuário e senha da mesa são obrigatórios.');
        }

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';

        try {
            // 1. Autentica as credenciais da mesa para autorizar o fechamento
            const authResponse = await fetch('/auth/login-cliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome_usuario: usuarioMesa, senha: senhaMesa })
            });
            const authResult = await authResponse.json();
            if (!authResponse.ok) throw new Error(authResult.message);

            // 2. Se a autenticação for bem-sucedida, fecha a conta
            const closeResponse = await fetch(`/api/sessoes/${sessaoId}/fechar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const closeResult = await closeResponse.json();
            if (!closeResponse.ok) throw new Error(closeResult.message);

            // 3. Limpa tudo e redireciona com notificação de sucesso
          // Trecho corrigido em conta_cliente.js
            // 3. Limpa APENAS os dados da sessão do cliente e redireciona
            localStorage.removeItem('token');       // Token do cliente
            localStorage.removeItem('sessaoId');    // ID da sessão do cliente
            localStorage.removeItem('mesaId');      // ID da mesa do cliente
            localStorage.removeItem('nomeMesa');    // Nome da mesa do cliente
            localStorage.removeItem('dadosCliente'); // Dados do cliente
            localStorage.removeItem('carrinho');    // Carrinho de compras

            // Mostra a notificação de sucesso
            Notificacao.sucesso('Sessão Encerrada!', 'Obrigado pela preferência e volte sempre.');

            // Aguarda 2.5 segundos e então redireciona para a página de login
            setTimeout(() => {
                window.location.href = '/login';
            }, 2500);


        } catch (error) {
            Notificacao.erro('Falha no Logout', error.message);
        } finally {
            // Reabilita o botão em caso de falha para permitir nova tentativa
            submitButton.disabled = false;
            submitButton.innerHTML = 'Confirmar e Sair';
        }
    });

    // --- Inicialização ---
    carregarConta();
});
