# Sistema de Cardápio Digital - Skina 67

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow )
![Progresso](https://img.shields.io/badge/progresso-20%25-orange )
![Tecnologia](https://img.shields.io/badge/backend-Node.js%20%26%20Express-green )
![Tecnologia](https://img.shields.io/badge/frontend-HTML,%20CSS,%20JS-blue )
![Banco de Dados](https://img.shields.io/badge/database-MySQL-blueviolet )

Sistema de gerenciamento de cardápio digital projetado para o restaurante "Skina 67". A plataforma permite que a gerência administre o cardápio de forma dinâmica e que os clientes visualizem os produtos em tempo real.

## 📋 Visão Geral do Projeto

O objetivo deste sistema é modernizar a experiência do cliente e otimizar a gestão do cardápio. Ele é dividido em duas interfaces principais:

1.  **Painel de Gerenciamento:** Uma área administrativa onde o gerente do restaurante pode adicionar, remover e editar categorias e produtos do cardápio.
2.  **Cardápio do Cliente:** Uma interface visualmente agradável para os clientes navegarem pelas categorias e verem os detalhes dos produtos, como descrição, preço e para quantas pessoas serve.

O sistema utiliza WebSockets para garantir que qualquer alteração feita pelo gerente seja refletida **em tempo real** em todas as telas de clientes, sem a necessidade de recarregar a página.

---

## 🚀 Status Atual (Progresso: 20%)

O projeto está em sua fase inicial de desenvolvimento. A estrutura base e as funcionalidades essenciais foram implementadas.

### Funcionalidades Concluídas:
-   [x] **Backend:** Estrutura do servidor com Node.js e Express.
-   [x] **Banco de Dados:** Schema inicial com tabelas para `categorias` e `produtos` em MySQL.
-   [x] **API:** Endpoints para criar, ler e deletar categorias e produtos.
-   [x] **Painel de Gerenciamento:**
    -   [x] Adicionar e remover categorias.
    -   [x] Adicionar e remover produtos dentro de uma categoria selecionada.
    -   [x] Inserir nome, descrição, preço, imagem e para quantas pessoas um prato serve.
-   [x] **Cardápio do Cliente:**
    -   [x] Visualização dinâmica das categorias e produtos cadastrados.
    -   [x] Filtro de produtos por categoria.
-   [x] **Comunicação em Tempo Real:**
    -   [x] Atualização automática do cardápio do cliente quando o gerente faz alterações.
    -   [x] Atualização automática da lista de categorias no painel do gerente.

### Próximos Passos (Roadmap):
-   [ ] **Gerenciamento:** Implementar a funcionalidade de **EDITAR** categorias e produtos existentes.
-   [ ] **Cliente:** Adicionar produtos a um carrinho de compras.
-   [ ] **Cozinha:** Criar uma nova interface para a cozinha visualizar os pedidos feitos.
-   [ ] **Autenticação:** Sistema de login para o painel de gerenciamento.
-   [ ] **Melhorias de UI/UX:** Refinar o design e a usabilidade das interfaces.
-   [ ] **Deployment:** Preparar o sistema para ser hospedado em um servidor online.

---

## 🛠️ Tecnologias Utilizadas

*   **Backend:**
    *   [Node.js](https://nodejs.org/ ): Ambiente de execução JavaScript no servidor.
    *   [Express.js](https://expressjs.com/ ): Framework para a construção da API.
    *   [MySQL2](https://github.com/sidorares/node-mysql2 ): Driver para conectar o Node.js ao banco de dados MySQL.
    *   [ws](https://github.com/websockets/ws ): Biblioteca para implementação de WebSockets e comunicação em tempo real.
    *   [CORS](https://github.com/expressjs/cors ): Middleware para permitir requisições entre diferentes domínios.

*   **Frontend:**
    *   HTML5
    *   CSS3
    *   JavaScript (Vanilla)

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
-   Execute o script `database_schema.sql` (se você tiver um) para criar as tabelas `categorias` e `produtos`.
-   Abra o arquivo `Backend/routes/api.js` e configure suas credenciais do MySQL (usuário e senha) na constante `dbConfig`.

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
-   **Cardápio do Cliente:** Abra seu navegador e acesse [http://localhost:3000/cardapio](http://localhost:3000/cardapio )
-   **Painel de Gerenciamento:** Abra outra aba e acesse [http://localhost:3000/gerencia](http://localhost:3000/gerencia )

---
