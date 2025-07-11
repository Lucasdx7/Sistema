document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
    const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = ''; // Limpa erros antigos

    try {
        const response = await fetch('/auth/login-cliente', { // Rota corrigida
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });

        const data = await response.json();

        if (response.ok) {
            // Salva o token e o nome da mesa
            localStorage.setItem('token', data.token);
            localStorage.setItem('nomeMesa', usuario);
            
            // Redireciona para a NOVA PÁGINA de coleta de dados do cliente
            window.location.href = '/dados-cliente'; // Rota corrigida
        } else {
            errorMessage.textContent = data.message || 'Usuário ou senha inválidos.';
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        errorMessage.textContent = 'Erro ao conectar com o servidor. Tente novamente.';
    }
});
