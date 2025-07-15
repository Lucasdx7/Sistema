/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE CONFIRMAÇÃO DE PEDIDO (confirmar_pedido.html)
 * ==================================================================
 * Versão corrigida e otimizada.
 * - Agrupa itens por produto E observação.
 * - Envia o pedido completo em uma única requisição para a API.
 * - Utiliza o sistema de Notificacao.js para feedback ao usuário.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Autenticação e Variáveis de Estado ---
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId');
    const mesaId = localStorage.getItem('mesaId'); // Essencial para a API

    // Validação inicial robusta
    if (!token || !sessaoId || !mesaId) {
        // Usa o sistema de notificação para uma melhor UX
        Notificacao.erro('Sessão Inválida', 'Dados essenciais não encontrados. Você será redirecionado para o login.')
            .then(() => window.location.href = '/login');
        return;
    }

    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let produtoIdParaObservacao = null; // ID do produto no modal
    let observacaoOriginalParaEdicao = ''; // Observação original para encontrar o item correto

    // --- Elementos do DOM ---
    const listaResumo = document.getElementById('lista-resumo-pedido');
    const subtotalEl = document.getElementById('subtotal-valor');
    const totalEl = document.getElementById('total-valor');
    const voltarBtn = document.getElementById('voltar-cardapio-btn');
    const confirmarBtn = document.getElementById('confirmar-pedido-btn');
    const cartBadge = document.querySelector('.cart-icon .badge');
    const profileIcon = document.getElementById('profile-icon');
    const suggestionContainer = document.getElementById('suggestion-item');
    const observationModal = document.getElementById('observation-modal');
    const modalProductName = document.getElementById('modal-product-name');
    const modalTextarea = document.getElementById('modal-textarea');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // --- Funções de Lógica do Carrinho ---

    /**
     * CORRIGIDO: Agrupa itens pela combinação de ID e observação.
     * Isso permite que "X-Burger sem cebola" e "X-Burger normal" sejam itens distintos na lista.
     */
    function agruparItensDoCarrinho(carrinhoBruto) {
        if (!carrinhoBruto || carrinhoBruto.length === 0) return [];
        const itensAgrupados = {};
        carrinhoBruto.forEach(item => {
            const chave = `${item.id}-${item.observacao || ''}`; // Chave única
            if (itensAgrupados[chave]) {
                itensAgrupados[chave].quantidade++;
            } else {
                // Clona o item e adiciona a propriedade quantidade
                itensAgrupados[chave] = { ...item, quantidade: 1 };
            }
        });
        return Object.values(itensAgrupados);
    }

    function atualizarCarrinho(novoCarrinho, redesenhar = true) {
        carrinho = novoCarrinho;
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        if (redesenhar) {
            renderizarPagina();
        }
    }

    // --- Funções de Renderização ---
    function renderizarPagina() {
        const itensAgrupados = agruparItensDoCarrinho(carrinho);
        listaResumo.innerHTML = '';
        let subtotal = 0;

        if (itensAgrupados.length === 0) {
            listaResumo.innerHTML = '<p class="empty-cart-message">Seu carrinho de pré-pedido está vazio.</p>';
            confirmarBtn.disabled = true;
            confirmarBtn.style.opacity = '0.6';
        } else {
            confirmarBtn.disabled = false;
            confirmarBtn.style.opacity = '1';
        }

        itensAgrupados.forEach(item => {
            const li = document.createElement('li');
            li.className = 'order-item';
            li.dataset.produtoId = item.id;
            li.dataset.observacao = item.observacao || ''; // Dataset para identificar o grupo correto

            const precoTotalItem = item.preco * item.quantidade;
            const temObservacao = item.observacao && item.observacao.trim() !== '';

            li.innerHTML = `
                <img src="${item.imagem_svg || '/img/placeholder.svg'}" alt="${item.nome}" class="order-item-image">
                <div class="order-item-details">
                    <h3>${item.nome}</h3>
                    <div class="quantity-control">
                        <button class="quantity-btn decrease-btn" title="Diminuir">-</button>
                        <span class="quantity-value">${item.quantidade}</span>
                        <button class="quantity-btn increase-btn" title="Aumentar">+</button>
                    </div>
                    <span class="item-price">R$ ${precoTotalItem.toFixed(2)}</span>
                    ${temObservacao ? `<p class="observacao-info">Obs: <em>${item.observacao}</em></p>` : ''}
                </div>
                <div class="order-item-actions">
                    <button class="action-btn observation-btn ${temObservacao ? 'active' : ''}" title="Adicionar/Editar Observação">
                        <i class="fas fa-comment-dots"></i>
                    </button>
                    <button class="action-btn remove-item-btn" title="Remover '${item.nome}' com esta observação">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            listaResumo.appendChild(li);
            subtotal += precoTotalItem;
        });

        subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        cartBadge.textContent = carrinho.length; // Badge mostra o total de itens, não de grupos
        cartBadge.style.display = carrinho.length > 0 ? 'flex' : 'none';
    }

    // --- Funções do Modal de Observação ---
    function abrirModalObservacao(produtoId, obsAtual) {
        const itemOriginal = carrinho.find(p => p.id == produtoId);
        if (!itemOriginal) return;

        produtoIdParaObservacao = produtoId;
        observacaoOriginalParaEdicao = obsAtual; // Guarda a observação original
        modalProductName.textContent = itemOriginal.nome;
        modalTextarea.value = obsAtual;
        observationModal.classList.remove('hidden');
        modalTextarea.focus();
    }

    function fecharModalObservacao() {
        observationModal.classList.add('hidden');
        produtoIdParaObservacao = null;
        observacaoOriginalParaEdicao = '';
    }

    function salvarObservacao() {
        if (!produtoIdParaObservacao) return;
        const novaObservacao = modalTextarea.value.trim();
        
        // Atualiza a observação para TODOS os itens correspondentes
        const novoCarrinho = carrinho.map(item => {
            if (item.id == produtoIdParaObservacao && (item.observacao || '') === observacaoOriginalParaEdicao) {
                return { ...item, observacao: novaObservacao };
            }
            return item;
        });
        
        atualizarCarrinho(novoCarrinho);
        fecharModalObservacao();
    }

    // --- Event Listeners ---
    listaResumo.addEventListener('click', async (e) => {
        const itemLi = e.target.closest('.order-item');
        if (!itemLi) return;

        const produtoId = itemLi.dataset.produtoId;
        const obs = itemLi.dataset.observacao;

        // Encontra um item de amostra para adicionar ou remover
        const itemAmostra = carrinho.find(item => item.id == produtoId && (item.observacao || '') === obs);

        if (e.target.closest('.increase-btn')) {
            if (itemAmostra) atualizarCarrinho([...carrinho, { ...itemAmostra }]);
        } else if (e.target.closest('.decrease-btn')) {
            const indexParaRemover = carrinho.findIndex(item => item.id == produtoId && (item.observacao || '') === obs);
            if (indexParaRemover > -1) {
                const novoCarrinho = [...carrinho];
                novoCarrinho.splice(indexParaRemover, 1);
                atualizarCarrinho(novoCarrinho);
            }
        } else if (e.target.closest('.remove-item-btn')) {
            const confirmado = await Notificacao.confirmar('Remover Item', `Deseja remover todos os itens "${itemAmostra.nome}" ${obs ? 'com esta observação' : ''}?`);
            if (confirmado) {
                const novoCarrinho = carrinho.filter(item => !(item.id == produtoId && (item.observacao || '') === obs));
                atualizarCarrinho(novoCarrinho);
            }
        } else if (e.target.closest('.observation-btn')) {
            abrirModalObservacao(produtoId, obs);
        }
    });

    modalSaveBtn.addEventListener('click', salvarObservacao);
    modalCancelBtn.addEventListener('click', fecharModalObservacao);
    observationModal.addEventListener('click', (e) => { if (e.target === observationModal) fecharModalObservacao(); });

    // --- Funções de Ação ---
    async function carregarSugestao() {
        try {
            const response = await fetch('/api/produtos/sugestao', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Nenhuma sugestão encontrada.');
            const sugestoes = await response.json();
            suggestionContainer.innerHTML = '';
            const carouselWrapper = document.createElement('div');
            carouselWrapper.className = 'suggestion-carousel-wrapper';
            sugestoes.forEach(sugestao => {
                const card = document.createElement('div');
                card.className = 'suggestion-card-item';
                card.dataset.produtoId = sugestao.id;
                card.innerHTML = `
                    <div class="suggestion-content">
                        <img src="${sugestao.imagem_svg || '/img/placeholder.svg'}" alt="${sugestao.nome}" class="suggestion-image">
                        <div class="suggestion-details">
                            <h4 class="suggestion-title">${sugestao.nome}</h4>
                            <p class="suggestion-description">${sugestao.descricao}</p>
                        </div>
                    </div>
                    <div class="suggestion-buttons-group">
                        <button class="btn btn-view-category" data-category-id="${sugestao.id_categoria}"><i class="fas fa-tags"></i> Ver em "${sugestao.nome_categoria}"</button>
                        <button class="btn btn-add-suggestion"><i class="fas fa-plus-circle"></i> Adicionar</button>
                    </div>
                `;
                carouselWrapper.appendChild(card);
                card.querySelector('.btn-add-suggestion').addEventListener('click', () => {
                    atualizarCarrinho([...carrinho, sugestao], true);
                    Notificacao.sucesso('Item Adicionado', `"${sugestao.nome}" foi adicionado ao seu carrinho.`);
                    card.querySelector('.btn-add-suggestion').disabled = true;
                    card.querySelector('.btn-add-suggestion').innerHTML = '<i class="fas fa-check"></i> Adicionado';
                });
                card.querySelector('.btn-view-category').addEventListener('click', (e) => {
                    window.location.href = `/cardapio?categoria=${e.currentTarget.dataset.categoryId}`;
                });
            });
            suggestionContainer.appendChild(carouselWrapper);
        } catch (error) {
            console.warn('Não foi possível carregar a sugestão:', error.message);
            suggestionContainer.innerHTML = '<p>Nenhuma sugestão especial no momento.</p>';
        }
    }

    /**
     * CORRIGIDO: Envia o pedido em uma única requisição (bulk)
     * e inclui o `id_mesa` em cada item do pedido.
     */
    async function confirmarPedido() {
        const confirmado = await Notificacao.confirmar('Confirmar Pedido', 'Seu pedido será enviado para a cozinha. Deseja continuar?');
        if (!confirmado) return;

        confirmarBtn.disabled = true;
        confirmarBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        // Mapeia os itens agrupados, garantindo que CADA item tenha TODOS os campos necessários.
        const pedidosParaEnviar = agruparItensDoCarrinho(carrinho).map(item => ({
            id_mesa: mesaId, // <-- CORREÇÃO CRÍTICA: Adiciona o ID da mesa
            id_sessao: sessaoId,
            id_produto: item.id,
            quantidade: item.quantidade,
            preco_unitario: item.preco,
            observacao: item.observacao || null
        }));

        try {
            const response = await fetch('/api/pedidos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                // Envia um objeto contendo a lista de pedidos, como no exemplo original.
                // Se a API espera um array direto, mude para: JSON.stringify(pedidosParaEnviar)
                body: JSON.stringify({ pedidos: pedidosParaEnviar })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido ao enviar pedido.' }));
                // A mensagem de erro agora vem da API, como "Dados do pedido incompletos ou inválidos."
                throw new Error(errorData.message);
            }
            
            atualizarCarrinho([]); // Limpa o carrinho local

            // 1. Mostra a notificação de sucesso.
            Notificacao.sucesso('Pedido Enviado!', 'Seu pedido foi enviado para a cozinha e já está sendo preparado.');

            // 2. Aguarda um curto período (ex: 2 segundos) e SÓ ENTÃO redireciona.
            setTimeout(() => {
                window.location.href = '/cardapio';
            }, 2000);

        } catch (error) {
            console.error('Falha ao confirmar pedido:', error);
            Notificacao.erro('Falha ao Enviar', `${error.message}. Por favor, tente novamente ou chame um garçom.`);
        } finally {
            // Reabilita o botão mesmo se houver erro
            confirmarBtn.disabled = false;
            confirmarBtn.innerHTML = '<i class="fas fa-check"></i> Confirmar e Enviar';
        }
    }

    // --- Event Listeners Finais e Inicialização ---
    voltarBtn.addEventListener('click', () => window.location.href = '/cardapio');
    confirmarBtn.addEventListener('click', confirmarPedido);
    profileIcon.addEventListener('click', () => window.location.href = '/conta');

    renderizarPagina();
    carregarSugestao();
});
