document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId');
    if (!token || !sessaoId) {
        alert('Sessão inválida. Redirecionando...');
        window.location.href = '/login';
        return;
    }

    // O carrinho agora é a nossa fonte da verdade para a página
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // --- Elementos do DOM ---
    const listaResumo = document.getElementById('lista-resumo-pedido');
    const subtotalEl = document.getElementById('subtotal-valor');
    const totalEl = document.getElementById('total-valor');
    const voltarBtn = document.getElementById('voltar-cardapio-btn');
    const confirmarBtn = document.getElementById('confirmar-pedido-btn');
    const cartBadge = document.querySelector('.cart-icon .badge');
    const profileIcon = document.getElementById('profile-icon');

    /**
     * Renderiza a página inteira com base no estado atual do carrinho.
     */
    function renderizarPagina() {
        listaResumo.innerHTML = ''; // Limpa a lista antes de redesenhar
        let subtotal = 0;

        if (carrinho.length === 0) {
            listaResumo.innerHTML = '<p class="empty-cart-message">Seu carrinho de pré-pedido está vazio. Volte ao cardápio para adicionar itens.</p>';
            confirmarBtn.disabled = true;
            confirmarBtn.style.opacity = '0.6';
        } else {
            confirmarBtn.disabled = false;
            confirmarBtn.style.opacity = '1';
        }

        carrinho.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'order-item';
            li.dataset.index = index; // Usa o índice do array como identificador

            li.innerHTML = `
                <img src="${item.imagem_svg || 'https://via.placeholder.com/80'}" alt="${item.nome}" class="order-item-image">
                <div class="order-item-details">
                    <h3>${item.nome}</h3>
                    <span class="item-price">R$ ${parseFloat(item.preco ).toFixed(2)}</span>
                    <input type="text" class="observation-input" placeholder="Alguma observação? (Ex: sem cebola)" value="${item.observacao || ''}">
                </div>
                <button class="remove-item-btn" title="Remover item"><i class="fas fa-times"></i></button>
            `;
            listaResumo.appendChild(li);
            subtotal += parseFloat(item.preco);
        });

        subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        cartBadge.textContent = carrinho.length;
        cartBadge.style.display = carrinho.length > 0 ? 'flex' : 'none';
    }

    /**
     * Atualiza o carrinho no localStorage e redesenha a página.
     */
    function atualizarCarrinho(novoCarrinho) {
        carrinho = novoCarrinho;
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        renderizarPagina();
    }

    /**
     * Lida com os eventos na lista de pedidos (remover item e salvar observação).
     */
    listaResumo.addEventListener('click', (e) => {
        if (e.target.closest('.remove-item-btn')) {
            const itemLi = e.target.closest('.order-item');
            const indexParaRemover = parseInt(itemLi.dataset.index, 10);
            
            if (confirm(`Tem certeza que deseja remover "${carrinho[indexParaRemover].nome}" do seu pedido?`)) {
                const novoCarrinho = carrinho.filter((_, index) => index !== indexParaRemover);
                atualizarCarrinho(novoCarrinho);
            }
        }
    });

    listaResumo.addEventListener('input', (e) => {
        if (e.target.classList.contains('observation-input')) {
            const itemLi = e.target.closest('.order-item');
            const indexParaAtualizar = parseInt(itemLi.dataset.index, 10);
            carrinho[indexParaAtualizar].observacao = e.target.value;
            // Salva a observação no localStorage sem redesenhar a tela inteira
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
        }
    });

    /**
     * Envia o pedido final para a API.
     */
    async function confirmarPedido() {
        confirmarBtn.disabled = true;
        confirmarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        const pedidosParaEnviar = carrinho.map(item => ({
            id_sessao: sessaoId,
            id_produto: item.id,
            preco_unitario: item.preco,
            observacao: item.observacao || null
        }));

        try {
            const promessasDePedidos = pedidosParaEnviar.map(pedido =>
                fetch('/api/pedidos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(pedido)
                }).then(async response => {
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido.' }));
                        throw new Error(errorData.message);
                    }
                    return response.json();
                })
            );

            await Promise.all(promessasDePedidos);
            
            atualizarCarrinho([]); // Limpa o carrinho local e o localStorage
            alert('Pedido confirmado com sucesso e enviado para a cozinha!');
            window.location.href = '/cardapio';

        } catch (error) {
            console.error('Falha ao confirmar pedido:', error);
            alert(`Houve um erro ao confirmar seu pedido:\n\n${error.message}\n\nPor favor, tente novamente ou chame um garçom.`);
        } finally {
            confirmarBtn.disabled = false;
            confirmarBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar e Enviar';
        }
    }

    // --- Event Listeners Iniciais ---
    voltarBtn.addEventListener('click', () => window.location.href = '/cardapio');
    confirmarBtn.addEventListener('click', confirmarPedido);
    profileIcon.addEventListener('click', () => window.location.href = '/conta');

    // --- Renderização Inicial ---
    renderizarPagina();
});
