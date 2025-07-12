// /Frontend/Pagina cliente/Usuario.js - VERSÃO FINAL E CORRIGIDA

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
    let cardapioCompleto = []; // Armazena todos os dados da API

    // --- Elementos do DOM (CORRIGIDOS) ---
    const navMenu = document.querySelector('.nav-menu');
    const menuList = document.querySelector('.menu-list');
    const profileIcon = document.querySelector('.fa-user.icon');
    const cartIcon = document.querySelector('.cart-icon');
    const cartBadge = document.querySelector('.cart-icon .badge');

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
        
        const addButton = document.querySelector(`.menu-item[data-product-id='${produto.id}'] .add-button`);
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
            itemDiv.dataset.category = prod.id_categoria;
            itemDiv.dataset.productId = prod.id;
            itemDiv.dataset.productPrice = prod.preco;

            const serveTexto = prod.serve_pessoas > 0 ? `<span class="serves">Serve até ${prod.serve_pessoas} ${prod.serve_pessoas > 1 ? 'pessoas' : 'pessoa'}</span>` : '';
            
            const botaoAdicionar = happyHourInativo 
                ? `<button class="add-button" disabled title="Disponível apenas durante o Happy Hour">+</button>`
                : `<button class="add-button">+</button>`;

            itemDiv.innerHTML = `
                <img src="${prod.imagem_svg || 'https://via.placeholder.com/150x100'}" alt="${prod.nome}">
                <div class="item-details">
                    <h3>${prod.nome} ${serveTexto}</h3>
                    <p>${prod.descricao}</p>
                </div>
                <div class="item-action">
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

    // --- Função Principal de Inicialização ---
    async function inicializarCardapio() {
        try {
            cardapioCompleto = await apiCall('/cardapio-completo');
            
            renderizarCategorias(cardapioCompleto);
            
            const primeiraCategoriaVisivel = cardapioCompleto.find(cat => cat.ativo && (!cat.is_happy_hour || isHappyHourAtivo(cat.happy_hour_inicio, cat.happy_hour_fim)));

            if (primeiraCategoriaVisivel) {
                renderizarProdutos(primeiraCategoriaVisivel.id);
                const primeiroItemMenu = navMenu.querySelector(`li[data-filter='${primeiraCategoriaVisivel.id}']`);
                if (primeiroItemMenu) primeiroItemMenu.classList.add('active');
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

    menuList.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-button') && !e.target.disabled) {
            const menuItem = e.target.closest('.menu-item');
            const produto = {
                id: menuItem.dataset.productId,
                nome: menuItem.querySelector('.item-details h3').firstChild.textContent.trim(),
                descricao: menuItem.querySelector('.item-details p').textContent,
                preco: parseFloat(menuItem.dataset.productPrice)
            };
            adicionarAoCarrinho(produto);
        }
    });

    navMenu.addEventListener('click', (e) => {
        if (e.target && e.target.matches('li.nav-item')) {
            document.querySelectorAll('.nav-menu li').forEach(item => item.classList.remove('active'));
            e.target.classList.add('active');
            renderizarProdutos(e.target.dataset.filter);
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
