// /Frontend/Pagina gerencia/login.js - VERSÃO CORRIGIDA

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const loginForm = document.getElementById('login-form');
    const loginErrorMessage = document.getElementById('login-error-message');
    
    const registerModal = document.getElementById('register-modal');
    const openModalBtn = document.getElementById('open-register-modal-btn');
    const closeModalBtn = document.getElementById('close-register-modal-btn');
    
    const registerForm = document.getElementById('register-form');
    const registerErrorMessage = document.getElementById('register-error-message');

    // --- Lógica de Login (NÃO PRECISA DE MUDANÇAS) ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginErrorMessage.textContent = '';
            
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao fazer login.');
                }

                localStorage.setItem('authToken', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                window.location.href = '/gerencia-home';
            } catch (error) {
                loginErrorMessage.textContent = error.message;
            }
        });
    }

    // --- Lógica do Modal de Registro (NÃO PRECISA DE MUDANÇAS) ---
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            registerModal.classList.remove('hidden');
        });
    }
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            registerModal.classList.add('hidden');
        });
    }
    if (registerModal) {
        registerModal.addEventListener('click', (e) => {
            if (e.target === registerModal) {
                registerModal.classList.add('hidden');
            }
        });
    }

    // --- Lógica de Registro (AQUI ESTÁ A CORREÇÃO) ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerErrorMessage.textContent = '';

            // Coleta dos dados do formulário
            const nome = document.getElementById('register-nome').value;
            const email = document.getElementById('register-email').value;
            const senha = document.getElementById('register-senha').value;
            const nivel_acesso = document.querySelector('input[name="nivel_acesso"]:checked').value;
            const tokenSecreto = document.getElementById('register-token').value;
            
            // ==================================================================
            // CORREÇÃO APLICADA AQUI
            // O backend espera um campo 'usuario'. Vamos criá-lo a partir do nome.
            const usuario = nome;
            // ==================================================================

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Adicionamos a variável 'usuario' ao corpo da requisição
                    body: JSON.stringify({ nome, email, senha, nivel_acesso, tokenSecreto, usuario })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao registrar.');
                }

                alert('Novo gerente registrado com sucesso!');
                registerModal.classList.add('hidden');
                registerForm.reset();
            } catch (error) {
                registerErrorMessage.textContent = error.message;
            }
        });
    }
});
