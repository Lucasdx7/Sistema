/**
 * ==================================================================
 * MÓDULO DE NOTIFICAÇÕES GLOBAIS (usando SweetAlert2)
 * ==================================================================
 * Este arquivo centraliza a criação de notificações para todo o sistema,
 * garantindo um visual consistente e facilitando a manutenção.
 *
 * Para usar, inclua este arquivo no seu HTML DEPOIS de incluir a
 * biblioteca SweetAlert2, e ANTES do seu script principal (ex: app.js).
 *
 * Exemplo de uso:
 * Notificacao.sucesso('Item salvo com sucesso!');
 * Notificacao.erro('Oops...', 'Ocorreu um erro ao salvar.');
 * const confirmado = await Notificacao.confirmar('Tem certeza?', 'A ação não pode ser desfeita.');
 * if (confirmado) { ... }
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
            toast: true, // Define o alerta como um "toast"
            position: 'top-end', // Posição no canto superior direito
            showConfirmButton: false, // Não mostra o botão "OK"
            timer: 3000, // O alerta some automaticamente em 3 segundos
            timerProgressBar: true, // Mostra uma barrinha de progresso do tempo
            background: '#3f4f6bff', // Cor de fundo escura
            color: '#ecf0f1', // Cor do texto clara
            didOpen: (toast) => {
                // Pausa o timer se o mouse estiver sobre o alerta
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
            confirmButtonColor: '#e74c3c', // Cor vermelha para o botão de confirmação
            background: '#2f3452ff', // Fundo escuro
            color: '#ecf0f1' // Texto claro
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
            icon: 'warning', // Ícone de aviso
            showCancelButton: true, // Mostra o botão de cancelar
            confirmButtonText: 'Sim, continuar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#30d646ff', // Cor azul para confirmar
            cancelButtonColor: '#d33', // Cor vermelha para cancelar
            background: '#36506dff',
            color: '#ecf0f1'
        });
        // Retorna true apenas se o botão de confirmação foi clicado
        return resultado.isConfirmed;
    }
};
