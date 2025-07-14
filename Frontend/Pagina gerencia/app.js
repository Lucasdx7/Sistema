// /Frontend/Pagina gerencia/app.js - VERSÃO FINAL E COMPLETA

document.addEventListener('DOMContentLoaded', () => {
    // --- Constantes Globais ---
    const API_URL = '/api'; // URL relativa para produção
    const WS_URL = `ws://${window.location.host}`; // WebSocket relativo

    // --- Elementos do DOM ---
    const listaCategorias = document.getElementById('lista-categorias');
    const listaProdutos = document.getElementById('lista-produtos');
    const nomeCategoriaSelecionada = document.getElementById('nome-categoria-selecionada');
    const formProdutoContainer = document.getElementById('form-produto-container');
    
    // Formulário de Adicionar Categoria
    const inputNovaCategoria = document.getElementById('input-nova-categoria');
    const btnAddCategoria = document.getElementById('btn-add-categoria');
    const checkIsHappyHour = document.getElementById('input-is-happy-hour');
    const happyHourFields = document.getElementById('happy-hour-fields');
    const inputHappyHourInicio = document.getElementById('input-happy-hour-inicio');
    const inputHappyHourFim = document.getElementById('input-happy-hour-fim');

    // Formulário de Adicionar Produto (com o novo campo)
    const inputNomeProduto = document.getElementById('input-nome-produto');
    const inputDescricaoProduto = document.getElementById('input-descricao-produto');
    const inputDescricaoDetalhada = document.getElementById('input-descricao-detalhada'); // NOVO
    const inputPrecoProduto = document.getElementById('input-preco-produto');
    const inputImagemProduto = document.getElementById('input-imagem-produto');
    const inputServePessoas = document.getElementById('input-serve-pessoas');
    const btnAddProduto = document.getElementById('btn-add-produto');

    // Elementos do Modal de Edição
    const editModal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const editForm = document.getElementById('editForm');
    const editItemId = document.getElementById('editItemId');
    const editItemType = document.getElementById('editItemType');
    const closeModalBtn = editModal.querySelector('.close-btn');
    const cancelModalBtn = editModal.querySelector('.cancel-btn');

    // --- Variáveis de Estado ---
    let estado = { categoriaSelecionada: null };
    let itemArrastado = null;

    // --- FUNÇÃO DE CHAMADA À API (apiCall) ---
    async function apiCall(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/login-gerencia';
            throw new Error('Token de autenticação não encontrado.');
        }
        const options = {
            method,
            headers: { 'Authorization': `Bearer ${token}` }
        };
        if (body) {
            options.headers['Content-Type'] = 'application/json';
            options.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            if (response.status === 401 || response.status === 403) {
                alert('Sua sessão expirou. Por favor, faça login novamente.');
                localStorage.removeItem('authToken');
                localStorage.removeItem('usuario');
                window.location.href = '/login-gerencia';
                throw new Error('Sessão inválida');
            }
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`Erro na API: ${errorData.message}`);
            }
            return response.status === 204 ? {} : response.json();
        } catch (error) {
            throw error;
        }
    }

    // --- Funções de Conversão ---
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // --- Funções de Renderização ---
    async function carregarCategorias() {
        try {
            const categorias = await apiCall('/categorias');
            listaCategorias.innerHTML = '';
            let categoriaAtivaAindaExiste = false;

            categorias.forEach(cat => {
                const li = document.createElement('li');
                Object.keys(cat).forEach(key => { li.dataset[key] = cat[key]; });
                li.draggable = true;
                li.classList.toggle('inactive', !cat.ativo);

                let happyHourInfo = '';
                if (cat.is_happy_hour && cat.happy_hour_inicio && cat.happy_hour_fim) {
                    happyHourInfo = `<small class="happy-hour-info">Happy Hour: ${cat.happy_hour_inicio.slice(0, 5)} - ${cat.happy_hour_fim.slice(0, 5)}</small>`;
                }

                li.innerHTML = `
                    <div class="item-info">
                        <span>${cat.nome}</span>
                        ${happyHourInfo}
                    </div>
                    <div class="action-buttons">
                        <label class="switch" title="${cat.ativo ? 'Desativar' : 'Ativar'} Categoria">
                            <input type="checkbox" class="toggle-status" data-tipo="categorias" ${cat.ativo ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <button class="edit-btn" data-tipo="categoria" title="Editar Categoria"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-btn" data-tipo="categoria" title="Excluir Categoria">X</button>
                    </div>
                `;
                
                if (estado.categoriaSelecionada && cat.id == estado.categoriaSelecionada.id) {
                    li.classList.add('selected');
                    categoriaAtivaAindaExiste = true;
                }
                listaCategorias.appendChild(li);
            });

            if (!categoriaAtivaAindaExiste && estado.categoriaSelecionada) {
                estado.categoriaSelecionada = null;
                nomeCategoriaSelecionada.textContent = 'Nenhuma';
                formProdutoContainer.classList.add('hidden');
                listaProdutos.innerHTML = '';
            }
        } catch (error) {
            console.error("Falha ao carregar categorias.", error.message);
        }
    }

    async function carregarProdutos(idCategoria) {
        try {
            const produtos = await apiCall(`/categorias/${idCategoria}/produtos`);
            listaProdutos.innerHTML = '';
            produtos.forEach(prod => {
                const li = document.createElement('li');
                Object.keys(prod).forEach(key => { li.dataset[key] = prod[key]; });
                li.classList.toggle('inactive', !prod.ativo);

                li.innerHTML = `
                    <div class="produto-info">
                        <img src="${prod.imagem_svg || 'https://via.placeholder.com/60'}" alt="${prod.nome}">
                        <div>
                            <strong>${prod.nome}</strong> - R$ ${parseFloat(prod.preco ).toFixed(2)}
                            <p><strong>Descrição:</strong> ${prod.descricao}</p>
                            <p class="desc-detalhada"><strong>Detalhes:</strong> ${prod.descricao_detalhada || 'N/A'}</p>
                            <small>Serve: ${prod.serve_pessoas} pessoa(s)</small>
                        </div>
                    </div>
                    <div class="action-buttons">
                        <label class="switch" title="${prod.ativo ? 'Desativar' : 'Ativar'} Produto">
                            <input type="checkbox" class="toggle-status" data-tipo="produtos" ${prod.ativo ? 'checked' : ''}>
                            <span class="slider"></span>
                        </label>
                        <button class="edit-btn" data-tipo="produto" title="Editar Produto"><i class="fas fa-pencil-alt"></i></button>
                        <button class="delete-btn" data-tipo="produto" title="Excluir Produto">X</button>
                    </div>
                `;
                listaProdutos.appendChild(li);
            });
        } catch (error) {
            listaProdutos.innerHTML = '<li>Não foi possível carregar os produtos.</li>';
        }
    }

    // --- Lógica do Modal de Edição ---
    function abrirModalDeEdicao(tipo, itemElement) {
        const id = itemElement.dataset.id;
        editItemId.value = id;
        editItemType.value = tipo;
        modalBody.innerHTML = '';

        if (tipo === 'categoria') {
            modalTitle.textContent = 'Editar Categoria';
            const isHappy = itemElement.dataset.is_happy_hour === '1' || itemElement.dataset.is_happy_hour === 'true';
            
            modalBody.innerHTML = `
                <label for="editNome">Nome da Categoria:</label>
                <input type="text" id="editNome" name="nome" value="${itemElement.dataset.nome}" required>
                
                <div class="happy-hour-toggle">
                    <input type="checkbox" id="editIsHappyHour" name="is_happy_hour" ${isHappy ? 'checked' : ''}>
                    <label for="editIsHappyHour">É Happy Hour?</label>
                </div>

                <div id="editHappyHourFields" class="${isHappy ? '' : 'hidden'}">
                    <label for="editHappyHourInicio">Início:</label>
                    <input type="time" id="editHappyHourInicio" name="happy_hour_inicio" value="${itemElement.dataset.happy_hour_inicio || ''}">
                    <label for="editHappyHourFim">Fim:</label>
                    <input type="time" id="editHappyHourFim" name="happy_hour_fim" value="${itemElement.dataset.happy_hour_fim || ''}">
                </div>
            `;
            modalBody.querySelector('#editIsHappyHour').addEventListener('change', (e) => {
                modalBody.querySelector('#editHappyHourFields').classList.toggle('hidden', !e.target.checked);
            });
        } else if (tipo === 'produto') {
            modalTitle.textContent = 'Editar Produto';
            modalBody.innerHTML = `
                <label for="editNome">Nome do Produto:</label>
                <input type="text" id="editNome" name="nome" value="${itemElement.dataset.nome}" required>
                
                <label for="editDescricao">Descrição Curta (para o cardápio):</label>
                <textarea id="editDescricao" name="descricao" required>${itemElement.dataset.descricao}</textarea>
                
                <label for="editDescricaoDetalhada">Descrição Detalhada (para o modal do cliente):</label>
                <textarea id="editDescricaoDetalhada" name="descricao_detalhada">${itemElement.dataset.descricao_detalhada || ''}</textarea>
                
                <label for="editPreco">Preço (R$):</label>
                <input type="number" id="editPreco" name="preco" step="0.01" value="${itemElement.dataset.preco}" required>
                
                <label for="editServePessoas">Serve Pessoas:</label>
                <input type="number" id="editServePessoas" name="serve_pessoas" value="${itemElement.dataset.serve_pessoas}" required min="1">
            `;
        }
        editModal.style.display = 'block';
    }

    function fecharModal() {
        editModal.style.display = 'none';
    }

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = editItemId.value;
        const tipo = editItemType.value;
        const url = `/${tipo}s/${id}`;
        
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData.entries());
        
        if (tipo === 'categoria') {
            body.is_happy_hour = e.target.querySelector('#editIsHappyHour')?.checked || false;
        }

        try {
            await apiCall(url, 'PUT', body);
            alert('Salvo com sucesso!');
            fecharModal();
            // Recarrega para refletir as mudanças
            await carregarCategorias();
            if (estado.categoriaSelecionada) {
                await carregarProdutos(estado.categoriaSelecionada.id);
            }
        } catch (error) {
            alert(`Erro ao salvar: ${error.message}`);
        }
    });

    closeModalBtn.addEventListener('click', fecharModal);
    cancelModalBtn.addEventListener('click', fecharModal);
    window.addEventListener('click', (e) => {
        if (e.target === editModal) fecharModal();
    });

    // --- Event Listeners Principais ---
    checkIsHappyHour.addEventListener('change', () => {
        happyHourFields.classList.toggle('hidden', !checkIsHappyHour.checked);
    });

    btnAddCategoria.addEventListener('click', async () => {
        const nome = inputNovaCategoria.value.trim();
        if (!nome) return alert('O nome da categoria é obrigatório.');
        
        const body = {
            nome,
            is_happy_hour: checkIsHappyHour.checked,
            happy_hour_inicio: inputHappyHourInicio.value || null,
            happy_hour_fim: inputHappyHourFim.value || null,
        };

        try {
            await apiCall('/categorias', 'POST', body);
            inputNovaCategoria.value = '';
            checkIsHappyHour.checked = false;
            happyHourFields.classList.add('hidden');
            inputHappyHourInicio.value = '';
            inputHappyHourFim.value = '';
            await carregarCategorias();
        } catch (error) {
            alert(`Falha ao adicionar categoria: ${error.message}`);
        }
    });

    function handleListClick(event, listType) {
        const li = event.target.closest('li');
        if (!li) return;

        const id = li.dataset.id;
        const tipo = listType;

        if (event.target.classList.contains('toggle-status')) {
            const isChecked = event.target.checked;
            apiCall(`/${tipo}/${id}/status`, 'PATCH', { ativo: isChecked })
                .then(() => li.classList.toggle('inactive', !isChecked))
                .catch(error => {
                    alert(`Erro ao alterar status: ${error.message}`);
                    event.target.checked = !isChecked;
                });
            return;
        }

        const button = event.target.closest('button');
        if (button) {
            if (button.classList.contains('edit-btn')) {
                abrirModalDeEdicao(tipo.slice(0, -1), li);
            } else if (button.classList.contains('delete-btn')) {
                if (confirm(`Tem certeza que deseja excluir?`)) {
                    apiCall(`/${tipo}/${id}`, 'DELETE')
                        .then(() => li.remove())
                        .catch(error => alert(`Falha ao deletar: ${error.message}`));
                }
            }
            return;
        }

        if (listType === 'categorias') {
            estado.categoriaSelecionada = { id: parseInt(id, 10), nome: li.dataset.nome };
            document.querySelectorAll('#lista-categorias li').forEach(item => item.classList.remove('selected'));
            li.classList.add('selected');
            nomeCategoriaSelecionada.textContent = estado.categoriaSelecionada.nome;
            formProdutoContainer.classList.remove('hidden');
            carregarProdutos(estado.categoriaSelecionada.id);
        }
    }

    listaCategorias.addEventListener('click', (e) => handleListClick(e, 'categorias'));
    listaProdutos.addEventListener('click', (e) => handleListClick(e, 'produtos'));
    
    btnAddProduto.addEventListener('click', async () => {
        if (!estado.categoriaSelecionada?.id) return alert('Selecione uma categoria antes de adicionar um produto.');
        
        const nome = inputNomeProduto.value.trim();
        const descricao = inputDescricaoProduto.value.trim();
        const descricao_detalhada = inputDescricaoDetalhada.value.trim(); // NOVO
        const preco = parseFloat(inputPrecoProduto.value.replace(',', '.'));
        const serve_pessoas = parseInt(inputServePessoas.value, 10) || 1;
        const imagemFile = inputImagemProduto.files[0];

        if (!nome || !descricao || isNaN(preco)) return alert('Preencha os campos obrigatórios do produto.');
        
        try {
            const imagem_svg = imagemFile ? await fileToBase64(imagemFile) : null;
            const produto = { 
                id_categoria: estado.categoriaSelecionada.id, 
                nome, 
                descricao, 
                descricao_detalhada, // NOVO
                preco, 
                imagem_svg, 
                serve_pessoas 
            };
            await apiCall('/produtos', 'POST', produto);
            
            [inputNomeProduto, inputDescricaoProduto, inputDescricaoDetalhada, inputPrecoProduto, inputImagemProduto, inputServePessoas].forEach(input => input.value = '');
            await carregarProdutos(estado.categoriaSelecionada.id);
        } catch (error) {
            alert(`Falha ao adicionar produto: ${error.message}`);
        }
    });

    // --- Lógica de Drag and Drop ---
    listaCategorias.addEventListener('dragstart', (e) => {
        itemArrastado = e.target.closest('li');
        if(itemArrastado) setTimeout(() => itemArrastado.classList.add('dragging'), 0);
    });

    listaCategorias.addEventListener('dragover', (e) => {
        e.preventDefault();
        if(!itemArrastado) return;
        const itemApos = obterElementoAposArrastar(listaCategorias, e.clientY);
        if (itemApos == null) {
            listaCategorias.appendChild(itemArrastado);
        } else {
            listaCategorias.insertBefore(itemArrastado, itemApos);
        }
    });

    function obterElementoAposArrastar(container, y) {
        const elementosArrastaveis = [...container.querySelectorAll('li:not(.dragging)')];
        return elementosArrastaveis.reduce((maisProximo, filho) => {
            const box = filho.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > maisProximo.offset) {
                return { offset: offset, element: filho };
            } else {
                return maisProximo;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    listaCategorias.addEventListener('dragend', async () => {
        if(!itemArrastado) return;
        itemArrastado.classList.remove('dragging');
        itemArrastado = null;
        const novaOrdemIds = [...listaCategorias.querySelectorAll('li')].map(li => li.dataset.id);
        try {
            await apiCall('/categorias/ordenar', 'POST', { ordem: novaOrdemIds });
        } catch (error) {
            alert('Não foi possível salvar a nova ordem. A página será recarregada.');
            carregarCategorias();
        }
    });

    // --- Lógica do WebSocket ---
    function conectarWebSocketGerencia() {
        const ws = new WebSocket(WS_URL);
        ws.onopen = () => console.log('Gerenciador conectado ao WebSocket!');
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'CARDAPIO_ATUALIZADO') {
                console.log('Recebida atualização do cardápio via WebSocket.');
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
