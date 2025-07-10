// routes/api.js
const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Configuração da conexão com o banco de dados
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12qw34as@ZX', // Sua senha do MySQL
    database: 'cardapio_db'
};

// Função helper para executar queries
async function query(sql, params) {
    const connection = await mysql.createConnection(dbConfig);
    const [results, ] = await connection.execute(sql, params);
    await connection.end();
    return results;
}

// --- ROTAS DE CATEGORIAS ---

// GET: Obter todas as categorias
router.get('/categorias', async (req, res) => {
    try {
        const categorias = await query('SELECT * FROM categorias ORDER BY nome ASC');
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar categorias', error });
    }
});

// POST: Adicionar nova categoria
router.post('/categorias', async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
        
        const result = await query('INSERT INTO categorias (nome) VALUES (?)', [nome]);
        
        // AVISA OS CLIENTES QUE O CARDÁPIO MUDOU
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });

        res.status(201).json({ id: result.insertId, nome });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar categoria', error });
    }
});

// DELETE: Deletar uma categoria
router.delete('/categorias/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM categorias WHERE id = ?', [id]);

        // AVISA OS CLIENTES QUE O CARDÁPIO MUDOU
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });

        res.status(200).json({ message: 'Categoria deletada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar categoria', error });
    }
});


// --- ROTAS DE PRODUTOS ---

// GET: Obter produtos de uma categoria específica
router.get('/categorias/:id/produtos', async (req, res) => {
    try {
        const { id } = req.params;
        const produtos = await query('SELECT * FROM produtos WHERE id_categoria = ? ORDER BY nome ASC', [id]);
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar produtos', error });
    }
});

// POST: Adicionar novo produto a uma categoria
router.post('/produtos', async (req, res) => {
    try {
        // 1. Pega o novo campo do corpo da requisição
        const { id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas } = req.body;

        if (!id_categoria || !nome || !descricao || !preco) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        }
        
        // 2. GARANTA QUE A QUERY SQL ESTÁ CORRETA
        // A query deve listar 6 colunas e ter 6 '?' para os valores.
        const result = await query(
            'INSERT INTO produtos (id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas) VALUES (?, ?, ?, ?, ?, ?)',
            [id_categoria, nome, descricao, preco, imagem_svg || null, serve_pessoas || 1]
        );

        // 3. Se a query acima falhar, esta linha nunca será executada.
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });

        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        // Se a query falhar, o código vem para cá.
        console.error("ERRO AO ADICIONAR PRODUTO:", error); // Isso aparecerá no terminal.
        res.status(500).json({ message: 'Erro ao adicionar produto', error: error.message });
    }
});

// DELETE: Deletar um produto
router.delete('/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await query('DELETE FROM produtos WHERE id = ?', [id]);

        // AVISA OS CLIENTES QUE O CARDÁPIO MUDOU
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });

        res.status(200).json({ message: 'Produto deletado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar produto', error });
    }
});

// GET: Obter todos os produtos com suas categorias
router.get('/produtos/todos', async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.*, 
                c.nome AS nome_categoria 
            FROM produtos p
            JOIN categorias c ON p.id_categoria = c.id
            ORDER BY c.nome, p.nome;
        `;
        const produtos = await query(sql);
        res.json(produtos);
    } catch (error) {
        console.error("Erro ao buscar todos os produtos:", error);
        res.status(500).json({ message: 'Erro ao buscar todos os produtos', error: error.message });
    }
});

module.exports = router;
