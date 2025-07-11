document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/login-gerencia';
        return;
    }

    // URL da API para adicionar/deletar mesas
    const API_MESAS_URL = '/api/mesas'; 
    // NOVA URL da API para buscar o status
    const API_STATUS_URL = '/api/mesas/status'; 

    const form = document.getElementById('form-add-mesa');
    const nomeInput = document.getElementById('nome-mesa-input');
    const senhaInput = document.getElementById('senha-mesa-input');
    const listaMesas = document.getElementById('lista-mesas');
    const formMessage = document.getElementById('form-message');

    // Função para buscar e renderizar o STATUS das mesas
    async function carregarStatusMesas() {
        try {
            // Chama a nova rota /api/mesas/status
            const response = await fetch(API_STATUS_URL, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Falha ao carregar status das mesas.');
            
            const mesas = await response.json();
            listaMesas.innerHTML = '';

            if (mesas.length === 0) {
                listaMesas.innerHTML = '<p>Nenhuma mesa cadastrada. Adicione uma no painel ao lado.</p>';
                return;
            }

            mesas.forEach(mesa => {
                const li = document.createElement('li');
                // Adiciona uma classe 'ocupada' se a mesa tiver um cliente
                li.className = mesa.nome_cliente ? 'mesa-item ocupada' : 'mesa-item livre';

                let statusHtml = '';
                if (mesa.nome_cliente) {
                    // Se a mesa está OCUPADA
                    statusHtml = `
                        <div class="status-info">
                            <span class="cliente-nome"><i class="fas fa-user"></i> ${mesa.nome_cliente}</span>
                            <span class="status-tag">Ocupada</span>
                        </div>
                    `;
                } else {
                    // Se a mesa está LIVRE
                    statusHtml = `
                        <div class="status-info">
                            <span class="cliente-nome">--</span>
                            <span class="status-tag livre">Livre</span>
                        </div>
                    `;
                }

                li.innerHTML = `
                    <div class="mesa-info">
                        <i class="fas fa-tablet-alt"></i>
                        <span>${mesa.nome_usuario}</span>
                    </div>
                    ${statusHtml}
                    <button class="delete-btn" data-id="${mesa.id}" title="Remover Mesa">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                `;
                listaMesas.appendChild(li);
            });
        } catch (error) {
            listaMesas.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    // Event listener para adicionar (sem alterações, mas agora recarrega o status)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = nomeInput.value.trim();
        const senha = senhaInput.value.trim();

        try {
            const response = await fetch(API_MESAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nome_usuario: nome, senha: senha })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro desconhecido.');

            formMessage.textContent = `Mesa "${nome}" adicionada!`;
            formMessage.style.color = 'green';
            form.reset();
            carregarStatusMesas(); // Recarrega a lista de status

        } catch (error) {
            formMessage.textContent = error.message;
            formMessage.style.color = 'red';
        }
        setTimeout(() => formMessage.textContent = '', 3000);
    });

    // Event listener para remover (sem alterações, mas agora recarrega o status)
    listaMesas.addEventListener('click', async (e) => {
        const deleteButton = e.target.closest('.delete-btn');
        if (deleteButton) {
            const mesaId = deleteButton.dataset.id;
            const mesaNome = deleteButton.parentElement.querySelector('.mesa-info span').textContent;

            if (confirm(`Tem certeza que deseja remover a mesa "${mesaNome}"?`)) {
                try {
                    const response = await fetch(`${API_MESAS_URL}/${mesaId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Falha ao remover a mesa.');
                    carregarStatusMesas(); // Recarrega a lista de status
                } catch (error) {
                    alert(error.message);
                }
            }
        }
    });

    // Carrega o status das mesas ao iniciar a página
    carregarStatusMesas();
    // Opcional: Recarrega a lista a cada 30 segundos para ter um painel "em tempo real"
    setInterval(carregarStatusMesas, 30000);
});
