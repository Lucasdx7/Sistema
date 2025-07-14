// Em /Pagina cliente/confirmar_pedido.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Variáveis de Estado e Constantes ---
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId');
    if (!token || !sessaoId) {
        alert('Sessão inválida. Redirecionando...');
        window.location.href = '/login';
        return;
    }
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let produtoIdParaObservacao = null; // Armazena o ID do produto sendo editado no modal

    // --- Elementos do DOM ---
    const listaResumo = document.getElementById('lista-resumo-pedido');
    const subtotalEl = document.getElementById('subtotal-valor');
    const totalEl = document.getElementById('total-valor');
    const voltarBtn = document.getElementById('voltar-cardapio-btn');
    const confirmarBtn = document.getElementById('confirmar-pedido-btn');
    const cartBadge = document.querySelector('.cart-icon .badge');
    const profileIcon = document.getElementById('profile-icon');
    const suggestionContainer = document.getElementById('suggestion-item');

    // --- Elementos do Modal de Observação ---
    const observationModal = document.getElementById('observation-modal');
    const modalProductName = document.getElementById('modal-product-name');
    const modalTextarea = document.getElementById('modal-textarea');
    const modalSaveBtn = document.getElementById('modal-save-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');

    // --- Funções de Lógica do Carrinho ---
    function agruparItensDoCarrinho(carrinhoBruto) {
        if (!carrinhoBruto || carrinhoBruto.length === 0) return [];
        const itensAgrupados = {};
        carrinhoBruto.forEach(item => {
            if (itensAgrupados[item.id]) {
                itensAgrupados[item.id].quantidade++;
            } else {
                itensAgrupados[item.id] = { ...item, quantidade: 1 };
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

            const precoTotalItem = item.preco * item.quantidade;
            const temObservacao = item.observacao && item.observacao.trim() !== '';

            // ESTRUTURA HTML FINAL COM BOTÃO DE OBSERVAÇÃO
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
                </div>
                <div class="order-item-actions">
                    <button class="action-btn observation-btn ${temObservacao ? 'active' : ''}" title="Adicionar Observação">
                        <i class="fas fa-comment-dots"></i>
                    </button>
                    <button class="action-btn remove-item-btn" title="Remover todos os '${item.nome}'">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            listaResumo.appendChild(li);
            subtotal += precoTotalItem;
        });

        subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        totalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
        cartBadge.textContent = carrinho.length;
        cartBadge.style.display = carrinho.length > 0 ? 'flex' : 'none';
    }

    // --- Funções do Modal ---
    function abrirModalObservacao(produtoId) {
        const itemAgrupado = agruparItensDoCarrinho(carrinho).find(p => p.id == produtoId);
        if (!itemAgrupado) return;

        produtoIdParaObservacao = produtoId;
        modalProductName.textContent = itemAgrupado.nome;
        modalTextarea.value = itemAgrupado.observacao || '';
        observationModal.classList.remove('hidden');
        modalTextarea.focus();
    }

    function fecharModalObservacao() {
        observationModal.classList.add('hidden');
        produtoIdParaObservacao = null;
    }

    function salvarObservacao() {
        if (!produtoIdParaObservacao) return;

        const novaObservacao = modalTextarea.value;
        const novoCarrinho = carrinho.map(item => {
            if (item.id == produtoIdParaObservacao) {
                return { ...item, observacao: novaObservacao };
            }
            return item;
        });
        
        atualizarCarrinho(novoCarrinho); // Atualiza e redesenha para mostrar o ícone ativo
        fecharModalObservacao();
    }

    // --- Event Listeners ---
    listaResumo.addEventListener('click', (e) => {
        const itemLi = e.target.closest('.order-item');
        if (!itemLi) return;
        const produtoId = itemLi.dataset.produtoId;

        if (e.target.closest('.increase-btn')) {
            const itemParaAdicionar = carrinho.find(item => item.id == produtoId);
            if (itemParaAdicionar) atualizarCarrinho([...carrinho, itemParaAdicionar]);
        } else if (e.target.closest('.decrease-btn')) {
            const indexParaRemover = carrinho.findIndex(item => item.id == produtoId);
            if (indexParaRemover > -1) {
                const novoCarrinho = [...carrinho];
                novoCarrinho.splice(indexParaRemover, 1);
                atualizarCarrinho(novoCarrinho);
            }
        } else if (e.target.closest('.remove-item-btn')) {
            const itemParaRemover = carrinho.find(item => item.id == produtoId);
            if (confirm(`Tem certeza que deseja remover todos os itens "${itemParaRemover.nome}" do seu pedido?`)) {
                atualizarCarrinho(carrinho.filter(item => item.id != produtoId));
            }
        } else if (e.target.closest('.observation-btn')) {
            abrirModalObservacao(produtoId);
        }
    });

    modalSaveBtn.addEventListener('click', salvarObservacao);
    modalCancelBtn.addEventListener('click', fecharModalObservacao);
    observationModal.addEventListener('click', (e) => {
        if (e.target === observationModal) {
            fecharModalObservacao();
        }
    });

    // ... (O resto do seu código, como carregarSugestao e confirmarPedido, pode permanecer o mesmo)
    
    // --- CÓDIGO RESTANTE (SEM ALTERAÇÕES) ---
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
                    atualizarCarrinho([...carrinho, sugestao]);
                    card.innerHTML = '<p class="feedback-adicionado">Item adicionado! ✔️</p>';
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
            atualizarCarrinho([]);
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

    voltarBtn.addEventListener('click', () => window.location.href = '/cardapio');
    confirmarBtn.addEventListener('click', confirmarPedido);
    profileIcon.addEventListener('click', () => window.location.href = '/conta');

    renderizarPagina();
    carregarSugestao();
});
