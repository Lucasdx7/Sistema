/**
 * ==================================================================
 * SCRIPT DA PÁGINA DE RELATÓRIOS (relatorios.html)
 * ==================================================================
 * Controla a exibição de gráficos e KPIs de vendas, a lógica de
 * permissão, o menu de perfil, a escuta de notificações e a geração de PDF.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileDropdown = document.getElementById('profile-dropdown');
    const logoutBtn = document.getElementById('logout-btn');
    const dropdownUserName = document.getElementById('dropdown-user-name');
    const dropdownUserRole = document.getElementById('dropdown-user-role');
    const filtroPeriodo = document.getElementById('periodo-filtro');
    const btnCriarPdf = document.getElementById('btn-criar-pdf'); // Novo elemento

    // --- Elementos dos KPIs ---
    const kpiVendasTotais = document.getElementById('kpi-vendas-totais');
    const kpiTotalPedidos = document.getElementById('kpi-total-pedidos');
    const kpiTicketMedio = document.getElementById('kpi-ticket-medio');

    // --- Contextos dos Gráficos ---
    const ctxVendas = document.getElementById('grafico-vendas-ano').getContext('2d');
    const ctxPagamentos = document.getElementById('grafico-metodos-pagamento').getContext('2d');

    let graficoVendas, graficoPagamentos; // Variáveis para armazenar as instâncias dos gráficos

    // --- Verificação de Autenticação ---
    const token = localStorage.getItem('authToken');
    const usuarioString = localStorage.getItem('usuario');

    if (!token || !usuarioString) {
        Notificacao.erro('Acesso Negado', 'Você precisa estar logado para acessar esta página.')
            .then(() => window.location.href = '/login-gerencia');
        return;
    }
    const usuario = JSON.parse(usuarioString);

    // --- Funções ---

    /**
     * Realiza o logout do usuário.
     */
    function fazerLogout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('usuario');
        Notificacao.sucesso('Logout realizado com sucesso!');
        setTimeout(() => window.location.href = '/login-gerencia', 1500);
    }

    /**
     * Formata um número para a moeda brasileira (BRL).
     * @param {number} valor - O valor a ser formatado.
     * @returns {string} - O valor formatado como string.
     */
    const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    /**
     * Atualiza os cards de KPI com os dados recebidos.
     * @param {object} dados - Os dados agregados do relatório.
     */
    function atualizarKPIs(dados) {
        const vendas = parseFloat(dados.vendasTotais) || 0;
        const pedidos = parseInt(dados.totalPedidos) || 0;
        const ticket = parseFloat(dados.ticketMedio) || 0;

        kpiVendasTotais.textContent = formatarMoeda(vendas);
        kpiTotalPedidos.textContent = pedidos.toString();
        kpiTicketMedio.textContent = formatarMoeda(ticket);
    }

    /**
     * Cria ou atualiza o gráfico de vendas por período.
     * @param {object} dados - Os dados para o gráfico.
     */
    function renderizarGraficoVendas(dados) {
        if (graficoVendas) {
            graficoVendas.destroy();
        }
        graficoVendas = new Chart(ctxVendas, {
            type: 'bar',
            data: {
                labels: dados.labels,
                datasets: [{
                    label: 'Vendas (R$)',
                    data: dados.valores,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Desativa animações para a captura do PDF
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => formatarMoeda(value)
                        }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Vendas: ${formatarMoeda(context.raw)}`
                        }
                    }
                }
            }
        });
    }

    /**
     * Cria ou atualiza o gráfico de métodos de pagamento.
     * @param {object} dados - Os dados para o gráfico.
     */
    function renderizarGraficoPagamentos(dados) {
        if (graficoPagamentos) {
            graficoPagamentos.destroy();
        }
        graficoPagamentos = new Chart(ctxPagamentos, {
            type: 'doughnut',
            data: {
                labels: ['Cartão', 'Dinheiro', 'PIX'],
                datasets: [{
                    label: 'Métodos de Pagamento',
                    data: [dados.cartao, dados.dinheiro, dados.pix],
                    backgroundColor: ['#007bff', '#28a745', '#ffc107'],
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Desativa animações para a captura do PDF
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${formatarMoeda(context.raw)}`
                        }
                    }
                }
            }
        });
    }

    /**
     * Busca os dados do relatório da API com base no período selecionado.
     */
    async function carregarRelatorios() {
        const periodo = filtroPeriodo.value;
        try {
            const response = await fetch(`/api/relatorios?periodo=${periodo}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Erro ao buscar dados do servidor.' }));
                throw new Error(errorData.message);
            }

            const dados = await response.json();
            atualizarKPIs(dados.kpis);
            renderizarGraficoVendas(dados.graficoVendas);
            renderizarGraficoPagamentos(dados.graficoPagamentos);

        } catch (error) {
            Notificacao.erro('Falha ao Carregar Relatórios', error.message);
            atualizarKPIs({});
        }
    }

    /**
     * Gera e baixa um PDF do conteúdo do relatório.
     */
    async function gerarPDF() {
        const { jsPDF } = window.jspdf;
        const elementoParaCapturar = document.getElementById('relatorio-para-pdf');
        
        // Oculta o botão de PDF para não aparecer na captura
        btnCriarPdf.style.display = 'none';

        try {
            const canvas = await html2canvas(elementoParaCapturar, {
                scale: 2, // Aumenta a resolução da captura
                useCORS: true, // Permite carregar imagens de outras origens se houver
                backgroundColor: '#f4f7fa' // Cor de fundo do dashboard
            });

            // Mostra o botão novamente após a captura
            btnCriarPdf.style.display = 'inline-flex';

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

            // Formata a data para o nome do arquivo
            const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
            pdf.save(`Relatorio-Vendas-${hoje}.pdf`);

        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            Notificacao.erro('Erro ao Gerar PDF', 'Ocorreu um problema ao tentar criar o arquivo PDF.');
            // Garante que o botão reapareça mesmo em caso de erro
            btnCriarPdf.style.display = 'inline-flex';
        }
    }

    // --- Event Listeners ---
    if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
    if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;

    profileMenuBtn.addEventListener('click', () => profileDropdown.classList.toggle('hidden'));
    window.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (await Notificacao.confirmar('Sair do Sistema', 'Você tem certeza que deseja fazer logout?')) {
            fazerLogout();
        }
    });

    filtroPeriodo.addEventListener('change', carregarRelatorios);
    btnCriarPdf.addEventListener('click', gerarPDF); // Adiciona o listener ao botão


     /**
     * Conecta ao WebSocket para receber notificações em tempo real.
     */
    function conectarWebSocket() {
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}`;
        const ws = new WebSocket(wsUrl );

        ws.onopen = () => console.log('Conexão WebSocket estabelecida para a gerência.');

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

    // --- Event Listeners do Menu de Perfil ---
    if (dropdownUserName) dropdownUserName.textContent = usuario.nome;
    if (dropdownUserRole) dropdownUserRole.textContent = usuario.nivel_acesso;

    profileMenuBtn.addEventListener('click', () => {
        profileDropdown.classList.toggle('hidden');
    });

    window.addEventListener('click', (e) => {
        if (!profileMenuBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
            profileDropdown.classList.add('hidden');
        }
    });

    logoutBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmado = await Notificacao.confirmar('Sair do Sistema', 'Você tem certeza que deseja fazer logout?');
        if (confirmado) {
            fazerLogout();
        }
    });

    // --- Inicialização ---
    carregarRelatorios();
    conectarWebSocket();
});
