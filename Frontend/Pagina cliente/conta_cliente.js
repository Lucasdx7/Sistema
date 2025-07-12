// /Frontend/Pagina cliente/conta_cliente.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId');
    const dadosCliente = JSON.parse(localStorage.getItem('dadosCliente'));
    const nomeMesa = localStorage.getItem('nomeMesa');

    if (!token || !sessaoId) {
        alert('Sessão não encontrada. Redirecionando para o login.');
        window.location.href = '/login';
        return;
    }

    // --- Elementos do DOM ---
    const clienteNomeEl = document.getElementById('cliente-nome');
    const clienteMesaEl = document.getElementById('cliente-mesa');
    const listaPedidos = document.getElementById('lista-pedidos');
    const subtotalEl = document.getElementById('subtotal-valor');
    const taxaEl = document.getElementById('taxa-servico');
    const totalEl = document.getElementById('total-valor');
    
    // --- Elementos do Modal de Logout (NOVOS) ---
    const hiddenButton = document.getElementById('hidden-logout-button');
    const logoutModal = document.getElementById('logout-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const logoutForm = document.getElementById('logout-form');
    const logoutMessage = document.getElementById('logout-message');

    // --- Preenche os detalhes do cliente ---
    if (clienteNomeEl) clienteNomeEl.textContent = dadosCliente?.nome || 'Cliente não identificado';
    if (clienteMesaEl) clienteMesaEl.textContent = nomeMesa || 'Mesa não informada';

    /**
     * Carrega os dados da conta da API.
     */
    async function carregarConta() {
        listaPedidos.innerHTML = '<p>Carregando sua conta...</p>';
        try {
            const response = await fetch(`/api/sessoes/${sessaoId}/conta`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            listaPedidos.innerHTML = '';
            if (data.pedidos && data.pedidos.length > 0) {
                data.pedidos.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div class="produto-info">
                            <img src="${item.imagem_svg || 'https://via.placeholder.com/60'}" alt="${item.nome_produto}">
                            <div>
                                <strong>${item.nome_produto}</strong>
                                <span>${item.quantidade} x R$ ${parseFloat(item.preco_unitario ).toFixed(2)}</span>
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
            console.error('Erro ao carregar a conta:', error);
            listaPedidos.innerHTML = `<p style="color: red; font-weight: bold;">Erro: ${error.message}</p>`;
        }
    }

    // --- Lógica do Modal de Logout ---

    // Abre o modal ao clicar no botão escondido
    hiddenButton.addEventListener('click', () => {
        logoutModal.classList.remove('hidden');
    });

    // Fecha o modal
    closeModalBtn.addEventListener('click', () => {
        logoutModal.classList.add('hidden');
        logoutForm.reset();
        logoutMessage.textContent = '';
    });

    // Lida com a submissão do formulário de logout (VERSÃO CORRIGIDA)
// /Frontend/Pagina cliente/conta_cliente.js

// ... (seu código anterior permanece o mesmo)

// Lida com a submissão do formulário de logout (VERSÃO CORRIGIDA)
logoutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usuarioMesa = document.getElementById('mesa-usuario').value;
    const senhaMesa = document.getElementById('mesa-senha').value;
    
    logoutMessage.textContent = 'Verificando credenciais...';
    logoutMessage.style.color = 'gray';

    try {
        // 1. Autentica a mesa
        const authResponse = await fetch('/auth/login-cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome_usuario: usuarioMesa, senha: senhaMesa })
        });
        const authResult = await authResponse.json();
        if (!authResponse.ok) throw new Error(authResult.message);

        // 2. Fecha a sessão
        logoutMessage.textContent = 'Credenciais corretas! Encerrando sessão...';
        logoutMessage.style.color = 'green';

        const closeResponse = await fetch(`/api/sessoes/${sessaoId}/fechar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const closeResult = await closeResponse.json();
        if (!closeResponse.ok) throw new Error(closeResult.message);

        // 3. Limpa os dados e redireciona
        alert('Sessão encerrada com sucesso!');
        
        // --- CORREÇÃO APLICADA AQUI ---
        // Em vez de localStorage.clear(), removemos apenas os itens da sessão do cliente.
        // Isso preserva o token de login da gerência.
        localStorage.removeItem('token');
        localStorage.removeItem('sessaoId');
        localStorage.removeItem('dadosCliente');
        localStorage.removeItem('nomeMesa');
        localStorage.removeItem('carrinho'); // Importante limpar o carrinho também
        // ------------------------------------

        window.location.href = '/login';

    } catch (error) {
        logoutMessage.textContent = `Erro: ${error.message}`;
        logoutMessage.style.color = 'red';
    }
});


    // --- Inicialização ---
    carregarConta();
});
