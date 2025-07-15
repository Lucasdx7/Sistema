# Sistema de Gestão de Cardápio e Pedidos

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow ) ![Progresso](https://img.shields.io/badge/progresso-64%25-brightgreen ) ![Tecnologia](https://img.shields.io/badge/backend-Node.js%20%26%20Express-green ) ![Tecnologia](https://img.shields.io/badge/frontend-HTML,%20CSS,%20JS-blue ) ![Banco de Dados](https://img.shields.io/badge/database-MySQL-blueviolet )

Sistema de gerenciamento completo para restaurantes, com foco em segurança, usabilidade e atualizações em tempo real. A plataforma permite que a gerência administre o cardápio, mesas e relatórios de forma dinâmica, enquanto os clientes realizam seus pedidos diretamente por um tablet na mesa.

## 📋 Visão Geral do Projeto

O objetivo deste sistema é modernizar a experiência do cliente e otimizar a gestão do restaurante. Ele é dividido em duas interfaces principais:

1.  **Painel de Gerenciamento:** Uma área administrativa segura onde a equipe gerencial pode administrar o cardápio, mesas, chamados de garçom, acompanhar o histórico de sessões e gerar relatórios de vendas.
2.  **Interface do Cliente (Tablet):** Um sistema completo que guia o cliente desde o login da mesa, passando pela visualização do cardápio, montagem do pedido, até o fechamento da conta com a assistência de um funcionário.

O sistema utiliza WebSockets para garantir que qualquer alteração feita pela gerência ou solicitação do cliente seja refletida **em tempo real** em todas as telas conectadas, sem a necessidade de recarregar a página.

---

## 🚀 Status Atual (Progresso: 64%)

O projeto está em uma fase madura de desenvolvimento, com o fluxo completo de interação do cliente e as principais funcionalidades de gerenciamento implementadas e estáveis.

### Funcionalidades Concluídas:
-   [x] **Backend:** Estrutura do servidor com Node.js e Express.
-   [x] **Banco de Dados:** Schema robusto com tabelas para `usuarios`, `mesas`, `sessoes_cliente`, `pedidos`, `categorias`, `produtos`, `chamados` e `logs`.
-   [x] **API Segura e Middleware Inteligente:**
    -   [x] Endpoints protegidos que exigem autenticação JWT para acesso.
    -   [x] Middleware de autenticação (`authMiddleware`) capaz de diferenciar tokens de **Gerência** e de **Mesa**.
-   [x] **Sistema de Autenticação Robusto:**
    -   [x] Telas de login separadas e seguras para **Gerência** e **Mesas**.
    -   [x] Criptografia de senhas no banco de dados (`bcryptjs`).
    -   [x] Logout seguro que não interfere em outras sessões ativas (ex: logout de cliente não desloga gerente).
-   [x] **Painel de Gerenciamento (CRUD Completo):**
    -   [x] **Gestão de Cardápio:** Adicionar, editar, remover, ordenar e controlar status de categorias e produtos. Inclui sistema de sugestões e configuração de Happy Hour.
    -   [x] **Gestão de Mesas:**
        -   [x] Cadastrar e remover mesas.
        -   [x] Painel interativo para visualizar o histórico de sessões de cada mesa.
        -   [x] Cancelar itens de pedidos de uma sessão ativa.
    -   [x] **Gestão de Chamados:**
        -   [x] Página dedicada para visualizar chamados de garçom em tempo real.
        -   [x] Contador de chamados pendentes no menu principal para visibilidade imediata.
        -   [x] Funcionalidade para marcar um chamado como "Atendido".
        -   [x] **(NOVO)** Botão para **limpar o histórico** de chamados já atendidos, mantendo a tela organizada.
    -   [x] **Geração de Recibos Profissionais:**
        -   [x] Geração de recibo com layout otimizado para **impressoras térmicas de 80mm**.
        -   [x] Impressão direta acionada pelo navegador, sem abrir novas abas.
        -   [x] Recibo inclui todos os dados da sessão: cliente, telefone, CPF, itens, totais e **forma de pagamento**.
    -   [x] **(NOVO) Página de Relatórios:**
        -   [x] Geração de relatórios de vendas por período (diário, semanal, mensal).
        -   [x] Visualização de totais, número de sessões e ticket médio.
        -   [x] Funcionalidade para **exportar o relatório completo em formato PDF**, com layout profissional para arquivamento e impressão.
-   [x] **Interface do Cliente (Ciclo Completo e Inteligente):**
    -   [x] **Login da Mesa:** Autenticação para iniciar uma sessão.
    -   [x] **Coleta de Dados do Cliente:** Formulário para inserir nome, telefone e CPF.
    -   [x] **Teclado Virtual Customizado (100% Integrado):**
        -   [x] Implementado em **todas** as telas de input do cliente, garantindo uma experiência consistente e adaptada para tablets.
    -   [x] **Cardápio Dinâmico:** Itens e categorias são exibidos ou bloqueados com base em regras de negócio (status, happy hour).
    -   [x] **Confirmação de Pedido Profissional:** Controle de quantidade, adição de observações e sugestões de acompanhamento.
    -   [x] **Conta do Cliente:**
        -   [x] **Chamado de Garçom:** Botão para solicitar atendimento, que notifica todas as telas da gerência em tempo real.
        -   [x] **Fechamento de Conta com Pagamento:** Ao encerrar a sessão, o funcionário registra a forma de pagamento (Dinheiro, Cartão ou PIX).
-   [x] **Comunicação em Tempo Real (WebSockets):**
    -   [x] Atualização automática do cardápio do cliente.
    -   [x] Notificação instantânea de chamados de garçom para a gerência.

### Próximos Passos (Roadmap):
-   [ ] **Cozinha:** Criar uma interface para a cozinha visualizar os pedidos que chegam em tempo real.
-   [ ] **Relatórios Avançados:** Aprimorar o dashboard com mais indicadores (ex: produtos mais vendidos, horários de pico).
-   [ ] **Logs de Auditoria:** Melhorar a interface de visualização dos logs para rastrear todas as ações importantes.
-   [ ] **Pagamentos:** Integrar um gateway de pagamento (PIX, cartão) diretamente na tela da conta do cliente.
-   [ ] **Deployment:** Preparar o sistema para ser hospedado em um servidor online.

---

## 🛠️ Tecnologias Utilizadas

*   **Backend:**
    *   [Node.js](https://nodejs.org/ ): Ambiente de execução JavaScript no servidor.
    *   [Express.js](https://expressjs.com/ ): Framework para a construção da API.
    *   [MySQL2](https://github.com/sidorares/node-mysql2 ): Driver para conectar o Node.js ao banco de dados MySQL.
    *   [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken ): Para geração e validação de tokens de autenticação.
    *   [bcryptjs](https://github.com/dcodeIO/bcrypt.js ): Para criptografia segura de senhas.
    *   [ws](https://github.com/websockets/ws ): Biblioteca para implementação de WebSockets.
    *   [jsPDF](https://github.com/parallax/jsPDF ) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable ): Para geração de relatórios em PDF no lado do cliente.

*   **Frontend:**
    *   HTML5, CSS3, JavaScript (Vanilla)
    *   [Font Awesome](https://fontawesome.com/ ): Para os ícones da interface.
    *   [SweetAlert2](https://sweetalert2.github.io/ ): Para notificações e modais elegantes.

*   **Banco de Dados:**
    *   [MySQL](https://www.mysql.com/ )

---

## ⚙️ Como Executar o Projeto Localmente

Para rodar este projeto em sua máquina, siga os passos abaixo.

### Pré-requisitos:
*   Ter o [Node.js](https://nodejs.org/ ) instalado.
*   Ter um servidor [MySQL](https://www.mysql.com/ ) rodando localmente.

### 1. Configuração do Banco de Dados
-   Crie um banco de dados no seu MySQL com o nome `cardapio_db` (ou o nome que preferir).
-   Execute os scripts SQL necessários para criar todas as tabelas (`usuarios`, `mesas`, `categorias`, `produtos`, `sessoes_cliente`, `pedidos`, `chamados`, `logs`).
-   No arquivo `Backend/db.js`, configure suas credenciais do MySQL.
-   Crie um arquivo `.env` na pasta `Backend` e defina as variáveis `JWT_SECRET` e `REGISTER_SECRET_TOKEN`.

### 2. Instalação das Dependências
-   Navegue até a pasta `Backend` pelo terminal:
    ```bash
    cd Backend
    ```
-   Instale todas as dependências do Node.js:
    ```bash
    npm install
    ```

### 3. Iniciando o Servidor
-   Ainda no terminal, dentro da pasta `Backend`, execute o comando:
    ```bash
    node server.js
    ```
-   Se tudo estiver correto, você verá mensagens indicando que o servidor está rodando na porta 3000.

### 4. Acessando o Sistema
-   **Painel de Gerenciamento:** Abra seu navegador e acesse `http://localhost:3000/login-gerencia`
-   **Interface do Cliente:** Abra outra aba e acesse `http://localhost:3000/login`
