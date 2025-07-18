// /Frontend/Pagina gerencia/login.js - CÓDIGO COMPLETO E CORRIGIDO

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const loginForm = document.getElementById('login-form');
    const registerModal = document.getElementById('register-modal');
    const openModalBtn = document.getElementById('open-register-modal-btn');
    const closeModalBtn = document.getElementById('close-register-modal-btn');
    const registerForm = document.getElementById('register-form');

    // --- Lógica de Login com Notificações e Delay ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;

            Notificacao.mostrarCarregando('Verificando credenciais...');

            try {
                const response = await fetch('/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Credenciais inválidas.');
                }

                // Armazena os dados no localStorage
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));

                // Exibe uma notificação de sucesso com temporizador
                await Notificacao.sucessoComTimer(
                    'Login bem-sucedido!',
                    'Você será redirecionado em breve.',
                    1000 // 2 segundos de espera
                );

                // Redireciona APÓS a notificação fechar
                window.location.href = '/gerencia-home';

            } catch (error) {
                Notificacao.erro('Falha no Login', error.message);
            }
        });
    }
    
    // --- Lógica do Modal de Registro ---
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

    // --- Lógica de Registro com Notificações ---
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nome = document.getElementById('register-nome').value;
            const email = document.getElementById('register-email').value;
            const senha = document.getElementById('register-senha').value;
            const nivel_acesso = document.querySelector('input[name="nivel_acesso"]:checked').value;
            const tokenSecreto = document.getElementById('register-token').value;
            const usuario = nome;

            Notificacao.mostrarCarregando('Registrando...');

            try {
                const response = await fetch('/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, senha, nivel_acesso, tokenSecreto, usuario })
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Erro ao registrar.');
                }

                await Notificacao.sucesso('Sucesso!', 'Novo gerente registrado com sucesso!');
                
                registerModal.classList.add('hidden');
                registerForm.reset();

            } catch (error) {
                Notificacao.erro('Falha no Registro', error.message);
            }
        });
    }

    // --- Seção WebSocket para Notificações em Tempo Real ---
    function conectarWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl );

        ws.onopen = () => {
            console.log('Conexão WebSocket estabelecida para a gerência.');
        };

        ws.onmessage = (event) => {
            try {
                const mensagem = JSON.parse(event.data);
                if (mensagem.type === 'CHAMADO_GARCOM') {
                   Swal.fire({
                        title: '<strong>Chamado!</strong>',
                        html: `<h2>A <strong>${mensagem.nomeMesa}</strong> está solicitando atendimento.</h2>`,
                        icon: 'warning',
                        confirmButtonText: 'OK, Entendido!',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                    });
                }
            } catch (error) {
                console.error('Erro ao processar mensagem WebSocket:', error);
            }
        };

        ws.onclose = () => {
            console.log('Conexão WebSocket fechada. Tentando reconectar em 5 segundos...');
            setTimeout(conectarWebSocket, 5000);
        };

        ws.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
            ws.close();
        };
    }

    conectarWebSocket();
});
