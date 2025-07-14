/**
 * Verifica se o token de autenticação da mesa e o ID da sessão do cliente existem.
 * Se não existirem, redireciona para a página de login.
 * @returns {boolean} - Retorna true se autenticado, false caso contrário.
 */
function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId');

    if (!token || !sessaoId) {
        console.log('Autenticação ou sessão do cliente ausente, redirecionando para o login...');
        window.location.href = '/login';
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    if (!verificarAutenticacao()) return;

    // --- Constantes e Variáveis de Estado ---
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId');
    const API_URL = '/api';
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let cardapioCompleto = [];

    // --- Elementos do DOM ---
    const navMenu = document.querySelector('.nav-menu');
    const menuList = document.querySelector('.menu-list');
    const profileIcon = document.querySelector('.fa-user.icon');
    const cartIcon = document.querySelector('.cart-icon');
    const cartBadge = document.querySelector('.cart-icon .badge');
    
    const productModal = document.getElementById('product-details-modal');
    const productModalCloseBtn = document.getElementById('product-modal-close-btn');
    const productModalBody = document.getElementById('product-modal-body');

    // --- Funções de Interação com a API ---
    async function apiCall(endpoint) {
        const options = { headers: { 'Authorization': `Bearer ${token}` } };
        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            if (!response.ok) throw new Error('Erro na API');
            return response.json();
        } catch (error) {
            console.error(`Falha na chamada da API para ${endpoint}:`, error);
            throw error;
        }
    }

    // --- Funções de Lógica de Negócio ---
    function isHappyHourAtivo(inicio, fim) {
        if (!inicio || !fim) return false;
        const agora = new Date();
        const horaAtual = agora.getHours().toString().padStart(2, '0') + ":" + agora.getMinutes().toString().padStart(2, '0');
        return horaAtual >= inicio.slice(0, 5) && horaAtual < fim.slice(0, 5);
    }

    // --- Funções do Carrinho ---
    function adicionarAoCarrinho(produto) {
        carrinho.push(produto);
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        atualizarBadgeCarrinho();
        
        const addButton = document.querySelector(`.menu-item[data-id='${produto.id}'] .add-button`);
        if(addButton) {
            addButton.textContent = '✓';
            addButton.classList.add('added');
            setTimeout(() => { 
                addButton.textContent = '+';
                addButton.classList.remove('added');
            }, 1000);
        }
    }

    function atualizarBadgeCarrinho() {
        cartBadge.textContent = carrinho.length;
        cartBadge.style.display = carrinho.length > 0 ? 'flex' : 'none';
    }

    // --- Funções de Renderização ---
    function renderizarCategorias(categorias) {
        navMenu.innerHTML = '';
        categorias.forEach(cat => {
            if (!cat.ativo) return;

            const li = document.createElement('li');
            li.className = 'nav-item';
            li.dataset.filter = cat.id;
            li.textContent = cat.nome;

            if (cat.is_happy_hour && !isHappyHourAtivo(cat.happy_hour_inicio, cat.happy_hour_fim)) {
                li.classList.add('happy-hour-inativo');
                li.title = `Happy Hour disponível das ${cat.happy_hour_inicio.slice(0,5)} às ${cat.happy_hour_fim.slice(0,5)}`;
            }
            
            navMenu.appendChild(li);
        });
    }

    function renderizarProdutos(idCategoria) {
        const categoria = cardapioCompleto.find(cat => cat.id == idCategoria);
        menuList.innerHTML = '';

        if (!categoria || categoria.produtos.length === 0) {
            menuList.innerHTML = '<p>Nenhum produto encontrado nesta categoria.</p>';
            return;
        }

        const happyHourInativo = categoria.is_happy_hour && !isHappyHourAtivo(categoria.happy_hour_inicio, categoria.happy_hour_fim);

        categoria.produtos.forEach(prod => {
            if (!prod.ativo) return;

            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            // Adiciona todos os dados do produto ao dataset para fácil acesso
            Object.keys(prod).forEach(key => {
                itemDiv.dataset[key] = prod[key];
            });

            const serveTexto = prod.serve_pessoas > 0 ? `<span class="serves">Serve até ${prod.serve_pessoas} ${prod.serve_pessoas > 1 ? 'pessoas' : 'pessoa'}</span>` : '';
            
            const botaoAdicionar = happyHourInativo 
                ? `<button class="add-button" disabled title="Disponível apenas durante o Happy Hour">+</button>`
                : `<button class="add-button">+</button>`;

            itemDiv.innerHTML = `
                <img src="${prod.imagem_svg || 'https://via.placeholder.com/150x100'}" alt="${prod.nome}">
                <div class="item-details">
                    <h3>${prod.nome}</h3>
                    <p>${prod.descricao}</p>
                </div>
                <div class="item-action">
                    <button class="details-button" title="Ver detalhes"><i class="fas fa-info-circle"></i></button>
                    ${botaoAdicionar}
                    <span class="item-price">R$ ${parseFloat(prod.preco ).toFixed(2)}</span>
                </div>
            `;
            
            if (happyHourInativo) {
                itemDiv.classList.add('item-inativo');
            }

            menuList.appendChild(itemDiv);
        });
    }

    // ====================================================================
    // --- FUNÇÃO PARA ABRIR O MODAL DE DETALHES (VERSÃO FINAL) ---
    // ====================================================================
    function abrirModalDeDetalhesProduto(produto) {
        productModalBody.innerHTML = `
            <img src="${produto.imagem_svg || 'https://via.placeholder.com/500x250'}" alt="${produto.nome}" class="product-modal-image">
            <div class="product-modal-content">
                <h2>${produto.nome}</h2>
                ${produto.serve_pessoas > 0 ? `<span class="serves">Serve até ${produto.serve_pessoas} ${produto.serve_pessoas > 1 ? 'pessoas' : 'pessoa'}</span>` : ''}
                
                <!-- AQUI ESTÁ A MÁGICA: Usa a descrição detalhada, e se não houver, usa a curta. -->
                <p>${produto.descricao_detalhada || produto.descricao}</p>
            </div>
        `;
        productModal.classList.remove('hidden' );
    }

    // --- Função Principal de Inicialização ---
   // Em /Pagina cliente/Usuario.js

async function inicializarCardapio() {
    try {
        cardapioCompleto = await apiCall('/cardapio-completo');
        renderizarCategorias(cardapioCompleto);

        // --- LÓGICA ADICIONADA AQUI ---
        const urlParams = new URLSearchParams(window.location.search);
        const categoriaIdDesejada = urlParams.get('categoria');
        
        let categoriaInicial = null;

        if (categoriaIdDesejada) {
            // Tenta encontrar a categoria vinda da URL
            categoriaInicial = cardapioCompleto.find(cat => cat.id == categoriaIdDesejada && cat.ativo);
        }

        // Se não encontrou (ou se não veio na URL), pega a primeira visível
        if (!categoriaInicial) {
            categoriaInicial = cardapioCompleto.find(cat => cat.ativo && (!cat.is_happy_hour || isHappyHourAtivo(cat.happy_hour_inicio, cat.happy_hour_fim)));
        }
        // --- FIM DA LÓGICA ADICIONADA ---

        if (categoriaInicial) {
            renderizarProdutos(categoriaInicial.id);
            const itemMenuAtivo = navMenu.querySelector(`li[data-filter='${categoriaInicial.id}']`);
            if (itemMenuAtivo) itemMenuAtivo.classList.add('active');
        } else {
            menuList.innerHTML = '<p>Nenhum item disponível no cardápio no momento.</p>';
        }
    } catch (error) {
        menuList.innerHTML = '<p>Não foi possível carregar o cardápio. Tente novamente mais tarde.</p>';
    }
}


    // --- Event Listeners ---
    profileIcon.addEventListener('click', () => { window.location.href = '/conta'; });
    cartIcon.addEventListener('click', () => {
        if (carrinho.length === 0) {
            alert('Adicione itens ao seu pedido antes de revisar.');
            return;
        }
        window.location.href = '/confirmar-pedido';
    });

    // ====================================================================
    // --- EVENT LISTENER DO MENU ATUALIZADO PARA LIDAR COM AMBOS OS BOTÕES ---
    // ====================================================================
    menuList.addEventListener('click', (e) => {
        const menuItem = e.target.closest('.menu-item');
        if (!menuItem) return;

        // Ação: Clicou no botão de adicionar
        if (e.target.closest('.add-button') && !e.target.closest('.add-button').disabled) {
            const produto = {
                id: menuItem.dataset.id,
                nome: menuItem.dataset.nome,
                descricao: menuItem.dataset.descricao,
                preco: parseFloat(menuItem.dataset.preco),
                imagem_svg: menuItem.dataset.imagem_svg,
                // Adicionamos a descrição detalhada ao carrinho também, caso precise dela no futuro
                descricao_detalhada: menuItem.dataset.descricao_detalhada
            };
            adicionarAoCarrinho(produto);
        }

        // Ação: Clicou no botão de detalhes
        if (e.target.closest('.details-button')) {
            // Reconstroi o objeto produto a partir do dataset do elemento
            const produto = {
                nome: menuItem.dataset.nome,
                descricao: menuItem.dataset.descricao,
                descricao_detalhada: menuItem.dataset.descricao_detalhada, // Pega o novo campo
                serve_pessoas: menuItem.dataset.serve_pessoas,
                imagem_svg: menuItem.dataset.imagem_svg
            };
            abrirModalDeDetalhesProduto(produto);
        }
    });

    navMenu.addEventListener('click', (e) => {
        if (e.target && e.target.matches('li.nav-item')) {
            document.querySelectorAll('.nav-menu li').forEach(item => item.classList.remove('active'));
            e.target.classList.add('active');
            renderizarProdutos(e.target.dataset.filter);
        }
    });

    // Listeners para fechar o modal de detalhes do produto
    productModalCloseBtn.addEventListener('click', () => productModal.classList.add('hidden'));
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.classList.add('hidden');
        }
    });

    // --- Lógica do WebSocket ---
    function conectarWebSocket() {
        const socket = new WebSocket(`ws://${window.location.host}?sessaoId=${sessaoId}`);
        socket.onopen = () => console.log(`Conectado ao servidor via WebSocket para a sessão: ${sessaoId}`);
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'CARDAPIO_ATUALIZADO':
                    console.log('Cardápio atualizado pelo gerente. Recarregando...');
                    inicializarCardapio();
                    break;
                case 'LOGOUT_FORCADO':
                    console.warn('Recebido comando de logout forçado:', data.message);
                    localStorage.clear();
                    alert(data.message || 'Sua sessão foi encerrada pela gerência.');
                    window.location.href = '/login';
                    break;
            }
        };
        socket.onclose = () => setTimeout(conectarWebSocket, 3000);
        socket.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
            socket.close();
        };
    }

    // --- INICIALIZAÇÃO ---
    atualizarBadgeCarrinho();
    inicializarCardapio();
    conectarWebSocket();
});
