// Frontend/Pagina cliente/Usuario.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    // URL para o WebSocket. 'ws' é o protocolo para WebSockets, similar ao 'http'.
    const WS_URL = 'ws://localhost:3000';

    const navMenu = document.querySelector('.nav-menu' );
    const menuList = document.querySelector('.menu-list');

    // Função genérica para chamadas fetch (sem alterações)
    async function apiCall(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('Falha na chamada da API:', error);
            throw error;
        }
    }

    // Função para renderizar as categorias na barra lateral (sem alterações)
    function renderizarCategorias(categorias) {
        navMenu.innerHTML = '';
        categorias.forEach((cat, index) => {
            const li = document.createElement('li');
            li.className = 'nav-item';
            li.dataset.filter = cat.id;
            li.textContent = cat.nome;
            if (index === 0) {
                li.classList.add('active');
            }
            navMenu.appendChild(li);
        });
    }

    // Função para renderizar os produtos na lista principal (sem alterações)
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

        // Cria o texto "Serve até X pessoas" apenas se o valor for maior que 0
        const serveTexto = prod.serve_pessoas > 0 
            ? `<span class="serves">Serve até ${prod.serve_pessoas} ${prod.serve_pessoas > 1 ? 'pessoas' : 'pessoa'}</span>` 
            : '';

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

    // Função para filtrar os produtos que já estão na tela (sem alterações)
    function filtrarProdutos(idCategoria) {
        const todosOsItens = document.querySelectorAll('.menu-item');
        todosOsItens.forEach(item => {
            if (item.dataset.category === idCategoria) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    // Função principal de inicialização (sem alterações na lógica principal)
    async function inicializarCardapio() {
        try {
            const [categorias, produtos] = await Promise.all([
                apiCall('/categorias'),
                apiCall('/produtos/todos')
            ]);

            renderizarCategorias(categorias);
            renderizarProdutos(produtos);

            if (categorias.length > 0) {
                const primeiraCategoriaId = categorias[0].id.toString();
                filtrarProdutos(primeiraCategoriaId);
            }

            // Remove qualquer listener antigo para evitar duplicação
            navMenu.replaceWith(navMenu.cloneNode(true));
            const newNavMenu = document.querySelector('.nav-menu');
            newNavMenu.addEventListener('click', (e) => {
                if (e.target && e.target.matches('li.nav-item')) {
                    const navItem = e.target;
                    document.querySelectorAll('.nav-menu li').forEach(item => item.classList.remove('active'));
                    navItem.classList.add('active');
                    const idFiltro = navItem.dataset.filter;
                    filtrarProdutos(idFiltro);
                }
            });

        } catch (error) {
            menuList.innerHTML = '<p>Não foi possível carregar o cardápio. Tente novamente mais tarde.</p>';
        }
    }

    // --- LÓGICA DO WEBSOCKET ---
    function conectarWebSocket() {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
            console.log('Conectado ao servidor WebSocket!');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log('Mensagem recebida do servidor:', message);

            // Se a mensagem for de atualização, recarrega o cardápio
            if (message.type === 'CARDAPIO_ATUALIZADO') {
                console.log('Atualizando o cardápio em tempo real...');
                inicializarCardapio(); // A mágica acontece aqui!
            }
        };

        ws.onclose = () => {
            console.log('Desconectado. Tentando reconectar em 3 segundos...');
            setTimeout(conectarWebSocket, 3000);
        };

        ws.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
            ws.close();
        };
    }

    // --- INICIALIZAÇÃO ---
    inicializarCardapio(); // Carrega o cardápio pela primeira vez
    conectarWebSocket(); // Inicia a conexão para ouvir as atualizações
});
