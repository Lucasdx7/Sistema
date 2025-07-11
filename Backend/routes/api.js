// /Backend/routes/api.js

const express = require('express');
const router = express.Router();
// Importa apenas a função 'query'
const { query } = require('../db');

// --- ROTAS DE CATEGORIAS ---

router.get('/categorias', async (req, res) => {
    try {
        const categorias = await query('SELECT * FROM categorias ORDER BY ordem ASC, nome ASC');
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar categorias', error });
    }
});

router.post('/categorias/ordenar', async (req, res) => {
    try {
        const { ordem } = req.body;
        if (!Array.isArray(ordem)) {
            return res.status(400).json({ message: 'O corpo da requisição deve ser um array de IDs.' });
        }
        const queries = ordem.map((id, index) => {
            return query('UPDATE categorias SET ordem = ? WHERE id = ?', [index, id]);
        });
        await Promise.all(queries);
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(200).json({ message: 'Ordem das categorias atualizada com sucesso.' });
    } catch (error) {
        console.error("Erro ao ordenar categorias:", error);
        res.status(500).json({ message: 'Erro ao salvar a nova ordem', error });
    }
});

router.post('/categorias', async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
        const result = await query('INSERT INTO categorias (nome) VALUES (?)', [nome]);
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(201).json({ id: result.insertId, nome });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar categoria', error });
    }
});

router.delete('/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM categorias WHERE id = ?', [id]);
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(200).json({ message: 'Categoria deletada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar categoria', error });
    }
});


// --- ROTAS DE PRODUTOS ---

router.get('/categorias/:id/produtos', async (req, res) => {
    try {
        const { id } = req.params;
        const produtos = await query('SELECT * FROM produtos WHERE id_categoria = ? ORDER BY nome ASC', [id]);
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar produtos', error });
    }
});

router.post('/produtos', async (req, res) => {
    try {
        const { id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas } = req.body;
        if (!id_categoria || !nome || !descricao || !preco) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }
        const result = await query(
            'INSERT INTO produtos (id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas) VALUES (?, ?, ?, ?, ?, ?)',
            [id_categoria, nome, descricao, preco, imagem_svg || null, serve_pessoas || 1]
        );
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        console.error("ERRO AO ADICIONAR PRODUTO:", error);
        res.status(500).json({ message: 'Erro ao adicionar produto', error: error.message });
    }
});

router.delete('/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM produtos WHERE id = ?', [id]);
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(200).json({ message: 'Produto deletado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar produto', error });
    }
});

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
        console.error("Erro ao buscar todos os produtos:", error);
        res.status(500).json({ message: 'Erro ao buscar todos os produtos', error: error.message });
    }
});

module.exports = router;
