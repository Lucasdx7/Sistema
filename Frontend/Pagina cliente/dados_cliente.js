/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE COLETA DE DADOS DO CLIENTE (dados_cliente.html)
 * ==================================================================
 * Coleta o nome do cliente e inicia uma nova sessão de pedidos.
 *
 * Depende do objeto `Notificacao` fornecido por `notificacoes.js` (versão cliente).
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Autenticação e Verificação de Dados ---
    const token = localStorage.getItem('token');
    const nomeMesa = localStorage.getItem('nomeMesa');

    // Se o token ou o nome da mesa não existirem, o usuário não passou pelo login.
    if (!token || !nomeMesa) {
        Notificacao.erro('Acesso Inválido', 'Você precisa fazer o login da mesa primeiro.')
            .then(() => {
                window.location.href = '/login';
            });
        return; // Interrompe a execução
    }

    // --- Elementos do DOM ---
    const welcomeMessage = document.getElementById('welcome-mesa-name');
    const form = document.getElementById('dados-cliente-form');
    const nomeInput = document.getElementById('nome');

    // Personaliza a mensagem de boas-vindas
    welcomeMessage.textContent = `Olá, ${nomeMesa}!`;

    // --- Event Listener Principal ---
    form.addEventListener('submit', async (e) => {
        // Previne o recarregamento da página
        e.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const nomeCliente = nomeInput.value.trim();

        // Validação: O nome do cliente é o único campo obrigatório para iniciar a sessão.
        if (!nomeCliente) {
            Notificacao.erro('Campo Obrigatório', 'Por favor, informe seu nome para continuar.');
            return;
        }

        // Desabilita o botão e mostra um feedback de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';

        // Coleta os dados do formulário
        const dadosCliente = {
            nome: nomeCliente,
            telefone: document.getElementById('telefone').value,
            cpf: document.getElementById('cpf').value
        };

        try {
            // Chama a rota da API para criar a sessão no banco de dados
            const response = await fetch('/api/sessoes/iniciar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Envia o token da MESA para identificá-la
                },
                body: JSON.stringify(dadosCliente)
            });

            const result = await response.json();

            // Se a API retornar um erro, lança uma exceção para o bloco catch
            if (!response.ok) {
                throw new Error(result.message || 'Não foi possível iniciar a sessão.');
            }

            // Limpa dados de sessões antigas e salva os novos
            localStorage.removeItem('sessaoId');     // Garante que não haja IDs de sessão antigos
            localStorage.removeItem('dadosCliente');

            // Salva o ID da SESSÃO ATUAL e os dados do cliente.
            // O 'sessaoId' será a chave para tudo que este cliente fizer.
            localStorage.setItem('sessaoId', result.sessaoId);
            localStorage.setItem('dadosCliente', JSON.stringify({ nome: result.nomeCliente }));

            // Redireciona para a página do cardápio
            window.location.href = '/cardapio';

        } catch (error) {
            // Em caso de erro, exibe uma notificação clara
            Notificacao.erro('Erro ao Iniciar Sessão', error.message);
        } finally {
            // Reabilita o botão, permitindo que o usuário tente novamente
            submitButton.disabled = false;
            submitButton.innerHTML = 'Ver o Cardápio <i class="fas fa-arrow-right"></i>';
        }
    });
});