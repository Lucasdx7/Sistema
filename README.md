# Sistema de Gestão de Cardápio e Pedidos

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow )
![Progresso](https://img.shields.io/badge/progresso-40%25-orange )
![Tecnologia](https://img.shields.io/badge/backend-Node.js%20%26%20Express-green )
![Tecnologia](https://img.shields.io/badge/frontend-HTML,%20CSS,%20JS-blue )
![Banco de Dados](https://img.shields.io/badge/database-MySQL-blueviolet )

Sistema de gerenciamento completo para restaurante, com foco em segurança, usabilidade e atualizações em tempo real. A plataforma permite que a gerência administre o cardápio e as mesas de forma dinâmica, enquanto os clientes realizam seus pedidos diretamente pelo tablet.

## 📋 Visão Geral do Projeto

O objetivo deste sistema é modernizar a experiência do cliente e otimizar a gestão do restaurante. Ele é dividido em duas interfaces principais:

1.  **Painel de Gerenciamento:** Uma área administrativa segura onde a equipe gerencial pode administrar o cardápio, cadastrar e visualizar o status das mesas, e acompanhar o histórico de sessões de clientes.
2.  **Interface do Cliente (Tablet):** Um sistema completo que guia o cliente desde o login da mesa, passando pela visualização do cardápio, montagem do pedido, até o fechamento da conta com a assistência de um funcionário.

O sistema utiliza WebSockets para garantir que qualquer alteração feita pela gerência (como no cardápio) seja refletida **em tempo real** em todas as telas de clientes, sem a necessidade de recarregar a página.

---

## 🚀 Status Atual (Progresso: 40%)

O projeto avançou significativamente, com a implementação completa do fluxo de pedidos do cliente, desde o login da mesa até o fechamento da conta.

### Funcionalidades Concluídas:
-   [x] **Backend:** Estrutura do servidor com Node.js e Express.
-   [x] **Banco de Dados:** Schema robusto com tabelas para `usuarios`, `mesas`, `sessoes_cliente`, `pedidos`, `categorias` e `produtos`.
-   [x] **API Segura:** Endpoints protegidos que exigem autenticação JWT para acesso.
-   [x] **Sistema de Autenticação e Permissões:**
    -   [x] Telas de login separadas para **Gerência** e **Mesas (Cliente)**.
    -   [x] Criptografia de senhas no banco de dados (`bcrypt`).
    -   [x] Autenticação baseada em Tokens JWT para ambos os tipos de acesso.
-   [x] **Painel de Gerenciamento:**
    -   [x] **Gestão de Cardápio:** Adicionar, remover e ordenar categorias e produtos.
    -   [x] **Gestão de Mesas:**
        -   [x] Cadastrar e remover mesas (com usuário e senha próprios).
        -   [x] Painel interativo para visualizar o histórico de sessões de cada mesa.
        -   [x] Identificação de sessões ativas e finalizadas.
-   [x] **Interface do Cliente (Tablet):**
    -   [x] **Login da Mesa:** Autenticação para iniciar uma sessão.
    -   [x] **Coleta de Dados:** Tela para identificação do cliente (nome, etc.).
    -   [x] **Cardápio Dinâmico:** Visualização de produtos e filtro por categorias.
    -   [x] **Carrinho de Pedidos:** Adição de itens para formar um pré-pedido.
    -   [x] **Confirmação de Pedido:** Tela de resumo para o cliente confirmar e enviar os itens para a cozinha.
    -   [x] **Conta do Cliente:** Visualização em tempo real de todos os pedidos feitos e do valor total da conta.
    -   [x] **Fechamento de Conta Seguro:** Implementação de um modal na tela da conta para que um funcionário, com as credenciais da mesa, possa encerrar a sessão e liberar o tablet para o próximo cliente.
-   [x] **Comunicação em Tempo Real:**
    -   [x] Atualização automática do cardápio do cliente quando o gerente faz alterações.

### Próximos Passos (Roadmap):
-   [ ] **Gerenciamento:** Implementar a funcionalidade de **EDITAR** categorias e produtos existentes.
-   [ ] **Cozinha:** Criar uma interface para a cozinha visualizar os pedidos que chegam em tempo real.
-   [ ] **Relatórios:** Desenvolver um dashboard com indicadores de vendas para a gerência.
-   [ ] **Logs de Auditoria:** Aprimorar o sistema de logs para rastrear todas as ações importantes (criação de pedidos, fechamento de contas, etc.).
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
-   Crie um banco de dados no seu MySQL com o nome `cardapio_db`.
-   Execute os scripts SQL necessários para criar todas as tabelas (`usuarios`, `mesas`, `sessoes_cliente`, `pedidos`, `categorias`, `produtos`, `logs`).
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
-   **Painel de Gerenciamento:** Abra seu navegador e acesse [http://localhost:3000/login-gerencia](http://localhost:3000/login-gerencia )
-   **Interface do Cliente:** Abra outra aba e acesse [http://localhost:3000/login](http://localhost:3000/login )
