document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const nomeMesa = localStorage.getItem('nomeMesa');
    if (!token || !nomeMesa) {
        window.location.href = 'login_cliente.html';
        return;
    }

    document.getElementById('welcome-mesa-name').textContent = `Olá, ${nomeMesa}!`;

    const form = document.getElementById('dados-cliente-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Aguarde...';

        const dadosCliente = {
            nome: document.getElementById('nome').value,
            telefone: document.getElementById('telefone').value,
            cpf: document.getElementById('cpf').value
        };

        try {
            // Chama a nova rota da API para criar a sessão no banco de dados
            const response = await fetch('/api/sessoes/iniciar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Envia o token da MESA para identificá-la
                },
                body: JSON.stringify(dadosCliente)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Não foi possível iniciar a sessão.');
            }

            // Limpa dados de sessões antigas e salva os novos
            localStorage.removeItem('dadosCliente'); // Remove o antigo
            localStorage.removeItem('sessaoId');     // Remove o antigo

            // Salva o ID da SESSÃO ATUAL e os dados do cliente no localStorage.
            // O 'sessaoId' será a chave para tudo que este cliente fizer.
            localStorage.setItem('sessaoId', result.sessaoId);
            localStorage.setItem('dadosCliente', JSON.stringify({ nome: result.nomeCliente }));

            // Redireciona para a página do cardápio
            window.location.href = '/cardapio';

        } catch (error) {
            alert(`Erro: ${error.message}`);
            submitButton.disabled = false;
            submitButton.textContent = 'Ver o Cardápio';
        }
    });
});
