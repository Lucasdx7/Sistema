# Sistema de Gestão de Cardápio e Pedidos - Skina 67

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow )
![Progresso](https://img.shields.io/badge/progresso-25%25-orange )
![Tecnologia](https://img.shields.io/badge/backend-Node.js%20%26%20Express-green )
![Tecnologia](https://img.shields.io/badge/frontend-HTML,%20CSS,%20JS-blue )
![Banco de Dados](https://img.shields.io/badge/database-MySQL-blueviolet )

Sistema de gerenciamento completo para o restaurante "Skina 67", com foco em segurança, usabilidade e atualizações em tempo real. A plataforma permite que a gerência administre o cardápio de forma dinâmica e segura, enquanto os clientes visualizam os produtos instantaneamente.

## 📋 Visão Geral do Projeto

O objetivo deste sistema é modernizar a experiência do cliente e otimizar a gestão do restaurante. Ele é dividido em duas interfaces principais:

1.  **Painel de Gerenciamento:** Uma área administrativa segura, acessível apenas por login, onde a equipe gerencial pode administrar o cardápio, usuários e outras configurações do sistema.
2.  **Cardápio do Cliente:** Uma interface visualmente agradável para os clientes navegarem pelas categorias e verem os detalhes dos produtos, como descrição, preço e para quantas pessoas serve.

O sistema utiliza WebSockets para garantir que qualquer alteração feita pela gerência seja refletida **em tempo real** em todas as telas de clientes, sem a necessidade de recarregar a página.

---

## 🚀 Status Atual (Progresso: 25%)

O projeto está em sua fase inicial, com a fundação de segurança e as funcionalidades essenciais do cardápio já implementadas.

### Funcionalidades Concluídas:
-   [x] **Backend:** Estrutura do servidor com Node.js e Express.
-   [x] **Banco de Dados:** Schema com tabelas para `usuarios`, `categorias` e `produtos`.
-   [x] **API Segura:** Endpoints protegidos que exigem autenticação para acesso.
-   [x] **Sistema de Autenticação e Permissões:**
    -   [x] Tela de login para acesso ao painel.
    -   [x] Registro de novos gerentes protegido por um código secreto.
    -   [x] Criptografia de senhas no banco de dados (`bcrypt`).
    -   [x] Autenticação baseada em Tokens JWT.
    -   [x] Controle de acesso com dois níveis: **Gerente Geral** (acesso total) e **Gerente de Pedidos** (acesso limitado).
-   [x] **Painel de Gerenciamento:**
    -   [x] Adicionar e remover categorias.
    -   [x] **Ordenação de Categorias:** Interface de "arrastar e soltar" (Drag and Drop) para reordenar o menu de forma intuitiva.
    -   [x] Adicionar e remover produtos (com nome, descrição, preço, imagem e "serve pessoas").
    -   [x] Menu de perfil do usuário com informações e botão de "Sair".
-   [x] **Cardápio do Cliente:**
    -   [x] Visualização dinâmica do cardápio com base na ordem definida pelo gerente.
    -   [x] Filtro de produtos por categoria.
-   [x] **Comunicação em Tempo Real:**
    -   [x] Atualização automática do cardápio do cliente quando o gerente faz alterações.
    -   [x] Sincronização entre as telas de diferentes gerentes.

### Próximos Passos (Roadmap):
-   [ ] **Gerenciamento:** Implementar a funcionalidade de **EDITAR** categorias e produtos existentes.
-   [ ] **Pedidos:** Criar a interface para acompanhamento de pedidos em tempo real.
-   [ ] **Relatórios:** Desenvolver o dashboard com indicadores de vendas para o Gerente Geral.
-   [ ] **Configurações:** Implementar a tela de configurações do sistema.
-   [ ] **Logs de Auditoria:** Reintroduzir o sistema de logs para rastrear ações dos usuários.
-   [ ] **Deployment:** Preparar o sistema para ser hospedado em um servidor online.

---

## 🛠️ Tecnologias Utilizadas

*   **Backend:**
    *   [Node.js](https://nodejs.org/ ): Ambiente de execução JavaScript no servidor.
    *   [Express.js](https://expressjs.com/ ): Framework para a construção da API.
    *   [MySQL2](https://github.com/sidorares/node-mysql2 ): Driver para conectar o Node.js ao banco de dados MySQL.
    *   [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken ): Para geração e validação de tokens de autenticação.
    *   [bcrypt](https://github.com/kelektiv/node.bcrypt.js ): Para criptografia segura de senhas.
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
-   Execute os scripts SQL abaixo para criar as tabelas `usuarios`, `categorias` e `produtos`.
-   Abra o arquivo `Backend/db.js` e configure suas credenciais do MySQL (usuário e senha) na constante `dbConfig`.
-   Abra o arquivo `Backend/routes/auth.js` e, se desejar, altere o valor do `REGISTRO_TOKEN_SECRETO`.

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
-   **Painel de Gerenciamento:** Abra seu navegador e acesse [http://localhost:3000/login](http://localhost:3000/login )
-   **Cardápio do Cliente:** Abra outra aba e acesse [http://localhost:3000/cardapio](http://localhost:3000/cardapio )



