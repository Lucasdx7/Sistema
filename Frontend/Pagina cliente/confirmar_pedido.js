// /Frontend/Pagina cliente/confirmar_pedido.js

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const sessaoId = localStorage.getItem('sessaoId');
    if (!token || !sessaoId) {
        window.location.href = 'login_cliente.html';
        return;
    }

    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    // IDs e Classes
    const listaResumo = document.getElementById('lista-resumo-pedido');
    const subtotalEl = document.getElementById('subtotal-valor');
    const totalEl = document.getElementById('total-valor');
    const voltarBtn = document.getElementById('voltar-cardapio-btn');
    const confirmarBtn = document.getElementById('confirmar-pedido-btn');
    const cartBadge = document.querySelector('.cart-icon .badge');
    const profileIcon = document.getElementById('profile-icon');

    function renderizarPagina() {
        if (carrinho.length === 0) {
            listaResumo.innerHTML = '<p>Seu carrinho de pré-pedido está vazio. Volte ao cardápio para adicionar itens.</p>';
            confirmarBtn.disabled = true; // Desabilita o botão se não houver itens
        }

        let subtotal = 0;
        listaResumo.innerHTML = '';
        carrinho.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="item-details">
                    <h3>${item.nome}</h3>
                    <p>${item.descricao || 'Item sem descrição adicional.'}</p>
                </div>
                <span class="item-price">R$ ${parseFloat(item.preco).toFixed(2)}</span>
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
     * Função aprimorada para confirmar o pedido com tratamento de erro detalhado.
     */
    async function confirmarPedido() {
        confirmarBtn.disabled = true;
        confirmarBtn.textContent = 'Enviando...';

        const pedidosParaEnviar = carrinho.map(item => ({
            id_sessao: sessaoId,
            id_produto: item.id,
            preco_unitario: item.preco
        }));

        try {
            // Usamos Promise.all para enviar todas as requisições em paralelo.
            // É mais rápido, mas se uma falhar, todas falham (o que é bom nesse caso).
            const promessasDePedidos = pedidosParaEnviar.map(pedido =>
                fetch('/api/pedidos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(pedido)
                }).then(async response => {
                    // **MELHORIA CRÍTICA**: Verificamos CADA resposta.
                    if (!response.ok) {
                        // Tentamos pegar a mensagem de erro específica da API.
                        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido no servidor.' }));
                        throw new Error(errorData.message);
                    }
                    return response.json();
                })
            );

            await Promise.all(promessasDePedidos);
            
            localStorage.removeItem('carrinho'); // Limpa o carrinho SÓ SE TUDO DER CERTO
            alert('Pedido confirmado com sucesso e enviado para a cozinha!');
            window.location.href = '/cardapio'; // Volta para o cardápio

        } catch (error) {
            // **MELHORIA CRÍTICA**: Exibe o erro específico que veio da API.
            console.error('Falha ao confirmar pedido:', error);
            alert(`Houve um erro ao confirmar seu pedido:\n\n${error.message}\n\nPor favor, tente novamente ou chame um garçom.`);
        } finally {
            // Garante que o botão seja reativado, mesmo se der erro.
            confirmarBtn.disabled = false;
            confirmarBtn.textContent = 'Confirmar e Enviar';
        }
    }

    // Event Listeners
    voltarBtn.addEventListener('click', () => {
        window.location.href = '/cardapio';
    });
    confirmarBtn.addEventListener('click', confirmarPedido);
    profileIcon.addEventListener('click', () => window.location.href = '/conta');

    renderizarPagina();
});
