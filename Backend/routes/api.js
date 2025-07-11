// /Backend/routes/api.js
const express = require('express');
const router = express.Router();
// 1. Importe a nova função
const { query, registrarLog } = require('../db');

// --- ROTAS DE CATEGORIAS ---

router.post('/categorias/ordenar', async (req, res) => {
    try {
        const { ordem } = req.body;
        if (!Array.isArray(ordem)) return res.status(400).json({ message: 'O corpo da requisição deve ser um array de IDs.' });
        
        const queries = ordem.map((id, index) => query('UPDATE categorias SET ordem = ? WHERE id = ?', [index, id]));
        await Promise.all(queries);

        // 2. Registra o log
        await registrarLog(req.usuario.id, req.usuario.nome, 'ORDENOU_CATEGORIAS', `O usuário reordenou as categorias.`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(200).json({ message: 'Ordem das categorias atualizada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao salvar a nova ordem', error });
    }
});

router.post('/categorias', async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
        
        const result = await query('INSERT INTO categorias (nome) VALUES (?)', [nome]);

        // 2. Registra o log
        await registrarLog(req.usuario.id, req.usuario.nome, 'CRIOU_CATEGORIA', `Criou a categoria '${nome}' (ID: ${result.insertId}).`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(201).json({ id: result.insertId, nome });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar categoria', error });
    }
});

router.delete('/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Pega o nome da categoria ANTES de deletar para usar no log
        const categoria = await query('SELECT nome FROM categorias WHERE id = ?', [id]);
        const nomeCategoria = categoria.length > 0 ? categoria[0].nome : `ID ${id}`;

        await query('DELETE FROM categorias WHERE id = ?', [id]);

        // 2. Registra o log
        await registrarLog(req.usuario.id, req.usuario.nome, 'DELETOU_CATEGORIA', `Deletou a categoria '${nomeCategoria}'.`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(200).json({ message: 'Categoria deletada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar categoria', error });
    }
});

// --- ROTAS DE PRODUTOS ---

router.post('/produtos', async (req, res) => {
    try {
        const { id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas } = req.body;
        if (!id_categoria || !nome || !descricao || !preco) return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        
        const result = await query(
            'INSERT INTO produtos (id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas) VALUES (?, ?, ?, ?, ?, ?)',
            [id_categoria, nome, descricao, preco, imagem_svg || null, serve_pessoas || 1]
        );

        // 2. Registra o log
        await registrarLog(req.usuario.id, req.usuario.nome, 'CRIOU_PRODUTO', `Criou o produto '${nome}' (ID: ${result.insertId}).`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar produto', error: error.message });
    }
});

router.delete('/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const produto = await query('SELECT nome FROM produtos WHERE id = ?', [id]);
        const nomeProduto = produto.length > 0 ? produto[0].nome : `ID ${id}`;

        await query('DELETE FROM produtos WHERE id = ?', [id]);

        // 2. Registra o log
        await registrarLog(req.usuario.id, req.usuario.nome, 'DELETOU_PRODUTO', `Deletou o produto '${nomeProduto}'.`);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(200).json({ message: 'Produto deletado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar produto', error });
    }
});

// Outras rotas (GET /categorias, GET /produtos, etc.) não precisam de alterações...

// --- 3. NOVA ROTA PARA BUSCAR OS LOGS ---
router.get('/logs', async (req, res) => {
    // Garante que apenas o gerente geral possa ver os logs
    if (req.usuario.nivel_acesso !== 'geral') {
        return res.status(403).json({ message: 'Acesso negado. Apenas o Gerente Geral pode ver os logs.' });
    }
    try {
        const logs = await query('SELECT * FROM logs ORDER BY data_hora DESC LIMIT 100'); // Limita aos últimos 100 logs
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar logs', error });
    }
});

module.exports = router;
