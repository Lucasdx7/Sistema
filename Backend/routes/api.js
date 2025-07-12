const express = require('express');
const router = express.Router();
const { query, registrarLog } = require('../db');
const bcrypt = require('bcryptjs');

// --- Middleware de verificação ---
const checarUsuarioParaLog = (req, res, next) => {
    // Verifica se o objeto 'usuario' existe e tem um 'id'
    if (req.usuario && req.usuario.id) {
        // Agora, verifica de onde pegar o nome
        // Se for um gerente, pega de 'req.usuario.nome'
        // Se for uma mesa, pega de 'req.usuario.nome_usuario'
        if (req.usuario.nome || req.usuario.nome_usuario) {
            return next(); // Sucesso! Encontrou um nome válido.
        }
    }
    
    // Se qualquer uma das condições acima falhar, ele cai aqui.
    console.error("Tentativa de ação de log sem um usuário autenticado ou com informações incompletas.");
    return res.status(500).json({ message: "Erro interno: informações do usuário ausentes." });
};

// ==================================================================
// --- ROTAS DE CATEGORIAS ---
// ==================================================================

// GET /categorias
router.get('/categorias', async (req, res) => {
    try {
        const categorias = await query('SELECT * FROM categorias ORDER BY ordem ASC, nome ASC');
        res.json(categorias);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar categorias', error: error.message });
    }
});

// POST /categorias
router.post('/categorias', checarUsuarioParaLog, async (req, res) => {
    try {
        const { nome, is_happy_hour, happy_hour_inicio, happy_hour_fim } = req.body;
        if (!nome) return res.status(400).json({ message: 'O nome da categoria é obrigatório.' });
        
        const sql = 'INSERT INTO categorias (nome, is_happy_hour, happy_hour_inicio, happy_hour_fim) VALUES (?, ?, ?, ?)';
        const params = [
            nome, 
            is_happy_hour || false, 
            is_happy_hour ? happy_hour_inicio : null, 
            is_happy_hour ? happy_hour_fim : null
        ];
        
        const result = await query(sql, params);
        await registrarLog(req.usuario.id, req.usuario.nome, 'CRIOU_CATEGORIA', `Criou a categoria '${nome}' (ID: ${result.insertId}).`);
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar categoria', error: error.message });
    }
});

// PUT /categorias/:id (EDITAR)
router.put('/categorias/:id', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    const { nome, is_happy_hour, happy_hour_inicio, happy_hour_fim } = req.body;
    if (!nome) return res.status(400).json({ message: 'O nome é obrigatório.' });

    try {
        const sql = `UPDATE categorias SET nome = ?, is_happy_hour = ?, happy_hour_inicio = ?, happy_hour_fim = ? WHERE id = ?`;
        const params = [
            nome, 
            is_happy_hour || false, 
            is_happy_hour ? happy_hour_inicio : null, 
            is_happy_hour ? happy_hour_fim : null,
            id
        ];
        const result = await query(sql, params);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Categoria não encontrada.' });
        
        await registrarLog(req.usuario.id, req.usuario.nome, 'EDITOU_CATEGORIA', `Editou a categoria ID ${id}.`);
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.json({ message: 'Categoria atualizada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar categoria.', error: error.message });
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
        res.status(500).json({ message: 'Erro ao deletar categoria', error: error.message });
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
        res.status(500).json({ message: 'Erro ao salvar a nova ordem', error: error.message });
    }
});

// ==================================================================
// --- ROTAS DE PRODUTOS ---
// ==================================================================

// GET /categorias/:id/produtos
router.get('/categorias/:id/produtos', async (req, res) => {
    try {
        const { id } = req.params;
        const produtos = await query('SELECT * FROM produtos WHERE id_categoria = ? ORDER BY nome ASC', [id]);
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
    }
});

// GET /produtos/todos
router.get('/produtos/todos', async (req, res) => {
    try {
        const sql = `SELECT p.*, c.nome AS nome_categoria FROM produtos p JOIN categorias c ON p.id_categoria = c.id ORDER BY c.ordem, p.nome;`;
        const produtos = await query(sql);
        res.json(produtos);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar todos os produtos', error: error.message });
    }
});

// POST /produtos
router.post('/produtos', checarUsuarioParaLog, async (req, res) => {
    try {
        const { id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas } = req.body;
        if (!id_categoria || !nome || !descricao || preco === undefined) return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
        
        const result = await query(
            'INSERT INTO produtos (id_categoria, nome, descricao, preco, imagem_svg, serve_pessoas) VALUES (?, ?, ?, ?, ?, ?)',
            [id_categoria, nome, descricao, preco, imagem_svg || null, serve_pessoas || 1]
        );
        await registrarLog(req.usuario.id, req.usuario.nome, 'CRIOU_PRODUTO', `Criou o produto '${nome}' (ID: ${result.insertId}).`);
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar produto', error: error.message });
    }
});

// PUT /produtos/:id (EDITAR)
router.put('/produtos/:id', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, preco, serve_pessoas } = req.body;
    if (!nome || !descricao || preco === undefined || serve_pessoas === undefined) {
        return res.status(400).json({ message: 'Todos os campos do produto são obrigatórios.' });
    }
    try {
        const result = await query(
            'UPDATE produtos SET nome = ?, descricao = ?, preco = ?, serve_pessoas = ? WHERE id = ?',
            [nome, descricao, preco, serve_pessoas, id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Produto não encontrado.' });
        await registrarLog(req.usuario.id, req.usuario.nome, 'EDITOU_PRODUTO', `Editou o produto '${nome}' (ID: ${id}).`);
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.json({ message: 'Produto atualizado com sucesso!', id, ...req.body });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar o produto.', error: error.message });
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
        res.status(500).json({ message: 'Erro ao deletar produto', error: error.message });
    }
});

// ==================================================================
// --- ROTA PATCH PARA ATIVAR/DESATIVAR (TOGGLE) ---
// ==================================================================

const atualizarStatus = async (req, res, tipoTabela) => {
    const { id } = req.params;
    const { ativo } = req.body;
    if (ativo === undefined) return res.status(400).json({ message: "O status 'ativo' é obrigatório." });
    try {
        const sql = `UPDATE ${tipoTabela} SET ativo = ? WHERE id = ?`;
        const result = await query(sql, [ativo, id]);
        if (result.affectedRows === 0) {
            const tipoSingular = tipoTabela.slice(0, -1); 
            return res.status(404).json({ message: `${tipoSingular.charAt(0).toUpperCase() + tipoSingular.slice(1)} não encontrado(a).` });
        }
        if (req.usuario && registrarLog) {
            const nomeItem = tipoTabela.toUpperCase().slice(0, -1);
            const acao = ativo ? `ATIVOU_${nomeItem}` : `DESATIVOU_${nomeItem}`;
            await registrarLog(req.usuario.id, req.usuario.nome, acao, `Alterou o status do item ID ${id} em ${tipoTabela}.`);
        }
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.json({ message: 'Status atualizado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao atualizar status.', error: error.message });
    }
};

router.patch('/categorias/:id/status', checarUsuarioParaLog, (req, res) => {
    atualizarStatus(req, res, 'categorias');
});

router.patch('/produtos/:id/status', checarUsuarioParaLog, (req, res) => {
    atualizarStatus(req, res, 'produtos');
});

// ==================================================================
// --- ROTAS DE MESAS E SESSÕES ---
// ==================================================================

// GET /mesas
router.get('/mesas', checarUsuarioParaLog, async (req, res) => {
    try {
        const mesas = await query('SELECT id, nome_usuario, criado_em FROM mesas ORDER BY nome_usuario');
        res.json(mesas);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao buscar mesas.' });
    }
});

// POST /mesas
router.post('/mesas', checarUsuarioParaLog, async (req, res) => {
    const { nome_usuario, senha } = req.body;
    if (!nome_usuario || !senha) return res.status(400).json({ message: 'Nome de usuário e senha são obrigatórios.' });
    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);
        const result = await query('INSERT INTO mesas (nome_usuario, senha) VALUES (?, ?)', [nome_usuario, senhaHash]);
        await registrarLog(req.usuario.id, req.usuario.nome, 'CRIOU_MESA', `Criou a mesa '${nome_usuario}'.`);
        res.status(201).json({ id: result.insertId, nome_usuario: nome_usuario });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Este nome de mesa já está em uso.' });
        res.status(500).json({ message: 'Erro no servidor ao criar mesa.' });
    }
});

// DELETE /mesas/:id
router.delete('/mesas/:id', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    try {
        const mesa = await query('SELECT nome_usuario FROM mesas WHERE id = ?', [id]);
        const nomeMesa = mesa.length > 0 ? mesa[0].nome_usuario : `ID ${id}`;
        const result = await query('DELETE FROM mesas WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Mesa não encontrada.' });
        await registrarLog(req.usuario.id, req.usuario.nome, 'DELETOU_MESA', `Deletou a mesa '${nomeMesa}'.`);
        res.status(200).json({ message: 'Mesa removida com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao remover mesa.' });
    }
});

// GET /mesas/status
router.get('/mesas/status', checarUsuarioParaLog, async (req, res) => {
    try {
        const sql = `
            SELECT m.id, m.nome_usuario, sc.id AS sessao_id, sc.nome_cliente, sc.data_inicio
            FROM mesas m
            LEFT JOIN sessoes_cliente sc ON m.id = sc.id_mesa AND sc.status = 'ativa'
            ORDER BY m.nome_usuario;
        `;
        const statusMesas = await query(sql);
        res.json(statusMesas);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao buscar status das mesas.' });
    }
});

// GET /mesas/:id/sessoes
router.get('/mesas/:id/sessoes', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    try {
        const sql = `
            SELECT sc.id, sc.nome_cliente, sc.data_inicio, sc.data_fim, sc.\`status\`,
                   (SELECT SUM(p.quantidade * p.preco_unitario) FROM pedidos p WHERE p.id_sessao = sc.id) AS total_gasto
            FROM sessoes_cliente sc
            WHERE sc.id_mesa = ?
            ORDER BY sc.data_inicio DESC;
        `;
        const sessoes = await query(sql, [id]);
        const sessoesFormatadas = sessoes.map(s => ({ ...s, total_gasto: parseFloat(s.total_gasto) || 0 }));
        res.json(sessoesFormatadas);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao buscar o histórico da mesa.' });
    }
});

// POST /sessoes/iniciar
router.post('/sessoes/iniciar', async (req, res) => {
    const id_mesa = req.usuario.id; 
    const { nome, telefone, cpf } = req.body;
    if (!nome) return res.status(400).json({ message: 'O nome do cliente é obrigatório.' });
    try {
        const result = await query(
            'INSERT INTO sessoes_cliente (id_mesa, nome_cliente, telefone_cliente, cpf_cliente) VALUES (?, ?, ?, ?)',
            [id_mesa, nome, telefone || null, cpf || null]
        );
        res.status(201).json({ message: 'Sessão iniciada com sucesso!', sessaoId: result.insertId, nomeCliente: nome });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao iniciar a sessão do cliente.' });
    }
});

// GET /sessoes/:id/conta
router.get('/sessoes/:id/conta', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'O ID da sessão é obrigatório.' });
    try {
        const sql = `
            SELECT p.id, p.quantidade, p.preco_unitario, prod.nome AS nome_produto, prod.imagem_svg
            FROM pedidos p
            JOIN produtos prod ON p.id_produto = prod.id
            WHERE p.id_sessao = ?
            ORDER BY p.data_pedido ASC;
        `;
        const pedidos = await query(sql, [id]);
        const total = pedidos.reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);
        res.json({ pedidos, total: total.toFixed(2) });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao buscar a conta.' });
    }
});

// POST /sessoes/:id/fechar
router.post('/sessoes/:id/fechar', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await query("UPDATE sessoes_cliente SET status = 'finalizada', data_fim = NOW() WHERE id = ? AND status = 'ativa'", [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Sessão não encontrada ou já está finalizada.' });
        await registrarLog(req.usuario.id, req.usuario.nome, 'FECHOU_SESSAO', `Fechou a sessão ID ${id}.`);
        res.json({ message: 'Conta fechada com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao fechar a conta.' });
    }
});

// ==================================================================
// --- ROTAS DE PEDIDOS ---
// ==================================================================

router.post('/pedidos', checarUsuarioParaLog, async (req, res) => {
    const { id_sessao, id_produto, preco_unitario } = req.body;
    if (!id_sessao || !id_produto || preco_unitario === undefined) {
        return res.status(400).json({ message: 'Dados do pedido incompletos ou inválidos.' });
    }
    try {
        const result = await query(
            'INSERT INTO pedidos (id_sessao, id_produto, preco_unitario, quantidade) VALUES (?, ?, ?, ?)',
            [id_sessao, id_produto, preco_unitario, 1]
        );
        res.status(201).json({ message: 'Produto adicionado ao pedido com sucesso!', pedidoId: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Erro interno no servidor ao tentar salvar o pedido.' });
    }
});

// ==================================================================
// --- ROTA DE LOGS ---
// ==================================================================

router.get('/logs', checarUsuarioParaLog, async (req, res) => {
    if (req.usuario.nivel_acesso !== 'geral') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }
    try {
        const logs = await query('SELECT * FROM logs ORDER BY data_hora DESC LIMIT 100');
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar logs', error: error.message });
    }
});

// ==================================================================
// --- ROTA OTIMIZADA PARA O CARDÁPIO DO CLIENTE ---
// ==================================================================
router.get('/cardapio-completo', async (req, res) => {
    try {
        // 1. Pega todas as categorias que estão ativas
        const categorias = await query('SELECT * FROM categorias WHERE ativo = TRUE ORDER BY ordem ASC, nome ASC');
        
        // 2. Pega todos os produtos que estão ativos
        const produtos = await query('SELECT * FROM produtos WHERE ativo = TRUE ORDER BY nome ASC');

        // 3. Estrutura os dados: aninha os produtos dentro de suas respectivas categorias
        const cardapioEstruturado = categorias.map(categoria => {
            return {
                ...categoria, // Inclui todos os dados da categoria (id, nome, is_happy_hour, etc.)
                produtos: produtos.filter(produto => produto.id_categoria === categoria.id)
            };
        });

        res.json(cardapioEstruturado);
    } catch (error) {
        console.error("Erro em GET /cardapio-completo:", error);
        res.status(500).json({ message: 'Erro ao buscar o cardápio completo', error: error.message });
    }
});

module.exports = router;
