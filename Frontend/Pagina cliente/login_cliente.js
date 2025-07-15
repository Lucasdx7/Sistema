/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE LOGIN DO CLIENTE (login_cliente.html)
 * ==================================================================
 * Controla o formulário de login da mesa, validação e redirecionamento.
 *
 * Depende do objeto `Notificacao` fornecido por `notificacoes.js` (versão cliente).
 */

document.addEventListener('DOMContentLoaded', () => {
    // Seleciona o formulário de login
    const loginForm = document.getElementById('login-form');

    // Adiciona o listener para o evento de 'submit' do formulário
    loginForm.addEventListener('submit', async function(event) {
        // Previne o comportamento padrão do formulário (que recarregaria a página)
        event.preventDefault();

        // Pega os valores dos campos de usuário e senha
        const usuarioInput = document.getElementById('usuario').value;
        const senhaInput = document.getElementById('senha').value;
        
        // Seleciona o botão para dar feedback visual
        const submitButton = loginForm.querySelector('button[type="submit"]');

        // Validação básica no frontend para evitar requisições desnecessárias
        if (!usuarioInput || !senhaInput) {
            Notificacao.erro('Campos Vazios', 'Por favor, preencha o usuário e a senha da mesa.');
            return;
        }

        // Desabilita o botão e mostra um feedback de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

        try {
            // Faz a requisição para a API de login do cliente
            const response = await fetch('/auth/login-cliente', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                // Envia os dados no formato que o backend espera
                body: JSON.stringify({ nome_usuario: usuarioInput, senha: senhaInput })
            });

            // Converte a resposta da API para JSON
            const data = await response.json();

            // Se a resposta foi bem-sucedida (status 2xx)
            if (response.ok) {
                // Limpa qualquer carrinho antigo de outra mesa
                localStorage.removeItem('carrinho');

                // Salva as informações essenciais no localStorage
                localStorage.setItem('token', data.token);
                localStorage.setItem('mesaId', data.mesa.id); // Essencial para os pedidos
                localStorage.setItem('nomeMesa', data.mesa.nome_usuario);
                
                // Redireciona para a próxima etapa: coletar dados do cliente
                window.location.href = '/dados-cliente';
            } else {
                // Se a API retornou um erro (ex: 401 Unauthorized), mostra a notificação
                Notificacao.erro('Falha no Login', data.message || 'Usuário ou senha inválidos.');
            }
        } catch (error) {
            // Se houve um erro de rede (servidor offline, etc.)
            console.error('Erro ao fazer login:', error);
            Notificacao.erro('Erro de Conexão', 'Não foi possível conectar ao servidor. Por favor, chame um garçom.');
        } finally {
            // Reabilita o botão, independentemente do resultado (sucesso ou falha)
            submitButton.disabled = false;
            submitButton.innerHTML = 'Entrar';
        }
    });
});
