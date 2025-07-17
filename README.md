# Sistema de Gestão de Cardápio e Pedidos

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow ) ![Progresso](https://img.shields.io/badge/progresso-87%25-brightgreen ) ![Tecnologia](https://img.shields.io/badge/backend-Node.js%20%26%20Express-green ) ![Tecnologia](https://img.shields.io/badge/frontend-HTML,%20CSS,%20JS-blue ) ![Banco de Dados](https://img.shields.io/badge/database-MySQL-blueviolet )

Sistema de gerenciamento completo para restaurantes, com foco em segurança, usabilidade e atualizações em tempo real. A plataforma permite que a gerência administre o cardápio, mesas e relatórios de forma dinâmica, enquanto os clientes realizam seus pedidos diretamente por um tablet na mesa.

## 📋 Visão Geral do Projeto

O objetivo deste sistema é modernizar a experiência do cliente e otimizar a gestão do restaurante. Ele é dividido em duas interfaces principais:

1.  **Painel de Gerenciamento:** Uma área administrativa segura onde a equipe gerencial pode administrar o cardápio, mesas, chamados de garçom, acompanhar o histórico de sessões e gerar relatórios de vendas.
2.  **Interface do Cliente (Tablet):** Um sistema completo que guia o cliente desde o login da mesa, passando pela visualização do cardápio, montagem do pedido, até o fechamento da conta com a assistência de um funcionário.

O sistema utiliza WebSockets para garantir que qualquer alteração feita pela gerência ou solicitação do cliente seja refletida **em tempo real** em todas as telas conectadas, sem a necessidade de recarregar a página.

---

## 🚀 Status Atual (Progresso: 87%)

O projeto está em uma fase madura de desenvolvimento, com o fluxo completo de interação do cliente e as principais funcionalidades de gerenciamento implementadas e estáveis.

### Funcionalidades Concluídas:
-   [x] **Backend:** Estrutura do servidor com Node.js e Express.
-   [x] **Banco de Dados:** Schema robusto com tabelas para `usuarios`, `mesas`, `sessoes_cliente`, `pedidos`, `categorias`, `produtos`, `chamados`, `logs` e `configuracoes`.
-   [x] **API Segura e Middleware Inteligente:**
    -   [x] Endpoints protegidos que exigem autenticação JWT para acesso.
    -   [x] Middleware de autenticação (`authMiddleware`) capaz de diferenciar tokens de **Gerência** e de **Mesa**.
    -   [x] **(NOVO)** Middleware de permissão (`checarNivelAcesso`) para controle granular de acesso às rotas da API, permitindo diferentes níveis de autorização para as mesmas funcionalidades.
-   [x] **Sistema de Autenticação Robusto:**
    -   [x] Telas de login separadas e seguras para **Gerência** e **Mesas**.
    -   [x] Criptografia de senhas no banco de dados (`bcryptjs`).
    -   [x] Logout seguro que não interfere em outras sessões ativas.
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
        -   [x] Botão para **limpar o histórico** de chamados já atendidos, mantendo a tela organizada.
    -   [x] **Geração de Recibos Profissionais:**
        -   [x] Geração de recibo com layout otimizado para **impressoras térmicas de 80mm**.
        -   [x] Impressão direta acionada pelo navegador, sem abrir novas abas.
        -   [x] Recibo inclui todos os dados da sessão: cliente, telefone, CPF, itens, totais e **forma de pagamento**.
    -   [x] **Página de Relatórios:**
        -   [x] Geração de relatórios de vendas por período (diário, semanal, mensal).
        -   [x] Visualização de totais, número de sessões e ticket médio.
        -   [x] Funcionalidade para **exportar o relatório completo em formato PDF**, com layout profissional para arquivamento e impressão.
-   [x] **(NOVO) Página de Configurações Avançadas:**
    -   [x] **Personalização de Aparência:** Alteração da fonte das páginas do cliente em tempo real.
    -   [x] **Relatório de Atividade de Funcionários:** Análise de desempenho individual por período (ações de criação, edição, deleção, etc.).
    -   [x] **Gestão de Permissões:** Controle dinâmico dos módulos que usuários do nível "Pedidos" podem acessar na tela inicial.
    -   [x] **Zona de Perigo:** Funcionalidade segura para **resetar o banco de dados** (exceto logs), protegida por chave de acesso secreta e com lógica robusta para lidar com chaves estrangeiras.
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
    -   [x] Atualização automática do cardápio e da **aparência** do cliente.
    -   [x] Notificação instantânea de chamados de garçom para a gerência.

### Próximos Passos (Roadmap):
-   [ ] **Cozinha:** Criar uma interface para a cozinha visualizar os pedidos que chegam em tempo real.
-   [ ] **Relatórios Avançados:** Aprimorar o dashboard com mais indicadores (ex: produtos mais vendidos, horários de pico).
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
    *   [dotenv](https://github.com/motdotla/dotenv ): Para gerenciamento de variáveis de ambiente.

*   **Frontend:**
    *   HTML5, CSS3, JavaScript (Vanilla)
    *   [Font Awesome](https://fontawesome.com/ ): Para os ícones da interface.
    *   [SweetAlert2](https://sweetalert2.github.io/ ): Para notificações e modais elegantes.
    *   [jsPDF](https://github.com/parallax/jsPDF ) & [html2canvas](https://html2canvas.hertzen.com/ ): Para geração de relatórios em PDF no lado do cliente.

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
-   Execute os scripts SQL necessários para criar todas as tabelas (`usuarios`, `mesas`, `categorias`, `produtos`, `sessoes_cliente`, `pedidos`, `chamados`, `logs`, `configuracoes`).
-   No arquivo `Backend/configurar/db.js`, configure suas credenciais do MySQL através das variáveis de ambiente.

### 2. Variáveis de Ambiente
-   Crie um arquivo `.env` na pasta `Backend`.
-   Defina as seguintes variáveis:
    ```env
    DB_HOST=localhost
    DB_USER=seu_usuario_mysql
    DB_PASSWORD=sua_senha_mysql
    DB_NAME=cardapio_db
    JWT_SECRET=sua_chave_secreta_para_jwt
    REGISTER_SECRET_TOKEN=sua_chave_para_registrar_novos_usuarios
    RESET_SECRET_KEY=sua_chave_secreta_para_resetar_o_banco
    ```

### 3. Instalação das Dependências
-   Navegue até a pasta `Backend` pelo terminal:
    ```bash
    cd Backend
    ```
-   Instale todas as dependências do Node.js:
    ```bash
    npm install
    ```

### 4. Iniciando o Servidor
-   Ainda no terminal, dentro da pasta `Backend`, execute o comando:
    ```bash
    node server.js
    ```
-   Se tudo estiver correto, você verá mensagens indicando que o servidor está rodando na porta 3000.

### 5. Acessando o Sistema
-   **Painel de Gerenciamento:** Abra seu navegador e acesse `http://localhost:3000/login-gerencia`
-   **Interface do Cliente:** Abra outra aba e acesse `http://localhost:3000/login`
