// /Backend/routes/api.js
const express = require('express');
const router = express.Router();
const { query, registrarLog } = require('../db');

// Função de middleware para verificar se o usuário está logado antes de registrar o log
const checarUsuarioParaLog = (req, res, next) => {
    if (!req.usuario || !req.usuario.id || !req.usuario.nome) {
        // Isso é uma falha de segurança ou de lógica interna, não deveria acontecer se o protegerRota estiver funcionando.
        console.error("Tentativa de ação de log sem um usuário autenticado.");
        // Interrompe a requisição para evitar mais erros.
        return res.status(500).json({ message: "Erro interno: informações do usuário ausentes." });
    }
    next(); // Se o usuário existir, continua para a próxima função (a rota em si).
};

// --- ROTAS DE CATEGORIAS ---

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

// GET /logs
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

module.exports = router;
