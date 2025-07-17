# Sistema de Gestão de Cardápio e Pedidos

![Status do Projeto](https://img.shields.io/badge/status-em%20desenvolvimento-yellow) ![Progresso](https://img.shields.io/badge/progresso-89%25-brightgreen) ![Tecnologia](https://img.shields.io/badge/backend-Node.js%20%26%20Express-green) ![Tecnologia](https://img.shields.io/badge/frontend-HTML,%20CSS,%20JS-blue) ![Banco de Dados](https://img.shields.io/badge/database-MySQL-blueviolet)

Sistema de gerenciamento completo para restaurantes, com foco em segurança, usabilidade e atualizações em tempo real. A plataforma permite que a gerência administre o cardápio, mesas e relatórios de forma dinâmica, enquanto os clientes realizam seus pedidos diretamente por um tablet na mesa.

## 📋 Visão Geral do Projeto

O objetivo deste sistema é modernizar a experiência do cliente e otimizar a gestão do restaurante. Ele é dividido em duas interfaces principais:

1.  **Painel de Gerenciamento:** Uma área administrativa segura onde a equipe gerencial pode administrar o cardápio, mesas, chamados de garçom, acompanhar o histórico de sessões e gerar relatórios de vendas.
2.  **Interface do Cliente (Tablet):** Um sistema completo que guia o cliente desde o login da mesa, passando pela visualização do cardápio, montagem do pedido, até o fechamento da conta com a assistência de um funcionário.

O sistema utiliza WebSockets para garantir que qualquer alteração feita pela gerência ou solicitação do cliente seja refletida **em tempo real** em todas as telas conectadas, sem a necessidade de recarregar a página.

---

## 🚀 Status Atual (Progresso: 89%)

O projeto está em uma fase madura de desenvolvimento, com o fluxo completo de interação do cliente e as principais funcionalidades de gerenciamento implementadas e estáveis.

### Funcionalidades Concluídas:
-   [x] **Backend:** Estrutura do servidor com Node.js e Express.
-   [x] **Banco de Dados:** Schema robusto com tabelas para `usuarios`, `mesas`, `sessoes_cliente`, `pedidos`, `categorias`, `produtos`, `chamados`, `logs` e `configuracoes`.
-   [x] **API Segura e Middleware Inteligente:**
    -   [x] Endpoints protegidos que exigem autenticação JWT para acesso.
    -   [x] Middleware de autenticação (`authMiddleware`) capaz de diferenciar tokens de **Gerência** e de **Mesa**.
    -   [x] Middleware de permissão (`checarNivelAcesso`) para controle granular de acesso às rotas da API.
-   [x] **Sistema de Autenticação Robusto:**
    -   [x] Telas de login separadas e seguras para **Gerência** e **Mesas**.
    -   [x] Rota de login da gerência flexível, aceitando tanto **email** quanto **nome de usuário**.
    -   [x] Criptografia de senhas no banco de dados (`bcryptjs`).
    -   [x] Logout seguro que não interfere em outras sessões ativas.
-   [x] **Painel de Gerenciamento (CRUD Completo):**
    -   [x] **Gestão de Cardápio:** Adicionar, editar, remover, ordenar e controlar status de categorias e produtos. Inclui sistema de sugestões e configuração de Happy Hour.
    -   [x] **Gestão de Mesas:**
        -   [x] Cadastrar e remover mesas.
        -   [x] Painel interativo para visualizar o histórico de sessões de cada mesa, com sessões **ativas** priorizadas no topo.
        -   [x] Exibição do **nome do funcionário** que finalizou cada sessão, para maior rastreabilidade.
        -   [x] Sistema robusto para **cancelamento parcial ou total** de itens de um pedido, com registro de motivo.
    -   [x] **Gestão de Chamados:**
        -   [x] Página dedicada para visualizar chamados de garçom em tempo real.
        -   [x] Contador de chamados pendentes no menu principal.
        -   [x] Funcionalidade para marcar um chamado como "Atendido" e limpar o histórico.
    -   [x] **Acompanhamento de Pedidos Profissional:**
        -   [x] Interface com design aprimorado para acompanhar o status dos pedidos de todas as mesas ativas.
        -   [x] Botão para **confirmar a entrega** de cada item, com registro de log para auditoria.
    -   [x] **Geração de Recibos Profissionais:**
        -   [x] Geração de recibo com layout otimizado para **impressoras térmicas de 80mm**.
        -   [x] Impressão direta acionada pelo navegador.
        -   [x] Recibo inclui todos os dados da sessão: cliente, telefone, CPF, itens, totais e forma de pagamento.
    -   [x] **Página de Logs com Filtros:**
        -   [x] Interface aprimorada com filtros para pesquisar logs por **data específica** e por **termo de busca** nos detalhes.
        -   [x] Rota de API otimizada para lidar com as consultas filtradas de forma eficiente.
-   [x] **(NOVO) Dashboard de Relatórios Avançados:**
    -   [x] **Visualização por Período:** Filtros dinâmicos para analisar vendas de **Hoje, Semana, Mês e Ano**.
    -   [x] **KPIs Abrangentes:** Métricas chave como Vendas Totais, Total de Pedidos, Ticket Médio e Produto Mais Vendido.
    -   [x] **Gráficos Inteligentes:**
        -   [x] **Vendas Durante o Período:** Gráfico de barras que **exibe todos os pontos de dados do período (meses, dias, etc.)**, mesmo aqueles com vendas zeradas, para uma visualização contínua e precisa.
        -   [x] **Vendas por Método de Pagamento:** Gráfico de rosca mostrando a distribuição entre Cartão, Dinheiro e PIX.
        -   [x] **Top 5 Produtos Mais Vendidos:** Gráfico de barras horizontais para fácil leitura.
        -   [x] **Horários de Pico de Vendas:** Gráfico de linha para identificar os horários de maior movimento.
    -   [x] **Backend Robusto:** A API de relatórios foi otimizada para ser compatível com o modo `sql_mode=only_full_group_by` do MySQL e para pré-processar os dados, garantindo que os gráficos sejam sempre completos.
-   [x] **Página de Configurações Avançadas:**
    -   [x] **Personalização de Aparência:** Alteração da fonte das páginas do cliente em tempo real.
    -   [x] **Relatório de Atividade de Funcionários Aprimorado:** Análise de desempenho individual por período, com métricas chave como **mesas fechadas** e **pedidos entregues**.
    -   [x] **Gestão de Permissões:** Controle dinâmico dos módulos que usuários do nível "Pedidos" podem acessar.
    -   [x] **Zona de Perigo:** Funcionalidade segura para **resetar o banco de dados**, protegida por chave de acesso.
-   [x] **Interface do Cliente (Ciclo Completo e Inteligente):**
    -   [x] Login da Mesa e Coleta de Dados do Cliente.
    -   [x] Teclado Virtual Customizado integrado em todas as telas de input.
    -   [x] Cardápio Dinâmico com regras de negócio (status, happy hour).
    -   [x] Confirmação de Pedido Profissional com observações e sugestões.
    -   [x] **Fechamento de Conta com Autorização de Funcionário:** O encerramento da sessão agora exige autenticação de um funcionário com **nome de usuário e senha**, aumentando a segurança.
-   [x] **Comunicação em Tempo Real (WebSockets):**
    -   [x] Atualização automática do cardápio e da aparência do cliente.
    -   [x] Notificação instantânea de chamados de garçom para a gerência.

### Próximos Passos (Roadmap):
-   [ ] **Cozinha:** Criar uma interface para a cozinha visualizar os pedidos que chegam em tempo real.
-   [ ] **Deployment:** Preparar o sistema para ser hospedado em um servidor online.

---

## 🛠️ Tecnologias Utilizadas

*   **Backend:**
    *   [Node.js](https://nodejs.org/): Ambiente de execução JavaScript no servidor.
    *   [Express.js](https://expressjs.com/): Framework para a construção da API.
    *   [MySQL2](https://github.com/sidorares/node-mysql2): Driver para conectar o Node.js ao banco de dados MySQL.
    *   [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken): Para geração e validação de tokens de autenticação.
    *   [bcryptjs](https://github.com/dcodeIO/bcrypt.js): Para criptografia segura de senhas.
    *   [ws](https://github.com/websockets/ws): Biblioteca para implementação de WebSockets.
    *   [dotenv](https://github.com/motdotla/dotenv): Para gerenciamento de variáveis de ambiente.

*   **Frontend:**
    *   HTML5, CSS3, JavaScript (Vanilla)
    *   [Chart.js](https://www.chartjs.org/): Para a criação dos gráficos de relatórios.
    *   [Font Awesome](https://fontawesome.com/): Para os ícones da interface.
    *   [SweetAlert2](https://sweetalert2.github.io/): Para notificações e modais elegantes.

*   **Banco de Dados:**
    *   [MySQL](https://www.mysql.com/)

---

## ⚙️ Como Executar o Projeto Localmente

Para rodar este projeto em sua máquina, siga os passos abaixo.

### Pré-requisitos:
*   Ter o [Node.js](https://nodejs.org/) instalado.
*   Ter um servidor [MySQL](https://www.mysql.com/) rodando localmente.

### 1. Configuração do Banco de Dados
-   Crie um banco de dados no seu MySQL com o nome `cardapio_db` (ou o nome que preferir).
-   Execute o script SQL abaixo para criar e configurar todas as tabelas necessárias. Este script consolidado já inclui todas as criações, alterações e inserções iniciais.

```sql
-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS cardapio_db;
USE cardapio_db;

-- Tabela de Mesas (deve ser criada antes de sessoes_cliente e chamados)
CREATE TABLE IF NOT EXISTS mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome_usuario VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    is_happy_hour BOOLEAN NOT NULL DEFAULT FALSE,
    happy_hour_inicio TIME NULL,
    happy_hour_fim TIME NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT NOT NULL,
    descricao_detalhada TEXT NULL DEFAULT NULL,
    preco DECIMAL(10, 2) NOT NULL,
    imagem_svg LONGTEXT,
    serve_pessoas INT DEFAULT 1,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    pode_ser_sugestao BOOLEAN NOT NULL DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_categoria) REFERENCES categorias(id) ON DELETE CASCADE
);

-- Tabela de Usuários (Gerência)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    usuario VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nivel_acesso ENUM('geral', 'pedidos') NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Sessões de Cliente
CREATE TABLE IF NOT EXISTS sessoes_cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_mesa INT NOT NULL,
    nome_cliente VARCHAR(255) NOT NULL,
    telefone_cliente VARCHAR(20),
    cpf_cliente VARCHAR(14),
    status ENUM('ativa', 'finalizada', 'cancelada') DEFAULT 'ativa',
    forma_pagamento ENUM('dinheiro', 'cartao', 'pix') NULL,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP NULL,
    FOREIGN KEY (id_mesa) REFERENCES mesas(id) ON DELETE CASCADE
);

-- Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_sessao INT NOT NULL,
    id_produto INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    motivo_cancelamento TEXT NULL DEFAULT NULL,
    observacao TEXT NULL DEFAULT NULL,
    data_pedido DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_sessao) REFERENCES sessoes_cliente(id) ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de Chamados de Garçom
CREATE TABLE IF NOT EXISTS chamados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_mesa INT NOT NULL,
    nome_mesa VARCHAR(255) NOT NULL,
    data_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pendente', 'atendido') NOT NULL DEFAULT 'pendente',
    FOREIGN KEY (id_mesa) REFERENCES mesas(id) ON DELETE CASCADE
);

-- Tabela de Configurações Gerais
CREATE TABLE IF NOT EXISTS configuracoes (
  chave VARCHAR(50) PRIMARY KEY,
  valor TEXT NOT NULL,
  ultima_modificacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Logs (Adicionada para auditoria)
CREATE TABLE IF NOT EXISTS logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nivel VARCHAR(20) NOT NULL,
    mensagem VARCHAR(255) NOT NULL,
    detalhes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserções Iniciais
INSERT INTO categorias (nome) VALUES ('Hambúrgueres'), ('Bebidas');
INSERT INTO produtos (id_categoria, nome, descricao, preco, imagem_svg) VALUES
(1, 'X-Skina', 'Hambúrguer da casa com 180g de carne, queijo e molho especial.', 35.90, '<svg>...</svg>'),
(2, 'Coca-Cola Lata', 'Refrigerante de cola 350ml.', 6.00, '<svg>...</svg>');
INSERT INTO usuarios (nome, email, usuario, senha, nivel_acesso)
VALUES ('Admin Geral', 'admin@skina67.com', 'admin', '$2b$10$abcdefghijklmnopqrstuv', 'geral');

```

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
    RESET_SECRET_TOKEN=sua_chave_secreta_para_resetar_o_banco
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


