// /Frontend/Pagina cliente/Usuario.js - VERSÃO CORRETA E COMPLETA

/**
 * Verifica se o token de autenticação da mesa e o ID da sessão do cliente existem.
 * Se não existirem, redireciona para a página de login.
 * @returns {boolean} - Retorna true se autenticado, false caso contrário.
 */
function verificarAutenticacao() {
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId'); // Essencial para vincular pedidos

    if (!token || !sessaoId) {
        console.log('Autenticação ou sessão do cliente ausente, redirecionando para o login...');
        // Corrigido para usar a rota do servidor em vez do arquivo direto
        window.location.href = '/login';
        return false;
    }
    console.log(`Autenticação OK. Sessão ID: ${sessaoId}`);
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    // Interrompe a execução se a verificação falhar
    if (!verificarAutenticacao()) return;

    // --- Constantes e Variáveis de Estado ---
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId'); // Pega o ID da sessão para o WebSocket
    const API_URL = '/api'; // URL base da API

    // O carrinho agora é a fonte da verdade para os itens pré-selecionados
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // --- Elementos do DOM ---
    const navMenu = document.querySelector('.nav-menu');
    const menuList = document.querySelector('.menu-list');
    const profileIcon = document.querySelector('.fa-user.icon');
    const cartIcon = document.querySelector('.cart-icon');
    const cartBadge = document.querySelector('.cart-icon .badge');

    // --- Funções de Interação com a API ---
    async function apiCall(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        if (body) { options.body = JSON.stringify(body); }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro na API');
            }
            return response.status === 204 ? {} : response.json();
        } catch (error) {
            console.error(`Falha na chamada da API para ${endpoint}:`, error);
            throw error;
        }
    }

    // --- Funções do Carrinho ---
    function adicionarAoCarrinho(produto) {
        carrinho.push(produto);
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        atualizarBadgeCarrinho();
        
        const addButton = document.querySelector(`.menu-item[data-product-id='${produto.id}'] .add-button`);
        if(addButton) {
            addButton.textContent = '✓';
            addButton.style.backgroundColor = '#28a745';
            setTimeout(() => { 
                addButton.textContent = '+';
                addButton.style.backgroundColor = 'transparent'; 
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
        categorias.forEach((cat, index) => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.dataset.filter = cat.id;
            li.textContent = cat.nome;
            if (index === 0) li.classList.add('active');
            navMenu.appendChild(li);
        });
    }

    function renderizarProdutos(produtos) {
        menuList.innerHTML = '';
        if (produtos.length === 0) {
            menuList.innerHTML = '<p>Nenhum produto encontrado nesta categoria.</p>';
            return;
        }
        produtos.forEach(prod => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'menu-item';
            itemDiv.dataset.category = prod.id_categoria;
            itemDiv.dataset.productId = prod.id;
            itemDiv.dataset.productPrice = prod.preco;

            const serveTexto = prod.serve_pessoas > 0 ? `<span class="serves">Serve até ${prod.serve_pessoas} ${prod.serve_pessoas > 1 ? 'pessoas' : 'pessoa'}</span>` : '';

            itemDiv.innerHTML = `
                <img src="${prod.imagem_svg || 'https://via.placeholder.com/150x100'}" alt="${prod.nome}">
                <div class="item-details">
                    <h3>${prod.nome} ${serveTexto}</h3>
                    <p>${prod.descricao}</p>
                </div>
                <div class="item-action">
                    <button class="add-button">+</button>
                    <span class="item-price">R$ ${parseFloat(prod.preco ).toFixed(2)}</span>
                </div>
            `;
            menuList.appendChild(itemDiv);
        });
    }

    function filtrarProdutos(idCategoria) {
        document.querySelectorAll('.menu-item').forEach(item => {
            item.style.display = item.dataset.category === idCategoria ? 'flex' : 'none';
        });
    }

    // --- Função Principal de Inicialização ---
    async function inicializarCardapio() {
        try {
            const [categorias, produtos] = await Promise.all([
                apiCall('/categorias'),
                apiCall('/produtos/todos')
            ]);
            renderizarCategorias(categorias);
            renderizarProdutos(produtos);
            if (categorias.length > 0) filtrarProdutos(categorias[0].id.toString());
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
        if (e.target.classList.contains('add-button')) {
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
            filtrarProdutos(e.target.dataset.filter);
        }
    });

    // --- Lógica do WebSocket (VERSÃO ATUALIZADA) ---
    function conectarWebSocket() {
        // Conecta ao WebSocket, passando a sessaoId na URL para identificação no backend.
        const socket = new WebSocket(`ws://${window.location.host}?sessaoId=${sessaoId}`);

        socket.onopen = () => {
            console.log(`Conectado ao servidor via WebSocket para a sessão: ${sessaoId}`);
        };

        // Listener principal de mensagens do servidor
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            switch (data.type) {
                // Caso 1: O gerente atualizou o cardápio
                case 'CARDAPIO_ATUALIZADO':
                    console.log('Cardápio atualizado pelo gerente. Recarregando...');
                    inicializarCardapio();
                    break;

                // Caso 2: O gerente fechou a conta deste cliente
                case 'LOGOUT_FORCADO':
                    console.warn('Recebido comando de logout forçado do servidor:', data.message);
                    
                    // Limpa todos os dados da sessão do cliente
                    localStorage.removeItem('token');
                    localStorage.removeItem('sessaoId');
                    localStorage.removeItem('dadosCliente');
                    localStorage.removeItem('nomeMesa');
                    localStorage.removeItem('carrinho');

                    // Exibe um alerta e redireciona para a página de login
                    alert(data.message || 'Sua sessão foi encerrada pela gerência.');
                    window.location.href = '/login';
                    break;
            }
        };

        socket.onclose = () => {
            console.log('Conexão WebSocket perdida. Tentando reconectar em 3 segundos...');
            setTimeout(conectarWebSocket, 3000);
        };

        socket.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
            socket.close(); // Força o fechamento para acionar a tentativa de reconexão
        };
    }

    // --- INICIALIZAÇÃO ---
    atualizarBadgeCarrinho();
    inicializarCardapio();
    conectarWebSocket(); // Inicia a conexão WebSocket com a nova lógica
});
