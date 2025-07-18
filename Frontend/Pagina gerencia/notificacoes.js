/**
 * ==================================================================
 * MÓDULO DE NOTIFICAÇÕES GLOBAIS (usando SweetAlert2)
 * ==================================================================
 * Este arquivo centraliza a criação de notificações para todo o sistema,
 * garantindo um visual consistente e facilitando a manutenção.
 */

const Notificacao = {

    /**
     * Exibe uma notificação de SUCESSO no estilo "toast" (canto da tela).
     * Ideal para feedbacks rápidos que não exigem interação.
     * @param {string} titulo - A mensagem de sucesso a ser exibida.
     */
    sucesso(titulo) {
        Swal.fire({
            icon: 'success',
            title: titulo,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
            background: '#3f4f6bff',
            color: '#ecf0f1',
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
            }
        });
    },

    /**
     * Exibe uma notificação de ERRO em formato de modal (centralizado).
     * Ideal para erros que o usuário precisa ver e confirmar.
     * @param {string} titulo - O título principal do erro (ex: 'Operação Falhou').
     * @param {string} [texto=''] - Um texto adicional com mais detalhes sobre o erro.
     */
    erro(titulo, texto = '') {
        Swal.fire({
            icon: 'error',
            title: titulo,
            text: texto,
            confirmButtonColor: '#e74c3c',
            background: '#2f3452ff',
            color: '#ecf0f1'
        });
    },

    /**
     * Exibe uma caixa de diálogo de CONFIRMAÇÃO.
     * Pausa a execução do código até que o usuário clique em "Sim" ou "Cancelar".
     * @param {string} titulo - A pergunta principal (ex: 'Tem certeza?').
     * @param {string} texto - Um texto de aviso sobre as consequências da ação.
     * @returns {Promise<boolean>} - Retorna uma promessa que resolve para `true` se o usuário confirmar, e `false` caso contrário.
     */
    async confirmar(titulo, texto) {
        const resultado = await Swal.fire({
            title: titulo,
            text: texto,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, continuar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#30d646ff',
            cancelButtonColor: '#d33',
            background: '#36506dff',
            color: '#ecf0f1'
        });
        return resultado.isConfirmed;
    },
    
    /**
     * Mostra um pop-up de carregamento sem botões.
     * Ideal para aguardar respostas do servidor.
     * @param {string} titulo - O título a ser exibido no pop-up (ex: 'Carregando...').
     */
    mostrarCarregando(titulo) {
        Swal.fire({
            title: titulo,
            text: 'Por favor, aguarde.',
            allowOutsideClick: false,
            background: '#2f3452ff', // Mantendo o estilo
            color: '#ecf0f1',       // Mantendo o estilo
            didOpen: () => {
                Swal.showLoading();
            }
        });
    },

    /**
     * ==================================================================
     * NOVA FUNÇÃO ADAPTADA PARA O SEU ESTILO
     * ==================================================================
     * Exibe uma notificação de SUCESSO em formato de MODAL que fecha sozinha.
     * Perfeita para o login, pois garante que o usuário veja a mensagem antes de ser redirecionado.
     * @param {string} titulo - O título da mensagem (ex: 'Login bem-sucedido!').
     * @param {string} texto - O texto de apoio (ex: 'Você será redirecionado...').
     * @param {number} [timer=2000] - Tempo em milissegundos para a notificação ficar visível.
     */
    sucessoComTimer(titulo, texto, timer = 2000) {
        return Swal.fire({
            icon: 'success',
            title: titulo,
            text: texto,
            timer: timer,
            timerProgressBar: true,
            showConfirmButton: false, // Esconde o botão "OK"
            allowOutsideClick: false,
            allowEscapeKey: false,
            background: '#2f3452ff', // Usando a mesma cor de fundo dos outros modais
            color: '#ecf0f1'       // Usando a mesma cor de texto
        });
    }
};
