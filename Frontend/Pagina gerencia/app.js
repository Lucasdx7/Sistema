// Frontend/Pagina gerencia/app.js

document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    const WS_URL = 'ws://localhost:3000';

    // --- Elementos do DOM ---
    const listaCategorias = document.getElementById('lista-categorias' );
    const inputNovaCategoria = document.getElementById('input-nova-categoria');
    const btnAddCategoria = document.getElementById('btn-add-categoria');
    const listaProdutos = document.getElementById('lista-produtos');
    const nomeCategoriaSelecionada = document.getElementById('nome-categoria-selecionada');
    const formProdutoContainer = document.getElementById('form-produto-container');
    const inputNomeProduto = document.getElementById('input-nome-produto');
    const inputDescricaoProduto = document.getElementById('input-descricao-produto');
    const inputPrecoProduto = document.getElementById('input-preco-produto');
    const inputImagemProduto = document.getElementById('input-imagem-produto');
    const inputServePessoas = document.getElementById('input-serve-pessoas');
    const btnAddProduto = document.getElementById('btn-add-produto');

    // --- Variável de Estado ---
    let estado = {
        categoriaSelecionada: null
    };

    // --- Funções de Conversão e API ---
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    async function apiCall(endpoint, method = 'GET', body = null) {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) { options.body = JSON.stringify(body); }
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`Erro na API: ${errorData.message}`);
        }
        return response.status === 204 ? {} : response.json();
    }

    // --- Funções de Renderização ---
    async function carregarCategorias() {
        try {
            const categorias = await apiCall('/categorias');
            listaCategorias.innerHTML = '';
            let categoriaAtivaAindaExiste = false;

            categorias.forEach(cat => {
                const li = document.createElement('li');
                li.dataset.id = cat.id;
                li.dataset.nome = cat.nome;
                li.innerHTML = `<span>${cat.nome}</span><button class="delete-btn" data-id="${cat.id}">X</button>`;
                
                if (estado.categoriaSelecionada && cat.id === estado.categoriaSelecionada.id) {
                    li.classList.add('selected');
                    categoriaAtivaAindaExiste = true;
                }
                listaCategorias.appendChild(li);
            });

            if (!categoriaAtivaAindaExiste) {
                estado.categoriaSelecionada = null;
                nomeCategoriaSelecionada.textContent = 'Nenhuma';
                formProdutoContainer.classList.add('hidden');
            }
        } catch (error) {
            console.error("Falha em carregarCategorias:", error);
            alert('Não foi possível carregar as categorias.');
        }
    }

    async function carregarProdutos(idCategoria) {
        try {
            const produtos = await apiCall(`/categorias/${idCategoria}/produtos`);
            listaProdutos.innerHTML = '';
            produtos.forEach(prod => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <div class="produto-info">
                        <img src="${prod.imagem_svg || 'https://via.placeholder.com/60'}" alt="${prod.nome}">
                        <div>
                            <strong>${prod.nome}</strong> - R$ ${parseFloat(prod.preco ).toFixed(2)}
                            <p>${prod.descricao}</p>
                        </div>
                    </div>
                    <button class="delete-btn" data-id="${prod.id}">X</button>
                `;
                li.querySelector('.delete-btn').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (confirm('Tem certeza?')) { await apiCall(`/produtos/${e.target.dataset.id}`, 'DELETE'); }
                });
                listaProdutos.appendChild(li);
            });
        } catch (error) {
            listaProdutos.innerHTML = '<li>Não foi possível carregar os produtos.</li>';
        }
    }

    // --- Event Listeners ---
    btnAddCategoria.addEventListener('click', async () => {
        const nome = inputNovaCategoria.value.trim();
        if (nome) {
            try {
                await apiCall('/categorias', 'POST', { nome });
                inputNovaCategoria.value = '';
            } catch (error) { alert(`Falha ao adicionar categoria: ${error.message}`); }
        }
    });

    listaCategorias.addEventListener('click', async (e) => {
        const li = e.target.closest('li');
        if (!li) return;

        if (e.target.classList.contains('delete-btn')) {
            const id = e.target.dataset.id;
            if (confirm('Tem certeza?')) {
                await apiCall(`/categorias/${id}`, 'DELETE');
            }
        } else {
            estado.categoriaSelecionada = { id: parseInt(li.dataset.id, 10), nome: li.dataset.nome };
            document.querySelectorAll('#lista-categorias li').forEach(item => item.classList.remove('selected'));
            li.classList.add('selected');
            nomeCategoriaSelecionada.textContent = estado.categoriaSelecionada.nome;
            formProdutoContainer.classList.remove('hidden');
            await carregarProdutos(estado.categoriaSelecionada.id);
        }
    });
    
    btnAddProduto.addEventListener('click', async () => {
        if (!estado.categoriaSelecionada || !estado.categoriaSelecionada.id) {
            alert('Por favor, selecione uma categoria válida antes de adicionar um produto.');
            return;
        }
        const nome = inputNomeProduto.value.trim();
        const descricao = inputDescricaoProduto.value.trim();
        const preco = parseFloat(inputPrecoProduto.value.replace(',', '.'));
        const serve_pessoas = parseInt(inputServePessoas.value, 10) || 1;
        const imagemFile = inputImagemProduto.files[0];

        if (!nome || !descricao || isNaN(preco)) {
            alert('Por favor, preencha todos os campos do produto.');
            return;
        }
        try {
            let imagem_svg = null;
            if (imagemFile) { imagem_svg = await fileToBase64(imagemFile); }
            const produto = { id_categoria: estado.categoriaSelecionada.id, nome, descricao, preco, imagem_svg, serve_pessoas };
            await apiCall('/produtos', 'POST', produto);
            
            inputNomeProduto.value = '';
            inputDescricaoProduto.value = '';
            inputPrecoProduto.value = '';
            inputImagemProduto.value = '';
            inputServePessoas.value = '';
        } catch (error) { alert(`Falha ao adicionar produto: ${error.message}`); }
    });

    // --- Lógica do WebSocket ---
    function conectarWebSocketGerencia() {
        const ws = new WebSocket(WS_URL);
        ws.onopen = () => console.log('Gerenciador conectado ao WebSocket!');
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'CARDAPIO_ATUALIZADO') {
                carregarCategorias();
                if (estado.categoriaSelecionada) {
                    carregarProdutos(estado.categoriaSelecionada.id);
                }
            }
        };
        ws.onclose = () => setTimeout(conectarWebSocketGerencia, 3000);
        ws.onerror = (error) => { console.error('Erro no WebSocket do Gerenciador:', error); ws.close(); };
    }

    // --- INICIALIZAÇÃO ---
    carregarCategorias();
    conectarWebSocketGerencia();
});
