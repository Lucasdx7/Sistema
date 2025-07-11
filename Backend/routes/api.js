const express = require('express');
const router = express.Router();
const { query, registrarLog } = require('../db');
const bcrypt = require('bcryptjs');

// --- Middleware de verificação (sem alterações) ---
const checarUsuarioParaLog = (req, res, next) => {
    if (!req.usuario || !req.usuario.id || !req.usuario.nome) {
        console.error("Tentativa de ação de log sem um usuário autenticado.");
        return res.status(500).json({ message: "Erro interno: informações do usuário ausentes." });
    }
    next();
};

// --- ROTAS DE CATEGORIAS ---
// (Seu código de categorias permanece o mesmo, sem alterações)
// GET /categorias
router.get('/categorias', async (req, res) => {
    try {
        const categorias = await query('SELECT * FROM categorias ORDER BY ordem ASC, nome ASC');
        res.json(categorias);
    } catch (error) {
        console.error("Erro em GET /categorias:", error);
        res.status(500).json({ message: 'Erro ao buscar categorias', error: error.message });
    }
});

// POST /categorias/ordenar
router.post('/categorias/ordenar', checarUsuarioParaLog, async (req, res) => {
    try {
        const { ordem } = req.body;
        if (!Array.isArray(ordem)) return res.status(400).json({ message: 'O corpo da requisição deve ser um array de IDs.' });
        
        const queries = ordem.map((id, index) => query('UPDATE categorias SET ordem = ? WHERE id = ?', [index, id]));
        await Promise.all(queries);

        await registrarLog(req.usuario.id, req.usuario.nome, 'ORDENOU_CATEGORIAS', `O usuário reordenou as categorias.`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(200).json({ message: 'Ordem das categorias atualizada com sucesso.' });
    } catch (error) {
        console.error("Erro em POST /categorias/ordenar:", error);
        res.status(500).json({ message: 'Erro ao salvar a nova ordem', error: error.message });
    }
});

// POST /categorias
router.post('/categorias', checarUsuarioParaLog, async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
        
        const result = await query('INSERT INTO categorias (nome) VALUES (?)', [nome]);

        await registrarLog(req.usuario.id, req.usuario.nome, 'CRIOU_CATEGORIA', `Criou a categoria '${nome}' (ID: ${result.insertId}).`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(201).json({ id: result.insertId, nome });
    } catch (error) {
        console.error("Erro em POST /categorias:", error);
        res.status(500).json({ message: 'Erro ao adicionar categoria', error: error.message });
    }
});

// DELETE /categorias/:id
router.delete('/categorias/:id', checarUsuarioParaLog, async (req, res) => {
    try {
        const { id } = req.params;
        const categoria = await query('SELECT nome FROM categorias WHERE id = ?', [id]);
        const nomeCategoria = categoria.length > 0 ? categoria[0].nome : `ID ${id}`;

        await query('DELETE FROM categorias WHERE id = ?', [id]);

        await registrarLog(req.usuario.id, req.usuario.nome, 'DELETOU_CATEGORIA', `Deletou a categoria '${nomeCategoria}'.`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(200).json({ message: 'Categoria deletada com sucesso.' });
    } catch (error) {
        console.error("Erro em DELETE /categorias/:id:", error);
        res.status(500).json({ message: 'Erro ao deletar categoria', error: error.message });
    }
});


// --- ROTAS DE PRODUTOS ---
// (Seu código de produtos permanece o mesmo, sem alterações)
// GET /categorias/:id/produtos
router.get('/categorias/:id/produtos', async (req, res) => {
    try {
        const { id } = req.params;
        const produtos = await query('SELECT * FROM produtos WHERE id_categoria = ? ORDER BY nome ASC', [id]);
        res.json(produtos);
    } catch (error) {
        console.error("Erro em GET /categorias/:id/produtos:", error);
        res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
    }
});

// POST /produtos
router.post('/produtos', checarUsuarioParaLog, async (req, res) => {
    try {
        const { id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas } = req.body;
        if (!id_categoria || !nome || !descricao || !preco === undefined) return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        
        const result = await query(
            'INSERT INTO produtos (id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas) VALUES (?, ?, ?, ?, ?, ?)',
            [id_categoria, nome, descricao, preco, imagem_svg || null, serve_pessoas || 1]
        );

        await registrarLog(req.usuario.id, req.usuario.nome, 'CRIOU_PRODUTO', `Criou o produto '${nome}' (ID: ${result.insertId}).`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error("Erro em POST /produtos:", error);
        res.status(500).json({ message: 'Erro ao adicionar produto', error: error.message });
    }
});

// DELETE /produtos/:id
router.delete('/produtos/:id', checarUsuarioParaLog, async (req, res) => {
    try {
        const { id } = req.params;
        const produto = await query('SELECT nome FROM produtos WHERE id = ?', [id]);
        const nomeProduto = produto.length > 0 ? produto[0].nome : `ID ${id}`;

        await query('DELETE FROM produtos WHERE id = ?', [id]);

        await registrarLog(req.usuario.id, req.usuario.nome, 'DELETOU_PRODUTO', `Deletou o produto '${nomeProduto}'.`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(200).json({ message: 'Produto deletado com sucesso.' });
    } catch (error) {
        console.error("Erro em DELETE /produtos/:id:", error);
        res.status(500).json({ message: 'Erro ao deletar produto', error: error.message });
    }
});

// GET /produtos/todos
router.get('/produtos/todos', async (req, res) => {
    try {
        const sql = `
            SELECT p.*, c.nome AS nome_categoria 
            FROM produtos p
            JOIN categorias c ON p.id_categoria = c.id
            ORDER BY c.ordem, p.nome;
        `;
        const produtos = await query(sql);
        res.json(produtos);
    } catch (error) {
        console.error("Erro em GET /produtos/todos:", error);
        res.status(500).json({ message: 'Erro ao buscar todos os produtos', error: error.message });
    }
});

// --- ROTA DE LOGS ---
// (Seu código de logs permanece o mesmo, sem alterações)
router.get('/logs', checarUsuarioParaLog, async (req, res) => {
    if (req.usuario.nivel_acesso !== 'geral') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const logs = await query('SELECT * FROM logs ORDER BY data_hora DESC LIMIT 100');
        res.json(logs);
    } catch (error) {
        console.error("Erro em GET /logs:", error);
        res.status(500).json({ message: 'Erro ao buscar logs', error: error.message });
    }
});


// ==================================================================
// ROTAS PARA GERENCIAMENTO DE MESAS (VERSÃO CORRIGIDA E MELHORADA)
// ==================================================================

// GET /mesas - Rota para buscar todas as mesas cadastradas
router.get('/mesas', checarUsuarioParaLog, async (req, res) => {
    try {
        const mesas = await query('SELECT id, nome_usuario, criado_em FROM mesas ORDER BY nome_usuario');
        res.json(mesas);
    } catch (error) {
        console.error('Erro ao buscar mesas:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar mesas.' });
    }
});

// POST /mesas - Rota para adicionar uma nova mesa
router.post('/mesas', checarUsuarioParaLog, async (req, res) => {
    const { nome_usuario, senha } = req.body;

    if (!nome_usuario || !senha) {
        return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const result = await query(
            'INSERT INTO mesas (nome_usuario, senha) VALUES (?, ?)',
            [nome_usuario, senhaHash]
        );
        
        // Registra a ação no log do sistema
        await registrarLog(req.usuario.id, req.usuario.nome, 'CRIOU_MESA', `Criou a mesa '${nome_usuario}'.`);
        
        res.status(201).json({
            id: result.insertId,
            nome_usuario: nome_usuario
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este nome de mesa já está em uso.' });
        }
        console.error('Erro ao criar mesa:', error);
        res.status(500).json({ message: 'Erro no servidor ao criar mesa.' });
    }
});

// DELETE /mesas/:id - Rota para remover uma mesa
router.delete('/mesas/:id', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    try {
        // Busca o nome da mesa antes de deletar, para usar no log
        const mesa = await query('SELECT nome_usuario FROM mesas WHERE id = ?', [id]);
        const nomeMesa = mesa.length > 0 ? mesa[0].nome_usuario : `ID ${id}`;

        const result = await query('DELETE FROM mesas WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Mesa não encontrada.' });
        }

        // Registra a ação no log do sistema
        await registrarLog(req.usuario.id, req.usuario.nome, 'DELETOU_MESA', `Deletou a mesa '${nomeMesa}'.`);

        res.status(200).json({ message: 'Mesa removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover mesa:', error);
        res.status(500).json({ message: 'Erro no servidor ao remover mesa.' });
    }
});


// ==================================================================
// ROTA PARA INICIAR UMA NOVA SESSÃO DE CLIENTE
// ==================================================================
router.post('/sessoes/iniciar', async (req, res) => {
    // O 'req.usuario' aqui vem do token JWT da MESA que foi logada.
    // Ele contém o id e o nome da mesa.
    const id_mesa = req.usuario.id; 
    const { nome, telefone, cpf } = req.body;

    if (!nome) {
        return res.status(400).json({ message: 'O nome do cliente é obrigatório.' });
    }

    try {
        // Insere a nova sessão na tabela sessoes_cliente
        const result = await query(
            'INSERT INTO sessoes_cliente (id_mesa, nome_cliente, telefone_cliente, cpf_cliente) VALUES (?, ?, ?, ?)',
            [id_mesa, nome, telefone || null, cpf || null]
        );

        const novaSessaoId = result.insertId;

        // Retorna o ID da nova sessão para o frontend.
        // Isso é crucial para vincular os pedidos a esta sessão específica.
        res.status(201).json({
            message: 'Sessão iniciada com sucesso!',
            sessaoId: novaSessaoId,
            nomeCliente: nome
        });

    } catch (error) {
        console.error('Erro ao iniciar sessão:', error);
        res.status(500).json({ message: 'Erro no servidor ao iniciar a sessão do cliente.' });
    }
});

// ==================================================================
// ROTA PARA VISUALIZAR O STATUS ATUAL DE TODAS AS MESAS
// ==================================================================
router.get('/mesas/status', checarUsuarioParaLog, async (req, res) => {
    try {
        // Este comando SQL é mais complexo:
        // 1. Pega todas as mesas da tabela `mesas`.
        // 2. Usa um LEFT JOIN para buscar uma sessão correspondente na tabela `sessoes_cliente`.
        // 3. A condição `sc.status = 'ativa'` garante que só pegamos a sessão se ela estiver em andamento.
        const sql = `
            SELECT 
                m.id, 
                m.nome_usuario,
                sc.id AS sessao_id,
                sc.nome_cliente,
                sc.data_inicio
            FROM 
                mesas m
            LEFT JOIN 
                sessoes_cliente sc ON m.id = sc.id_mesa AND sc.status = 'ativa'
            ORDER BY 
                m.nome_usuario;
        `;
        
        const statusMesas = await query(sql);
        res.json(statusMesas);

    } catch (error) {
        console.error('Erro ao buscar status das mesas:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar status das mesas.' });
    }
});


// ==================================================================
// ROTAS PARA PEDIDOS DO CLIENTE
// ==================================================================

router.post('/pedidos', checarUsuarioParaLog, async (req, res) => {
    // Pega os dados do corpo da requisição
    const { id_sessao, id_produto, preco_unitario } = req.body;

    // Validação rigorosa dos dados recebidos
    if (!id_sessao || !id_produto || preco_unitario === undefined || preco_unitario === null) {
        return res.status(400).json({ message: 'Dados do pedido incompletos ou inválidos. Faltam informações essenciais.' });
    }

    try {
        // Insere o novo pedido na tabela 'pedidos'
        const result = await query(
            'INSERT INTO pedidos (id_sessao, id_produto, preco_unitario, quantidade) VALUES (?, ?, ?, ?)',
            [id_sessao, id_produto, preco_unitario, 1] // Assumindo quantidade 1 por padrão
        );

        // Responde com sucesso e o ID do novo pedido criado
        res.status(201).json({ message: 'Produto adicionado ao pedido com sucesso!', pedidoId: result.insertId });

    } catch (error) {
        // Se houver um erro no banco de dados (ex: id_produto não existe), ele será capturado aqui
        console.error('Erro ao inserir pedido no banco de dados:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao tentar salvar o pedido.' });
    }
});

// GET /api/sessoes/:id/conta - Buscar os detalhes da conta de uma sessão (VERSÃO CORRIGIDA)
router.get('/sessoes/:id/conta', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params; // Pega o ID da sessão da URL

    // Log para ter certeza de que o ID está chegando corretamente
    console.log(`Buscando conta para a sessão com ID: ${id}`);

    // Validação para garantir que o ID não é nulo ou indefinido
    if (!id) {
        return res.status(400).json({ message: 'O ID da sessão é obrigatório.' });
    }

    try {
        const sql = `
            SELECT 
                p.id,
                p.quantidade,
                p.preco_unitario,
                prod.nome AS nome_produto,
                prod.imagem_svg
            FROM pedidos p
            JOIN produtos prod ON p.id_produto = prod.id
            WHERE p.id_sessao = ?
            ORDER BY p.data_pedido ASC;
        `;
        
        // --- CORREÇÃO APLICADA AQUI ---
        // Agora estamos passando o 'id' da sessão como parâmetro para a consulta.
        const pedidos = await query(sql, [id]);
        
        // Calcula o total com base nos pedidos retornados
        const total = pedidos.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);

        // Retorna os pedidos e o total formatado
        res.json({ pedidos, total: total.toFixed(2) });

    } catch (error) {
        // Se ainda ocorrer um erro, ele será logado com mais detalhes
        console.error(`Erro detalhado ao buscar conta da sessão [${id}]:`, error);
        res.status(500).json({ message: 'Erro no servidor ao buscar a conta.' });
    }
});

// /Backend/routes/api.js

// ==================================================================
// ROTA PARA BUSCAR O HISTÓRICO DE SESSÕES DE UMA MESA ESPECÍFICA
// ==================================================================
// /Backend/routes/api.js

// ==================================================================
// ROTA PARA BUSCAR O HISTÓRICO DE SESSÕES DE UMA MESA ESPECÍFICA (VERSÃO CORRIGIDA)
// ==================================================================
router.get('/mesas/:id/sessoes', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    try {
        // --- QUERY MELHORADA E CORRIGIDA ---
        // 1. Usamos crases (`) em volta de 'status' para evitar conflito com palavras reservadas do SQL.
        // 2. A subquery para calcular o total foi movida para dentro da lista de seleção.
        const sql = `
            SELECT 
                sc.id,
                sc.nome_cliente,
                sc.data_inicio,
                sc.data_fim,
                sc.\`status\`,
                (SELECT SUM(p.quantidade * p.preco_unitario) 
                 FROM pedidos p 
                 WHERE p.id_sessao = sc.id) AS total_gasto
            FROM sessoes_cliente sc
            WHERE sc.id_mesa = ?
            ORDER BY sc.data_inicio DESC;
        `;
        
        const sessoes = await query(sql, [id]);

        // O MySQL pode retornar o 'total_gasto' como uma string. Garantimos que seja um número.
        const sessoesFormatadas = sessoes.map(sessao => ({
            ...sessao,
            total_gasto: parseFloat(sessao.total_gasto) || 0
        }));

        res.json(sessoesFormatadas);

    } catch (error) {
        // Este log é crucial para o diagnóstico
        console.error(`Erro ao buscar sessões da mesa ID [${id}]:`, error);
        res.status(500).json({ message: 'Erro no servidor ao buscar o histórico da mesa.' });
    }
});

// ==================================================================
// ROTA PARA FECHAR A CONTA DE UMA SESSÃO (NOVA)
// ==================================================================
router.post('/sessoes/:id/fechar', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params; // id da sessão
    try {
        // Atualiza o status da sessão para 'finalizada' e define a data de término
        const result = await query(
            "UPDATE sessoes_cliente SET status = 'finalizada', data_fim = NOW() WHERE id = ? AND status = 'ativa'",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada ou já está finalizada.' });
        }

        // Log da ação
        await registrarLog(req.usuario.id, req.usuario.nome, 'FECHOU_SESSAO', `Fechou a sessão ID ${id}.`);

        res.json({ message: 'Conta fechada com sucesso!' });
    } catch (error) {
        console.error('Erro ao fechar sessão:', error);
        res.status(500).json({ message: 'Erro no servidor ao fechar a conta.' });
    }
});


// ==================================================================
// ROTA PARA FECHAR A CONTA DE UMA SESSÃO (VERSÃO SIMPLES E ESTÁVEL)
// ==================================================================
router.post('/sessoes/:id/fechar', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params; // id da sessão
    try {
        // Apenas atualiza o status da sessão no banco de dados
        const result = await query(
            "UPDATE sessoes_cliente SET status = 'finalizada', data_fim = NOW() WHERE id = ? AND status = 'ativa'",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada ou já está finalizada.' });
        }

        // A chamada ao WebSocket foi removida daqui
        
        await registrarLog(req.usuario.id, req.usuario.nome, 'FECHOU_SESSAO', `Fechou a sessão ID ${id}.`);
        res.json({ message: 'Conta fechada com sucesso!' });
    } catch (error) {
        console.error('Erro ao fechar sessão:', error);
        res.status(500).json({ message: 'Erro no servidor ao fechar a conta.' });
    }
});


module.exports = router;