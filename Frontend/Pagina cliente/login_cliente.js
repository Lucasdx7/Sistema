document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const usuarioInput = document.getElementById('usuario').value;
    const senhaInput = document.getElementById('senha').value;
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = ''; // Limpa erros antigos

    try {
        const response = await fetch('/auth/login-cliente', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            
            // --- CORREÇÃO APLICADA AQUI ---
            // O nome do campo foi alterado de 'usuario' para 'nome_usuario'
            // para corresponder ao que o backend espera.
            body: JSON.stringify({ nome_usuario: usuarioInput, senha: senhaInput })
        });

        const data = await response.json();

        if (response.ok) {
            // Salva o token e os dados da mesa retornados pela API
            localStorage.setItem('token', data.token);
            // É melhor salvar os dados que a API retorna, para garantir consistência
            localStorage.setItem('nomeMesa', data.mesa.nome_usuario);
            
            // Redireciona para a página de coleta de dados do cliente
            window.location.href = '/dados-cliente';
        } else {
            errorMessage.textContent = data.message || 'Usuário ou senha inválidos.';
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        errorMessage.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
    }
});
