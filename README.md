# Sistema de Gestão de Cardápio e Pedidos

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow ) ![Progresso](https://img.shields.io/badge/progresso-53%25-brightgreen ) ![Tecnologia](https://img.shields.io/badge/backend-Node.js%20%26%20Express-green ) ![Tecnologia](https://img.shields.io/badge/frontend-HTML,%20CSS,%20JS-blue ) ![Banco de Dados](https://img.shields.io/badge/database-MySQL-blueviolet )

Sistema de gerenciamento completo para restaurante, com foco em segurança, usabilidade e atualizações em tempo real. A plataforma permite que a gerência administre o cardápio e as mesas de forma dinâmica, enquanto os clientes realizam seus pedidos diretamente pelo tablet.

## 📋 Visão Geral do Projeto

O objetivo deste sistema é modernizar a experiência do cliente e otimizar a gestão do restaurante. Ele é dividido em duas interfaces principais:

1.  **Painel de Gerenciamento:** Uma área administrativa segura onde a equipe gerencial pode administrar o cardápio, cadastrar e visualizar o status das mesas, e acompanhar o histórico de sessões de clientes.
2.  **Interface do Cliente (Tablet):** Um sistema completo que guia o cliente desde o login da mesa, passando pela visualização do cardápio, montagem do pedido, até o fechamento da conta com a assistência de um funcionário.

O sistema utiliza WebSockets para garantir que qualquer alteração feita pela gerência (como no cardápio ou status de um item) seja refletida **em tempo real** em todas as telas de clientes, sem a necessidade de recarregar a página.

---

## 🚀 Status Atual (Progresso: 53%)

O projeto está em uma fase madura de desenvolvimento, com o fluxo completo de interação do cliente e as principais funcionalidades de gerenciamento implementadas e estáveis.

### Funcionalidades Concluídas:
-   [x] **Backend:** Estrutura do servidor com Node.js e Express.
-   [x] **Banco de Dados:** Schema robusto com tabelas para `usuarios`, `mesas`, `sessoes_cliente`, `pedidos`, `categorias` e `produtos`.
-   [x] **API Segura e Middleware Inteligente:**
    -   [x] Endpoints protegidos que exigem autenticação JWT para acesso.
    -   [x] Middleware de autenticação (`authMiddleware`) capaz de diferenciar tokens de **Gerência** e de **Mesa**.
-   [x] **Sistema de Autenticação Robusto:**
    -   [x] Telas de login separadas e seguras para **Gerência** (`/login-gerencia`) e **Mesas** (`/login`).
    -   [x] Criptografia de senhas no banco de dados (`bcryptjs`).
    -   [x] Logout seguro e com redirecionamento correto para cada tipo de usuário.
-   [x] **Painel de Gerenciamento (CRUD Completo):**
    -   [x] **Gestão de Cardápio:**
        -   [x] Adicionar, **Editar** e Remover categorias e produtos através de um modal dinâmico.
        -   [x] Ordenar categorias com drag-and-drop.
        -   [x] **Controle de Status:** Ativar e desativar categorias e produtos individualmente.
        -   [x] **Happy Hour:** Definir categorias como "Happy Hour" com horário de início e fim.
        -   [x] **NOVO: Sistema de Sugestões:** Marcar produtos específicos para serem sugeridos como acompanhamento na tela de confirmação do pedido.
    -   [x] **Gestão de Mesas:**
        -   [x] Cadastrar e remover mesas.
        -   [x] Painel interativo para visualizar o histórico de sessões de cada mesa.
        -   [x] Cancelar itens de pedidos de uma sessão ativa.
        -   [x] Identificação e fechamento de sessões ativas.
-   [x] **Interface do Cliente (Ciclo Completo e Inteligente):**
    -   [x] **Login da Mesa:** Autenticação para iniciar uma sessão.
    -   [x] **Cardápio Dinâmico com Regras de Negócio:**
        -   [x] Itens desativados pela gerência **não são exibidos**.
        -   [x] Categorias de "Happy Hour" fora do horário têm seus produtos bloqueados.
        -   [x] Botão de detalhes em cada produto para abrir um modal com informações ampliadas.
    -   [x] **Confirmação de Pedido Profissional:**
        -   [x] **NOVO: Controle de Quantidade:** Agrupar itens idênticos e permitir que o cliente aumente ou diminua a quantidade (`+` / `-`) diretamente na tela de resumo.
        -   [x] **NOVO: Modal de Observação:** Adicionar observações a cada grupo de itens através de um modal limpo e intuitivo, acionado por um ícone.
        -   [x] **NOVO: Sugestões de Acompanhamento:** Exibir até 3 produtos sugeridos em uma lista com rolagem vertical, com opções para adicionar ao pedido ou navegar para a categoria do item.
    -   [x] **Conta do Cliente:**
        -   [x] **NOVO: Agrupamento de Pedidos:** Visualização da conta com itens idênticos agrupados por quantidade (ex: "3x Coca-Cola"), incluindo itens cancelados.
        -   [x] Fechamento de conta seguro via modal.
-   [x] **Comunicação em Tempo Real:**
    -   [x] Atualização automática do cardápio do cliente quando o gerente faz alterações.

### Próximos Passos (Roadmap):
-   [ ] **Cozinha:** Criar uma interface para a cozinha visualizar os pedidos que chegam em tempo real.
-   [ ] **Relatórios:** Desenvolver um dashboard com indicadores de vendas para a gerência.
-   [ ] **Logs de Auditoria:** Aprimorar o sistema de logs para rastrear todas as ações importantes.
-   [ ] **Pagamentos:** Integrar um gateway de pagamento (PIX, cartão) na tela da conta.
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

*   **Frontend:**
    *   HTML5, CSS3, JavaScript (Vanilla)
    *   [Font Awesome](https://fontawesome.com/ ): Para os ícones da interface.

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
-   Execute os scripts SQL necessários para criar todas as tabelas.
-   **Importante:** Certifique-se de que sua tabela `produtos` contém a coluna `pode_ser_sugestao BOOLEAN DEFAULT FALSE`.
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
