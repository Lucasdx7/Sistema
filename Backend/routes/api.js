const express = require('express');
const router = express.Router();
const { query, registrarLog } = require('../configurar/db');
const bcrypt = require('bcryptjs');

// ==================================================================
// --- A CORREÇÃO ESTÁ AQUI ---
// Importamos a função específica 'checarNivelAcesso' do middleware.
// ==================================================================
const { checarNivelAcesso } = require('../middleware/authMiddleware');

const PDFDocument = require('pdfkit');
const fs = require('fs');
const fetch = require('node-fetch');
const thermalPrinter = require('node-thermal-printer');

// --- Middleware de verificação ---
const checarUsuarioParaLog = (req, res, next) => {
    if (req.usuario && (req.usuario.nome || req.usuario.nome_usuario)) {
        return next();
    }
    console.error("Tentativa de ação de log sem um usuário autenticado.");
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
router.post('/categorias',checarNivelAcesso (['geral']), checarUsuarioParaLog, async (req, res) => {
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
router.put('/categorias/:id',checarNivelAcesso (['geral']), checarUsuarioParaLog, async (req, res) => {
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
router.delete('/categorias/:id',checarNivelAcesso (['geral']), checarUsuarioParaLog, async (req, res) => {
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
router.post('/categorias/ordenar',checarNivelAcesso (['geral']), checarUsuarioParaLog, async (req, res) => {
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
        // Adicione 'pode_ser_sugestao' à desestruturação
        const { id_categoria, nome, descricao, descricao_detalhada, preco, imagem_svg, serve_pessoas, pode_ser_sugestao } = req.body;

        if (!id_categoria || !nome || !descricao || preco === undefined) {
            return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
        }
        
        // Atualize a query e os parâmetros
        const result = await query(
            'INSERT INTO produtos (id_categoria, nome, descricao, descricao_detalhada, preco, imagem_svg, serve_pessoas, pode_ser_sugestao) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [id_categoria, nome, descricao, descricao_detalhada || null, preco, imagem_svg || null, serve_pessoas || 1, pode_ser_sugestao || false]
        );

        await registrarLog(req.usuario.id, req.usuario.nome, 'CRIOU_PRODUTO', `Criou o produto '${nome}' (ID: ${result.insertId}).`);
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.status(201).json({ id: result.insertId, ...req.body });

    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar produto', error: error.message });
    }
});

// PUT /produtos/:id (EDITAR)
router.put('/produtos/:id', checarNivelAcesso (['geral']),checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    const novosDados = req.body;

    // ... (validação existente)

    try {
        const [produtoAntigo] = await query('SELECT * FROM produtos WHERE id = ?', [id]);
        if (!produtoAntigo) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        // Atualize a query SQL para incluir o novo campo
        const sql = 'UPDATE produtos SET nome = ?, descricao = ?, descricao_detalhada = ?, preco = ?, serve_pessoas = ?, pode_ser_sugestao = ? WHERE id = ?';
        const params = [
            novosDados.nome, 
            novosDados.descricao, 
            novosDados.descricao_detalhada || null, 
            parseFloat(novosDados.preco), 
            parseInt(novosDados.serve_pessoas),
            // Adicione o novo valor, convertendo para 0 ou 1 para o banco de dados
            novosDados.pode_ser_sugestao ? 1 : 0,
            id
        ];
        await query(sql, params);

        // Adicione a comparação para o log detalhado
        let detalhesLog = `Editou o produto '${produtoAntigo.nome}' (ID: ${id}).`;
        const mudancas = [];

        // ... (comparações existentes para nome, preço, etc.)

        // Nova comparação para o log
        if (!!produtoAntigo.pode_ser_sugestao !== !!novosDados.pode_ser_sugestao) {
            mudancas.push(`marcado como sugestão foi alterado para '${!!novosDados.pode_ser_sugestao}'`);
        }

        if (mudancas.length > 0) {
            detalhesLog += ` Alterações: ${mudancas.join(', ')}.`;
        }

        await registrarLog(req.usuario.id, req.usuario.nome, 'EDITOU_PRODUTO', detalhesLog);

        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.json({ message: 'Produto atualizado com sucesso!', id, ...novosDados });

    } catch (error) {
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar o produto.', error: error.message });
    }
});

// DELETE /produtos/:id
router.delete('/produtos/:id',checarNivelAcesso (['geral']),checarUsuarioParaLog, async (req, res) => {
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

router.patch('/categorias/:id/status',checarNivelAcesso (['geral']), checarUsuarioParaLog, (req, res) => {
    atualizarStatus(req, res, 'categorias');
});

router.patch('/produtos/:id/status', checarNivelAcesso (['geral']), checarUsuarioParaLog, (req, res) => {
    atualizarStatus(req, res, 'produtos');
});

// No seu arquivo de rotas da API (ex: api.js)
// No seu arquivo de rotas da API (ex: api.js)

// Rota para ATUALIZAR uma categoria (parcialmente)
router.patch('/categorias/:id',checarNivelAcesso (['geral']), async (req, res) => {
    const { id } = req.params;
    const { ativo } = req.body; // Pega apenas o campo 'ativo'

    if (ativo === undefined) {
        return res.status(400).json({ message: 'O campo "ativo" é obrigatório.' });
    }

    try {
        await query('UPDATE categorias SET ativo = ? WHERE id = ?', [ativo, id]);

        // ==================================================================
        // CORREÇÃO APLICADA AQUI
        // Após atualizar o banco, notifica TODOS os clientes.
        req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        // ==================================================================

        res.status(200).json({ message: 'Status da categoria atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar categoria:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar categoria.' });
    }
});

// Rota para ATUALIZAR um produto (parcialmente)
router.patch('/produtos/:id',checarNivelAcesso (['geral']), async (req, res) => {
    const { id } = req.params;
    // Pega os campos que podem ser atualizados: ativo, pode_ser_sugestao, etc.
    const { ativo, pode_ser_sugestao } = req.body; 

    // Cria a query dinamicamente para atualizar apenas os campos enviados
    const fields = [];
    const values = [];
    if (ativo !== undefined) {
        fields.push('ativo = ?');
        values.push(ativo);
    }
    if (pode_ser_sugestao !== undefined) {
        fields.push('pode_ser_sugestao = ?');
        values.push(pode_ser_sugestao);
    }

    if (fields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo para atualizar fornecido.' });
    }

    values.push(id); // Adiciona o ID para a cláusula WHERE

    try {
        await query(`UPDATE produtos SET ${fields.join(', ')} WHERE id = ?`, values);

        // ==================================================================
        // CORREÇÃO APLICADA AQUI
        // Após atualizar o banco, notifica TODOS os clientes.
        req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        // ==================================================================

        res.status(200).json({ message: 'Produto atualizado com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar produto:', error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar produto.' });
    }
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
router.delete('/mesas/:id',checarNivelAcesso (['geral']), checarUsuarioParaLog, async (req, res) => {
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

// ==================================================================
// --- ROTA DE SESSÕES COM A CONSULTA DO TOTAL CORRIGIDA ---
// ==================================================================
// Em seu arquivo api.js
// SUBSTITUA A ROTA DE BUSCAR SESSÕES INTEIRA POR ESTA VERSÃO

router.get('/mesas/:id/sessoes', checarNivelAcesso(['geral', 'pedidos']), checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    try {
        // ==================================================================
        // --- CONSULTA SQL ATUALIZADA PARA INCLUIR O NOME DO FUNCIONÁRIO ---
        // ==================================================================
        const sql = `
            SELECT 
                sc.id, 
                sc.nome_cliente, 
                sc.data_inicio, 
                sc.data_fim, 
                sc.status,
                sc.forma_pagamento,
                (
                    SELECT SUM(p.quantidade * p.preco_unitario) 
                    FROM pedidos p 
                    WHERE p.id_sessao = sc.id AND p.status != 'cancelado'
                ) AS total_gasto,
                -- Subquery para buscar o nome do usuário que fechou a sessão
                (
                    SELECT l.nome_usuario 
                    FROM logs l 
                    WHERE l.acao = 'FECHOU_SESSAO' 
                      AND l.detalhes LIKE CONCAT('%sessão ID ', sc.id, '%')
                    ORDER BY l.data_hora DESC
                    LIMIT 1
                ) AS finalizado_por
            FROM sessoes_cliente sc
            WHERE sc.id_mesa = ?
            ORDER BY FIELD(sc.status, 'ativa') DESC, sc.data_inicio DESC;
        `;
        
        const sessoes = await query(sql, [id]);
        const sessoesFormatadas = sessoes.map(s => ({
            ...s,
            total_gasto: parseFloat(s.total_gasto) || 0 
        }));
        
        res.json(sessoesFormatadas);

    } catch (error) {
        console.error('Erro ao buscar histórico da mesa:', error);
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

// ROTA CORRIGIDA para a conta do cliente
// Em Backend/routes/api.js

// ROTA CORRIGIDA para a conta do cliente
router.get('/sessoes/:id/conta',  async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'O ID da sessão é obrigatório.' });
    try {
        // A consulta agora busca TODOS os pedidos, incluindo os cancelados e a observação.
        const sql = `
            SELECT 
                p.id, p.quantidade, p.preco_unitario, p.status, p.observacao,
                prod.nome AS nome_produto, prod.imagem_svg
            FROM pedidos p
            JOIN produtos prod ON p.id_produto = prod.id
            WHERE p.id_sessao = ?
            ORDER BY p.data_pedido ASC;
        `;
        const pedidos = await query(sql, [id]);

        // O total agora é calculado no backend, somando apenas os itens NÃO cancelados
        const total = pedidos
            .filter(item => item.status !== 'cancelado')
            .reduce((acc, item) => acc + (item.quantidade * item.preco_unitario), 0);

        res.json({ pedidos, total: total.toFixed(2) });
    } catch (error) {
        console.error("Erro ao buscar conta do cliente:", error);
        res.status(500).json({ message: 'Erro no servidor ao buscar a conta.' });
    }
});

// ==================================================================
// ROTA PARA FECHAR A CONTA DE UMA SESSÃO (VERSÃO FINAL E CORRIGIDA)
// ==================================================================
// Em seu arquivo api.js
// SUBSTITUA A ROTA DE FECHAMENTO DE SESSÃO INTEIRA POR ESTA VERSÃO

router.post('/sessoes/:id/fechar', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params; // id da sessão
    const { forma_pagamento } = req.body;

    if (!forma_pagamento || !['dinheiro', 'cartao', 'pix'].includes(forma_pagamento)) {
        return res.status(400).json({ message: 'Forma de pagamento inválida ou não fornecida.' });
    }

    try {
        const sql = "UPDATE sessoes_cliente SET status = 'finalizada', data_fim = NOW(), forma_pagamento = ? WHERE id = ? AND status = 'ativa'";
        const result = await query(sql, [forma_pagamento, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada ou já está finalizada.' });
        }

        // ==================================================================
        // --- AQUI ESTÁ A CORREÇÃO CRÍTICA ---
        // Garantimos que estamos usando req.usuario.nome, que é o nome completo,
        // em vez de req.usuario.nome_usuario.
        // ==================================================================
        const nomeParaLog = req.usuario.nome; 

        await registrarLog(req.usuario.id, nomeParaLog, 'FECHOU_SESSAO', `Fechou a sessão ID ${id} com pagamento via ${forma_pagamento}.`);

        res.json({ message: 'Conta fechada com sucesso!' });
    } catch (error) {
        console.error('Erro ao fechar sessão:', error);
        res.status(500).json({ message: 'Erro no servidor ao fechar a conta.' });
    }
});


// ==================================================================
// --- ROTAS DE PEDIDOS ---
// ==================================================================

// ROTA DE PEDIDOS ATUALIZADA


// ROTA DE PEDIDOS ATUALIZADA para incluir o status 'pendente'
// Verifique se sua rota está exatamente assim
// Em api.js, SUBSTITUA a rota POST /pedidos

// Em seu arquivo api.js
// SUBSTITUA A ROTA POST /pedidos INTEIRA POR ESTA VERSÃO FINAL

router.post('/pedidos', checarUsuarioParaLog, async (req, res) => {
    const { pedidos } = req.body;

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
        return res.status(400).json({ message: 'O corpo da requisição deve conter um array de pedidos.' });
    }

    try {
        for (const pedido of pedidos) {
            if (!pedido.id_sessao || !pedido.id_produto || pedido.quantidade === undefined) {
                throw new Error(`Dados do pedido incompletos. id_sessao, id_produto e quantidade são obrigatórios.`);
            }

            const [produtoInfo] = await query('SELECT preco FROM produtos WHERE id = ?', [pedido.id_produto]);
            if (!produtoInfo) {
                throw new Error(`Produto com ID ${pedido.id_produto} não encontrado.`);
            }

            // ==================================================================
            // --- CORREÇÃO FINAL: Removendo 'nome_produto' do INSERT ---
            // A tabela 'pedidos' não tem esta coluna.
            // ==================================================================
            const sql = `
                INSERT INTO pedidos 
                    (id_sessao, id_produto, quantidade, preco_unitario, observacao, status) 
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const params = [
                pedido.id_sessao,
                pedido.id_produto,
                pedido.quantidade,
                produtoInfo.preco, // Usando o preço do banco
                pedido.observacao || null,
                'pendente'
            ];
            await query(sql, params);
        }

        if (req.broadcast) {
            req.broadcast({ type: 'NOVO_PEDIDO' });
        }
        res.status(201).json({ message: 'Pedido recebido e enviado para a cozinha com sucesso!' });

    } catch (error) {
        console.error('Falha crítica ao inserir pedidos em lote:', error);
        res.status(400).json({ message: error.message });
    }
});







// ==================================================================
// --- ROTA DE LOGS ---
// ==================================================================

// Em seu arquivo api.js
// SUBSTITUA A ROTA DE LOGS INTEIRA POR ESTA VERSÃO

router.get('/logs', checarUsuarioParaLog, async (req, res) => {
    if (req.usuario.nivel_acesso !== 'geral') {
        return res.status(403).json({ message: 'Acesso negado.' });
    }

    try {
        // Pega os parâmetros da URL, se existirem
        const { data, termo } = req.query;

        let sql = 'SELECT * FROM logs';
        const params = [];
        const conditions = [];

        // Adiciona condição de data, se fornecida
        if (data) {
            conditions.push('DATE(data_hora) = ?');
            params.push(data);
        }

        // Adiciona condição de busca por termo, se fornecido
        if (termo) {
            conditions.push('detalhes LIKE ?');
            params.push(`%${termo}%`);
        }

        // Monta a cláusula WHERE se houver condições
        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        // Adiciona a ordenação e o limite
        sql += ' ORDER BY data_hora DESC LIMIT 200'; // Aumentamos o limite para buscas

        const logs = await query(sql, params);
        res.json(logs);

    } catch (error) {
        console.error('Erro ao buscar logs:', error);
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




// Em seu arquivo api.js
// SUBSTITUA A ROTA POST /pedidos/:id/cancelar INTEIRA POR ESTA VERSÃO FINAL

router.post('/pedidos/:id/cancelar', checarNivelAcesso(['geral', 'pedidos']), checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    const { motivo, quantidade } = req.body;

    if (!motivo || motivo.trim() === '') {
        return res.status(400).json({ message: 'O motivo do cancelamento é obrigatório.' });
    }
    if (!quantidade || typeof quantidade !== 'number' || quantidade <= 0) {
        return res.status(400).json({ message: 'A quantidade a ser cancelada deve ser um número válido e maior que zero.' });
    }

    try {
        // Fazemos um JOIN para pegar o nome do produto para o log
        const sqlSelect = `
            SELECT p.*, prod.nome AS nome_produto 
            FROM pedidos p 
            JOIN produtos prod ON p.id_produto = prod.id 
            WHERE p.id = ?
        `;
        const [pedidoOriginal] = await query(sqlSelect, [id]);

        if (!pedidoOriginal) {
            return res.status(404).json({ message: 'Item do pedido não encontrado.' });
        }
        if (pedidoOriginal.status === 'cancelado') {
            return res.status(400).json({ message: 'Este item já foi cancelado.' });
        }
        if (quantidade > pedidoOriginal.quantidade) {
            return res.status(400).json({ message: `Não é possível cancelar ${quantidade} itens, pois existem apenas ${pedidoOriginal.quantidade} no pedido.` });
        }

        const nomeGerente = req.usuario.nome;
        const idUsuario = req.usuario.id;
        const nomeProdutoParaLog = pedidoOriginal.nome_produto; // Agora este valor vem do JOIN

        if (quantidade === pedidoOriginal.quantidade) {
            await query("UPDATE pedidos SET status = 'cancelado', motivo_cancelamento = ? WHERE id = ?", [motivo.trim(), id]);
            await registrarLog(idUsuario, nomeGerente, 'CANCELOU_PEDIDO_TOTAL', `Cancelou totalmente o item de pedido ID ${id} (${quantidade}x ${nomeProdutoParaLog}) pelo motivo: "${motivo.trim()}".`);
            return res.json({ message: 'Item do pedido cancelado com sucesso!' });
        }

        if (quantidade < pedidoOriginal.quantidade) {
            const novaQuantidade = pedidoOriginal.quantidade - quantidade;
            await query("UPDATE pedidos SET quantidade = ? WHERE id = ?", [novaQuantidade, id]);

            // ==================================================================
            // --- CORREÇÃO FINAL: Removendo 'nome_produto' do INSERT ---
            // ==================================================================
            const sqlInsert = `
                INSERT INTO pedidos 
                    (id_sessao, id_produto, quantidade, preco_unitario, observacao, status, motivo_cancelamento) 
                VALUES (?, ?, ?, ?, ?, 'cancelado', ?)
            `;
            const paramsInsert = [
                pedidoOriginal.id_sessao,
                pedidoOriginal.id_produto,
                quantidade,
                pedidoOriginal.preco_unitario || 0,
                pedidoOriginal.observacao || null,
                motivo.trim()
            ];
            await query(sqlInsert, paramsInsert);

            await registrarLog(idUsuario, nomeGerente, 'CANCELOU_PEDIDO_PARCIAL', `Cancelou ${quantidade} de ${pedidoOriginal.quantidade} do item de pedido ID ${id} (${nomeProdutoParaLog}) pelo motivo: "${motivo.trim()}".`);
            return res.json({ message: `${quantidade} item(s) cancelado(s) com sucesso.` });
        }

    } catch (error) {
        console.error('================================================');
        console.error('Erro ao cancelar item do pedido:', error);
        res.status(500).json({ message: 'Erro interno no servidor ao tentar cancelar o pedido.' });
    }
});






// ==================================================================
// --- ROTA PARA BUSCAR PEDIDOS DE UMA SESSÃO (VERSÃO CORRIGIDA) ---
// ==================================================================
// 1. Adicionamos o middleware checarNivelAcesso.
//    Aqui, permitimos que tanto 'geral' quanto 'pedidos' possam ver a lista de pedidos.
router.get('/sessoes/:id/pedidos', checarNivelAcesso(['geral', 'pedidos']), checarUsuarioParaLog, async (req, res) => {
    // 2. A verificação de permissão manual foi REMOVIDA.

    const { id } = req.params;
    try {
        const sql = `
            SELECT p.id, p.quantidade, p.preco_unitario, p.status, p.motivo_cancelamento, prod.nome AS nome_produto
            FROM pedidos AS p JOIN produtos AS prod ON p.id_produto = prod.id
            WHERE p.id_sessao = ? ORDER BY p.data_pedido ASC;
        `;
        const pedidos = await query(sql, [id]);
        res.json(pedidos);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao buscar os pedidos da sessão.' });
    }
});





// 2. CRIAR A NOVA ROTA PARA BUSCAR SUGESTÃO ALEATÓRIA
// VERSÃO FINAL E CORRIGIDA DA ROTA DE SUGESTÃO
router.get('/produtos/sugestao', checarUsuarioParaLog, async (req, res) => {
    try {
        // Query CORRIGIDA com JOIN e LIMIT 3
        const sql = `
            SELECT 
                p.*, 
                c.id AS id_categoria, 
                c.nome AS nome_categoria 
            FROM produtos p
            JOIN categorias c ON p.id_categoria = c.id
            WHERE p.ativo = 1 AND p.pode_ser_sugestao = 1 
            ORDER BY RAND() 
            LIMIT 5;
        `;
        
        // Chamada CORRIGIDA usando a função 'query'
        const sugestoes = await query(sql);

        // Lógica CORRIGIDA para retornar um array
        if (sugestoes.length > 0) {
            res.json(sugestoes); // Retorna o array completo de sugestões
        } else {
            res.status(404).json({ message: 'Nenhuma sugestão de produto disponível no momento.' });
        }
    } catch (error) {
        console.error('Erro ao buscar sugestão de produto:', error);
        res.status(500).json({ message: 'Erro interno ao buscar sugestão.' });
    }
});


// Coloque esta rota perto das outras rotas PATCH de status

router.patch('/produtos/:id/sugestao',checarNivelAcesso (['geral', 'pedidos']), checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    const { pode_ser_sugestao } = req.body;

    if (pode_ser_sugestao === undefined) {
        return res.status(400).json({ message: "O status 'pode_ser_sugestao' é obrigatório." });
    }

    try {
        const sql = `UPDATE produtos SET pode_ser_sugestao = ? WHERE id = ?`;
        // AQUI ESTÁ O PROBLEMA PROVÁVEL
        const result = await query(sql, [pode_ser_sugestao, id]); 

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Produto não encontrado.' });
        }

        const acao = pode_ser_sugestao ? 'MARCOU_COMO_SUGESTAO' : 'DESMARCOU_COMO_SUGESTAO';
        await registrarLog(req.usuario.id, req.usuario.nome, acao, `Alterou o status de sugestão do produto ID ${id}.`);
        
        if (req.broadcast) req.broadcast({ type: 'CARDAPIO_ATUALIZADO' });
        res.json({ message: 'Status de sugestão atualizado com sucesso.' });

    } catch (error) {
        // O erro está sendo capturado aqui!
        res.status(500).json({ message: 'Erro no servidor ao atualizar status de sugestão.', error: error.message });
    }
});






// Função auxiliar para agrupar pedidos (deve estar no mesmo arquivo)
function agruparPedidos(pedidos) {
    if (!pedidos || pedidos.length === 0) return [];
    const itensAgrupados = {};
    pedidos.forEach(pedido => {
        const chave = `${pedido.nome_produto}-${pedido.observacao || ''}`;
        if (itensAgrupados[chave]) {
            itensAgrupados[chave].quantidade += pedido.quantidade;
        } else {
            itensAgrupados[chave] = { ...pedido };
        }
    });
    return Object.values(itensAgrupados);
}




// ==================================================================
// --- ROTA PARA BUSCAR INFORMAÇÕES DE UMA SESSÃO ESPECÍFICA ---
// ==================================================================
router.get('/sessoes/:id/info', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    try {
        // Esta query busca os dados do cliente e o nome da mesa associada à sessão
        const sql = `
            SELECT 
                sc.nome_cliente, 
                sc.telefone_cliente, 
                sc.cpf_cliente, 
                m.nome_usuario 
            FROM sessoes_cliente sc 
            JOIN mesas m ON sc.id_mesa = m.id 
            WHERE sc.id = ?;
        `;
        const [sessaoInfo] = await query(sql, [id]);
        
        if (!sessaoInfo) {
            // Retorna 404 se a sessão não for encontrada, para o frontend saber
            return res.status(404).json({ message: 'Informações da sessão não encontradas.' });
        }
        
        // Retorna os dados encontrados como JSON
        res.json(sessaoInfo);

    } catch (error) {
        console.error(`Erro ao buscar informações da sessão ID ${id}:`, error);
        res.status(500).json({ message: 'Erro no servidor ao buscar informações da sessão.' });
    }
});

// Em /Backend/routes/api.js

// SUBSTITUA a rota /mesas/chamar-garcom por esta:
router.post('/mesas/chamar-garcom', checarUsuarioParaLog, async (req, res) => {
    if (!req.broadcast) {
        return res.status(500).json({ message: 'Erro de comunicação interna.' });
    }

    try {
        const idMesa = req.usuario.id;
        const nomeMesa = req.usuario.nome_usuario;

        if (!idMesa || !nomeMesa) {
            return res.status(400).json({ message: 'Não foi possível identificar a mesa.' });
        }

        // --- NOVA LÓGICA: INSERIR O CHAMADO NO BANCO DE DADOS ---
        const sql = 'INSERT INTO chamados (id_mesa, nome_mesa) VALUES (?, ?)';
        const result = await query(sql, [idMesa, nomeMesa]);
        const novoChamadoId = result.insertId;
        // ---------------------------------------------------------

        const mensagem = {
            type: 'CHAMADO_GARCOM',
            id: novoChamadoId, // Envia o ID do novo chamado
            nomeMesa: nomeMesa,
            timestamp: new Date().toISOString()
        };

        req.broadcast(mensagem);

        res.status(200).json({ message: 'Chamado enviado com sucesso!' });

    } catch (error) {
        console.error(`Erro ao processar chamado da mesa ${req.usuario.id}:`, error);
        res.status(500).json({ message: 'Ocorreu um erro no servidor ao processar sua chamada.' });
    }
});


// Em /Backend/routes/api.js

// --- NOVAS ROTAS PARA A PÁGINA DE CHAMADOS ---

// GET /api/chamados - Busca todos os chamados do dia
router.get('/chamados', checarUsuarioParaLog, async (req, res) => {
    try {
        // Busca chamados feitos no dia de hoje (a partir da meia-noite)
        const sql = "SELECT * FROM chamados WHERE DATE(data_hora) = CURDATE() ORDER BY data_hora DESC";
        const chamados = await query(sql);
        res.json(chamados);
    } catch (error) {
        console.error("Erro ao buscar chamados:", error);
        res.status(500).json({ message: 'Erro no servidor ao buscar chamados.' });
    }
});

// PATCH /api/chamados/:id/atender - Marca um chamado como atendido
router.patch('/chamados/:id/atender', checarNivelAcesso(['geral', 'pedidos']), checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params;
    try {
        const sql = "UPDATE chamados SET status = 'atendido' WHERE id = ? AND status = 'pendente'";
        const result = await query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Chamado não encontrado ou já atendido.' });
        }

        res.json({ message: 'Chamado marcado como atendido com sucesso!' });
    } catch (error) {
        console.error(`Erro ao atender chamado ID ${id}:`, error);
        res.status(500).json({ message: 'Erro no servidor ao atender chamado.' });
    }
});


// Em /Backend/routes/api.js

// GET /api/chamados/pendentes/count - Retorna apenas a contagem de chamados pendentes
router.get('/chamados/pendentes/count',checarNivelAcesso (['geral', 'pedidos']), checarUsuarioParaLog, async (req, res) => {
    try {
        const sql = "SELECT COUNT(id) AS count FROM chamados WHERE status = 'pendente' AND DATE(data_hora) = CURDATE()";
        const [result] = await query(sql);
        res.json(result); // Retorna um objeto como { count: 5 }
    } catch (error) {
        console.error("Erro ao contar chamados pendentes:", error);
        res.status(500).json({ message: 'Erro no servidor.' });
    }
});




const checarPermissaoRelatorios = (req, res, next) => {
    if (req.usuario && req.usuario.nivel_acesso === 'geral') {
        return next();
    }
    return res.status(403).json({ message: 'Acesso negado. Apenas a gerência pode visualizar relatórios.' });
};

// Função para obter o intervalo de datas com base no período
// Em seu arquivo api.js
// SUBSTITUA A FUNÇÃO INTEIRA POR ESTA VERSÃO CORRIGIDA

// Em seu arquivo api.js
// SUBSTITUA A FUNÇÃO obterIntervaloDeDatas POR ESTA VERSÃO

function obterIntervaloDeDatas(periodo) {
    const agora = new Date();
    let inicio = new Date(agora);

    // Zera a hora para o início do dia
    inicio.setHours(0, 0, 0, 0);

    switch (periodo) {
        case 'hoje':
            // O início já é hoje às 00:00
            break;
        case 'semana':
            const diaDaSemana = inicio.getDay();
            const diasParaSubtrair = diaDaSemana === 0 ? 6 : diaDaSemana - 1;
            inicio.setDate(inicio.getDate() - diasParaSubtrair);
            break;
        case 'mes':
            inicio.setDate(1);
            break;
        case 'ano':
            inicio.setMonth(0, 1);
            break;
        default:
            throw new Error('Período inválido');
    }
    // Retorna as datas como objetos Date
    return { inicio, fim: agora };
}



// Rota principal de relatórios (Refatorada)
router.get('/relatorios', checarNivelAcesso(['geral', 'pedidos']), checarPermissaoRelatorios, async (req, res) => {
    const { periodo } = req.query;
    const periodosValidos = ['hoje', 'semana', 'mes', 'ano'];

    if (!periodosValidos.includes(periodo)) {
        return res.status(400).json({ message: 'Período inválido fornecido.' });
    }

    try {
        const { inicio, fim } = obterIntervaloDeDatas(periodo);

        // ==================================================================
        // --- CORREÇÃO DE FUSO HORÁRIO NA CONSULTA SQL ---
        // ==================================================================
        const sql = `
            SELECT
                s.id,
                s.data_fim,
                s.forma_pagamento,
                p.quantidade,
                p.preco_unitario
            FROM sessoes_cliente s
            JOIN pedidos p ON s.id = p.id_sessao
            WHERE s.status = 'finalizada'
              AND p.status != 'cancelado'
              AND CONVERT_TZ(s.data_fim, 'UTC', 'America/Sao_Paulo') BETWEEN ? AND ?;
        `;
        const resultados = await query(sql, [inicio, fim]);

        const dadosFormatados = formatarDadosParaFrontend(resultados, periodo);
        res.status(200).json(dadosFormatados);

    } catch (error) {
        console.error(`Erro ao gerar relatório para o período '${periodo}':`, error);
        res.status(500).json({ message: 'Erro interno ao processar os dados do relatório.' });
    }
});








// Em seu arquivo de rotas da API (api.js)
// SUBSTITUA a rota /api/relatorios/avancado inteira por esta versão corrigida

// Em seu arquivo de rotas da API (api.js)
// SUBSTITUA a rota /api/relatorios/avancado inteira por esta versão corrigida

// Em seu arquivo de rotas da API (api.js)
// SUBSTITUA a rota /api/relatorios/avancado inteira por esta versão final

function formatarDataParaMySQL(date) {
    const pad = (num) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

router.get('/relatorios/avancado', checarNivelAcesso(['geral']), async (req, res) => {
    const { periodo } = req.query;

    try {
        const { inicio, fim } = obterIntervaloDeDatas(periodo);
        if (!inicio || !fim) {
            return res.status(400).json({ message: 'Período inválido fornecido.' });
        }

        const inicioFormatado = formatarDataParaMySQL(inicio);
        const fimFormatado = formatarDataParaMySQL(fim);

        let groupByClause, selectClause, orderByClause;

        switch (periodo) {
            case 'ano':
                selectClause = `DATE_FORMAT(MIN(s.data_fim), '%b')`;
                groupByClause = `YEAR(s.data_fim), MONTH(s.data_fim)`;
                orderByClause = `MIN(s.data_fim)`;
                break;
            case 'mes':
            case 'semana':
                selectClause = `DATE_FORMAT(MIN(s.data_fim), '%d/%m')`;
                groupByClause = `YEAR(s.data_fim), MONTH(s.data_fim), DAY(s.data_fim)`;
                orderByClause = `MIN(s.data_fim)`;
                break;
            case 'hoje':
                selectClause = `DATE_FORMAT(MIN(s.data_fim), '%H:00')`;
                groupByClause = `YEAR(s.data_fim), MONTH(s.data_fim), DAY(s.data_fim), HOUR(s.data_fim)`;
                orderByClause = `MIN(s.data_fim)`;
                break;
            default:
                return res.status(400).json({ message: 'Período inválido.' });
        }

        const vendasQuerySQL = `
            SELECT ${selectClause} as label, SUM(p.quantidade * p.preco_unitario) as valor
            FROM sessoes_cliente s
            JOIN pedidos p ON s.id = p.id_sessao
            WHERE s.status = 'finalizada' AND p.status != 'cancelado' AND s.data_fim BETWEEN ? AND ?
            GROUP BY ${groupByClause}
            ORDER BY ${orderByClause};
        `;
        
        const vendasQueryPromise = query(vendasQuerySQL, [inicioFormatado, fimFormatado]);

        // --- OUTRAS CONSULTAS (permanecem as mesmas) ---
        const kpisQuery = query(`SELECT COALESCE(SUM(p.quantidade * p.preco_unitario), 0) AS vendasTotais, COUNT(DISTINCT s.id) AS totalPedidos FROM sessoes_cliente s JOIN pedidos p ON s.id = p.id_sessao WHERE s.status = 'finalizada' AND p.status != 'cancelado' AND s.data_fim BETWEEN ? AND ?;`, [inicioFormatado, fimFormatado]);
        const pagamentosQuery = query(`SELECT forma_pagamento, SUM(p.quantidade * p.preco_unitario) as total FROM sessoes_cliente s JOIN pedidos p ON s.id = p.id_sessao WHERE s.status = 'finalizada' AND p.status != 'cancelado' AND s.data_fim BETWEEN ? AND ? GROUP BY forma_pagamento;`, [inicioFormatado, fimFormatado]);
        const produtosQuery = query(`SELECT prod.nome, SUM(p.quantidade) as quantidade_vendida FROM pedidos p JOIN produtos prod ON p.id_produto = prod.id JOIN sessoes_cliente s ON s.id = p.id_sessao WHERE s.status = 'finalizada' AND p.status != 'cancelado' AND s.data_fim BETWEEN ? AND ? GROUP BY prod.nome ORDER BY quantidade_vendida DESC LIMIT 5;`, [inicioFormatado, fimFormatado]);
        const horariosQuery = query(`SELECT EXTRACT(HOUR FROM s.data_fim) as hora, COUNT(DISTINCT s.id) as numero_sessoes FROM sessoes_cliente s WHERE s.status = 'finalizada' AND s.data_fim BETWEEN ? AND ? GROUP BY hora ORDER BY hora ASC;`, [inicioFormatado, fimFormatado]);
        
        const [kpisResult, vendasResult, pagamentosResult, produtosResult, horariosResult] = await Promise.all([
            kpisQuery, vendasQueryPromise, pagamentosQuery, produtosQuery, horariosQuery
        ]);

        // ==================================================================
        // --- NOVA LÓGICA PARA PREENCHER OS DADOS FALTANTES DO GRÁFICO ---
        // ==================================================================
        const dadosVendasCompletos = {};
        const agora = new Date();

        if (periodo === 'ano') {
            const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            for (let i = 0; i <= agora.getMonth(); i++) {
                dadosVendasCompletos[meses[i]] = 0;
            }
        } else if (periodo === 'mes') {
            for (let i = 1; i <= agora.getDate(); i++) {
                const diaFormatado = `${i.toString().padStart(2, '0')}/${(agora.getMonth() + 1).toString().padStart(2, '0')}`;
                dadosVendasCompletos[diaFormatado] = 0;
            }
        } else if (periodo === 'semana') {
            for (let i = 6; i >= 0; i--) {
                const dataDia = new Date();
                dataDia.setDate(agora.getDate() - i);
                const diaFormatado = `${dataDia.getDate().toString().padStart(2, '0')}/${(dataDia.getMonth() + 1).toString().padStart(2, '0')}`;
                dadosVendasCompletos[diaFormatado] = 0;
            }
        } else if (periodo === 'hoje') {
            for (let i = 0; i <= agora.getHours(); i++) {
                const horaFormatada = `${i.toString().padStart(2, '0')}:00`;
                dadosVendasCompletos[horaFormatada] = 0;
            }
        }

        // Preenche o objeto com os dados que vieram do banco
        vendasResult.forEach(r => {
            if (dadosVendasCompletos.hasOwnProperty(r.label)) {
                dadosVendasCompletos[r.label] = parseFloat(r.valor);
            }
        });

        const graficoVendas = {
            labels: Object.keys(dadosVendasCompletos),
            valores: Object.values(dadosVendasCompletos)
        };
        // ==================================================================

        // --- FORMATAÇÃO DOS DADOS (KPIs, Pagamentos, etc. - permanece a mesma) ---
        const kpisData = kpisResult[0] || { vendasTotais: 0, totalPedidos: 0 };
        const kpis = {
            vendasTotais: parseFloat(kpisData.vendasTotais),
            totalPedidos: parseInt(kpisData.totalPedidos, 10),
            ticketMedio: kpisData.totalPedidos > 0 ? kpisData.vendasTotais / kpisData.totalPedidos : 0,
            produtoMaisVendido: produtosResult.length > 0 ? produtosResult[0].nome : '-'
        };

        const graficoPagamentos = { cartao: 0, dinheiro: 0, pix: 0 };
        pagamentosResult.forEach(r => {
            if (graficoPagamentos.hasOwnProperty(r.forma_pagamento)) {
                graficoPagamentos[r.forma_pagamento] = parseFloat(r.total);
            }
        });

        const graficoProdutos = {
            labels: produtosResult.map(r => r.nome),
            valores: produtosResult.map(r => parseInt(r.quantidade_vendida, 10))
        };

        const graficoHorariosPico = {
            labels: horariosResult.map(r => `${r.hora.toString().padStart(2, '0')}:00`),
            valores: horariosResult.map(r => parseInt(r.numero_sessoes, 10))
        };

        res.json({ kpis, graficoVendas, graficoPagamentos, graficoProdutos, graficoHorariosPico });

    } catch (error) {
        console.error('Erro ao buscar relatórios avançados:', error);
        res.status(500).json({ message: 'Erro interno do servidor ao processar relatórios.' });
    }
});












/**
 * Formata os dados brutos do banco para a estrutura JSON que o frontend precisa.
 * @param {Array<Object>} dadosBrutos - Lista de pedidos com informações da sessão.
 * @param {string} periodo - O período solicitado ('hoje', 'semana', 'mes', 'ano').
 * @returns {Object} - O objeto formatado para a API.
 */
function formatarDadosParaFrontend(dadosBrutos, periodo) {
    const fusoHorario = 'America/Sao_Paulo';
    const agora = new Date(new Date().toLocaleString('en-US', { timeZone: fusoHorario }));

    // Estruturas para agregar os dados
    const sessoesProcessadas = new Map();
    const graficoPagamentos = { cartao: 0, dinheiro: 0, pix: 0 };
    let vendasTotais = 0;

    // 1. Agregação dos dados
    for (const item of dadosBrutos) {
        const totalItem = item.quantidade * item.preco_unitario;
        vendasTotais += totalItem;

        if (!sessoesProcessadas.has(item.id)) {
            sessoesProcessadas.set(item.id, {
                data_fim: item.data_fim,
                forma_pagamento: item.forma_pagamento,
                total: 0
            });
        }
        const sessao = sessoesProcessadas.get(item.id);
        sessao.total += totalItem;
    }

    // 2. Preparação dos gráficos
    const dadosParaGraficoVendas = inicializarGrafico(periodo, agora);

    // 3. Preenchimento dos dados agregados
    for (const sessao of sessoesProcessadas.values()) {
        if (sessao.forma_pagamento && graficoPagamentos.hasOwnProperty(sessao.forma_pagamento)) {
            graficoPagamentos[sessao.forma_pagamento] += sessao.total;
        }

        const data = new Date(new Date(sessao.data_fim).toLocaleString('en-US', { timeZone: fusoHorario }));
        const chave = obterChaveGrafico(periodo, data);
        if (dadosParaGraficoVendas.hasOwnProperty(chave)) {
            dadosParaGraficoVendas[chave] += sessao.total;
        }
    }

    // 4. Finalização
    const totalPedidos = sessoesProcessadas.size;
    const kpis = {
        vendasTotais: vendasTotais,
        totalPedidos: totalPedidos,
        ticketMedio: totalPedidos > 0 ? vendasTotais / totalPedidos : 0,
    };

    return {
        kpis,
        graficoPagamentos,
        graficoVendas: {
            labels: Object.keys(dadosParaGraficoVendas),
            valores: Object.values(dadosParaGraficoVendas)
        }
    };
}

// Funções auxiliares para manter o código limpo
function inicializarGrafico(periodo, dataRef) {
    const grafico = {};
    if (periodo === 'hoje') {
        for (let i = 0; i <= dataRef.getHours(); i++) { grafico[`${String(i).padStart(2, '0')}:00`] = 0; }
    } else if (periodo === 'semana') {
        const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        for (let i = 0; i < 7; i++) { grafico[dias[i]] = 0; }
    } else if (periodo === 'mes') {
        for (let i = 1; i <= dataRef.getDate(); i++) { grafico[String(i)] = 0; }
    } else if (periodo === 'ano') {
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        for (let i = 0; i <= dataRef.getMonth(); i++) { grafico[meses[i]] = 0; }
    }
    return grafico;
}

function obterChaveGrafico(periodo, data) {
    if (periodo === 'hoje') return `${String(data.getHours()).padStart(2, '0')}:00`;
    if (periodo === 'semana') return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][data.getDay()];
    if (periodo === 'mes') return String(data.getDate());
    if (periodo === 'ano') return ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][data.getMonth()];
    return '';
}





// ====================================================================================
// ROTA PARA LIMPAR CHAMADOS ATENDIDOS (SEGUINDO O PADRÃO DO PROJETO)
// ====================================================================================
router.delete('/chamados/limpar-atendidos', checarNivelAcesso(['geral', 'pedidos']), checarUsuarioParaLog, async (req, res) => {
    try {
        const chamadosParaDeletar = await query("SELECT COUNT(*) as total FROM chamados WHERE status = 'atendido'");
        const totalDeletado = chamadosParaDeletar[0].total;

        if (totalDeletado === 0) {
            return res.status(200).json({ message: 'Nenhum chamado atendido para limpar.' });
        }

        await query("DELETE FROM chamados WHERE status = 'atendido'");

        await registrarLog(
            req.usuario.id, 
            req.usuario.nome, 
            'LIMPOU_CHAMADOS', 
            `Limpou o histórico de ${totalDeletado} chamados de garçom que já haviam sido atendidos.`
        );

        if (req.broadcast) {
            req.broadcast({ type: 'CHAMADOS_ATUALIZADOS' });
        }

        res.status(200).json({ message: `Histórico de ${totalDeletado} chamados atendidos foi limpo com sucesso.` });

    } catch (error) {
        console.error('Erro ao limpar chamados atendidos:', error);
        res.status(500).json({ message: 'Erro ao limpar chamados atendidos', error: error.message });
    }
});




router.get('/pedidos-ativos',checarNivelAcesso (['geral', 'pedidos']), checarUsuarioParaLog, async (req, res) => {
    // Proteção de Nível de Acesso

    try {
        // Query aprimorada para incluir sessões sem pedidos e mais detalhes dos itens.
        const sql = `
            SELECT 
                sc.id AS sessao_id,
                sc.id_mesa AS mesa_id,
                sc.nome_cliente,
                m.nome_usuario AS nome_mesa,
                -- Calcula o total apenas de itens não cancelados
                (
                    SELECT SUM(p.quantidade * p.preco_unitario) 
                    FROM pedidos p 
                    WHERE p.id_sessao = sc.id AND p.status != 'cancelado'
                ) AS total,
                -- Subquery para buscar os itens com TODOS os detalhes pedidos
                (
                    SELECT JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'pedido_item_id', p.id, -- ID do item específico no pedido
                            'nome_produto', prod.nome, 
                            'quantidade', p.quantidade,
                            'observacao', p.observacao, -- << NOVA INFORMAÇÃO
                            'categoria', cat.nome,     -- << NOVA INFORMAÇÃO
                            'status', p.status          -- << NOVA INFORMAÇÃO (entregue, pendente)
                        )
                    )
                    FROM pedidos p
                    JOIN produtos prod ON p.id_produto = prod.id
                    JOIN categorias cat ON prod.id_categoria = cat.id -- << NOVO JOIN
                    WHERE p.id_sessao = sc.id AND p.status != 'cancelado'
                ) AS itens
            FROM sessoes_cliente sc
            JOIN mesas m ON sc.id_mesa = m.id
            WHERE sc.status = 'ativa' -- Pega todas as sessões ativas
            ORDER BY sc.data_inicio ASC; -- Ordena pelas mais antigas primeiro
        `;

        const sessoesAtivas = await query(sql);

        // Formata a resposta final
        const sessoesFormatadas = sessoesAtivas.map(sessao => ({
            ...sessao,
            total: parseFloat(sessao.total) || 0,
            // Se 'itens' for nulo (sessão sem pedidos), retorna um array vazio.
            itens: sessao.itens || [] 
        }));

        res.status(200).json(sessoesFormatadas);

    } catch (dbError) {
        console.error('Erro ao buscar pedidos ativos:', dbError);
        res.status(500).json({ message: 'Erro interno do servidor ao consultar os pedidos.' });
    }
});


// ==================================================================
// --- ROTA PARA MARCAR UM ITEM DE PEDIDO COMO ENTREGUE ---
// ==================================================================
// Em seu arquivo api.js
// SUBSTITUA A ROTA DE MARCAR COMO ENTREGUE POR ESTA VERSÃO

// Em seu arquivo api.js
// SUBSTITUA A ROTA DE MARCAR COMO ENTREGUE INTEIRA POR ESTA VERSÃO FINAL

router.patch('/pedidos/:id/entregar', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params; // id do item específico do pedido

    try {
        // ==================================================================
        // --- AQUI ESTÁ A CORREÇÃO: Buscando o nome do produto com JOIN ---
        // Fazemos um JOIN com a tabela 'produtos' para obter o nome correto.
        // ==================================================================
        const sqlSelect = `
            SELECT prod.nome 
            FROM pedidos p 
            JOIN produtos prod ON p.id_produto = prod.id 
            WHERE p.id = ?
        `;
        const [pedidoInfo] = await query(sqlSelect, [id]);

        if (!pedidoInfo) {
            return res.status(404).json({ message: 'Item do pedido não encontrado.' });
        }

        // Agora, atualizamos o status do pedido
        const sqlUpdate = "UPDATE pedidos SET status = 'entregue' WHERE id = ? AND status = 'pendente'";
        const result = await query(sqlUpdate, [id]);

        if (result.affectedRows === 0) {
            // Isso pode acontecer se o item já foi entregue por outro funcionário
            return res.status(404).json({ message: 'Item do pedido não encontrado ou já foi entregue.' });
        }

        // Finalmente, registramos a ação no log com o nome correto do produto
        const nomeParaLog = req.usuario.nome;
        await registrarLog(
            req.usuario.id, 
            nomeParaLog, 
            'ENTREGOU_PEDIDO', 
            `Entregou o item "${pedidoInfo.nome}" (Pedido Item ID: ${id}).`
        );
        // ==================================================================

        // Notifica todos os painéis para se atualizarem
        if (req.broadcast) {
            req.broadcast({ type: 'PEDIDO_ATUALIZADO' });
        }

        res.json({ message: 'Item marcado como entregue!' });

    } catch (error) {
        console.error(`Erro ao marcar item ${id} como entregue:`, error);
        res.status(500).json({ message: 'Erro no servidor ao atualizar o item.' });
    }
});




// ==================================================================
// --- ROTA PARA CONTAR ITENS DE PEDIDOS PENDENTES ---
// ==================================================================
router.get('/pedidos/pendentes/count',checarNivelAcesso (['geral', 'pedidos']), checarUsuarioParaLog, async (req, res) => {
    // Garante que apenas a gerência possa acessar esta informação
    
    try {
        // Query SQL que conta todos os registros na tabela 'pedidos'
        // onde o status é 'pendente' e que pertencem a uma sessão 'ativa'.
        const sql = `
            SELECT COUNT(p.id) AS count 
            FROM pedidos p
            JOIN sessoes_cliente sc ON p.id_sessao = sc.id
            WHERE p.status = 'pendente' AND sc.status = 'ativa';
        `;
        
        const [result] = await query(sql);
        
        // Retorna o resultado no mesmo formato da contagem de chamados, ex: { count: 3 }
        res.json(result); 

    } catch (error) {
        console.error("Erro ao contar pedidos pendentes:", error);
        res.status(500).json({ message: 'Erro no servidor ao contar pedidos.' });
    }
});


// ==================================================================
// --- ROTAS DE CONFIGURAÇÕES ---
// ==================================================================

// Middleware para proteger rotas de configuração (apenas acesso 'geral')
const checarPermissaoConfig = (req, res, next) => {
    if (req.usuario && req.usuario.nivel_acesso === 'geral') {
        return next();
    }
    return res.status(403).json({ message: 'Acesso negado. Apenas a gerência pode acessar as configurações.' });
};

// GET /api/configuracoes/:chaves
// Busca múltiplas configurações de uma vez. Ex: /api/configuracoes/fonte_cliente,permissoes_home
router.get('/configuracoes/:chaves', checarPermissaoConfig, async (req, res) => {
    try {
        const chaves = req.params.chaves.split(',');
        const placeholders = chaves.map(() => '?').join(','); // Cria ?,?,?
        const sql = `SELECT chave, valor FROM configuracoes WHERE chave IN (${placeholders})`;
        
        const resultados = await query(sql, chaves);

        // Transforma o array de resultados em um objeto chave-valor para fácil uso no frontend
        const configs = resultados.reduce((obj, item) => {
            obj[item.chave] = item.valor;
            return obj;
        }, {});

        res.json(configs);
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar configurações.' });
    }
});

// POST /api/configuracoes
// Salva uma ou mais configurações. Espera um body como { "fonte_cliente": "...", "outra_config": "..." }
router.post('/configuracoes', checarPermissaoConfig, async (req, res) => {
    try {
        const configsParaSalvar = req.body;
        const promessas = [];

        for (const chave in configsParaSalvar) {
            if (Object.hasOwnProperty.call(configsParaSalvar, chave)) {
                const valor = configsParaSalvar[chave];
                // "INSERT ... ON DUPLICATE KEY UPDATE" é uma forma eficiente de inserir ou atualizar.
                const sql = 'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?';
                promessas.push(query(sql, [chave, valor, valor]));
            }
        }

        await Promise.all(promessas);

        // Registra um log genérico da ação
        await registrarLog(req.usuario.id, req.usuario.nome, 'ATUALIZOU_CONFIGS', 'O usuário salvou alterações na página de configurações.');

        // Notifica outros painéis abertos sobre a mudança (útil para a fonte do cliente)
        if (req.broadcast) {
            req.broadcast({ type: 'CONFIG_ATUALIZADA', payload: configsParaSalvar });
        }

        res.status(200).json({ message: 'Configurações salvas com sucesso!' });
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        res.status(500).json({ message: 'Erro no servidor ao salvar configurações.' });
    }
});



// GET /api/usuarios-para-relatorio
// Busca uma lista de todos os usuários para preencher o seletor no frontend.
router.get('/usuarios-para-relatorio', checarPermissaoConfig, async (req, res) => {
    try {
        // CORREÇÃO: Adicionamos 'nivel_acesso' à lista de colunas selecionadas.
        const sql = "SELECT id, nome, email, nivel_acesso FROM usuarios ORDER BY nome ASC";
        const usuarios = await query(sql);
        res.json(usuarios);
    } catch (error) {
        console.error('Erro ao buscar usuários para relatório:', error);
        res.status(500).json({ message: 'Erro no servidor ao buscar usuários.' });
    }
});



// Em seu arquivo api.js
// SUBSTITUA A ROTA DE RELATÓRIO DE ATIVIDADE INTEIRA POR ESTA VERSÃO FINAL

router.get('/relatorio-atividade', checarPermissaoConfig, async (req, res) => {
    const { usuarioId, periodo } = req.query;

    if (!usuarioId || !periodo) {
        return res.status(400).json({ message: 'ID do usuário e período são obrigatórios.' });
    }

    try {
        const { inicio, fim } = obterIntervaloDeDatas(periodo);

        // Consulta única que já pega todas as ações necessárias
        const sqlLogs = `
            SELECT acao, COUNT(id) as total
            FROM logs
            WHERE id_usuario = ? AND data_hora BETWEEN ? AND ?
            GROUP BY acao
            ORDER BY FIELD(acao, 'FECHOU_SESSAO', 'ENTREGOU_PEDIDO') DESC, total DESC;
        `;
        const atividades = await query(sqlLogs, [usuarioId, inicio, fim]);

        // ==================================================================
        // --- AQUI ESTÁ A MUDANÇA: Formatando os nomes das ações ---
        // ==================================================================
        const atividadesFormatadas = atividades.map(ativ => {
            let nomeAcao = ativ.acao;
            switch (ativ.acao) {
                case 'FECHOU_SESSAO':
                    nomeAcao = 'Mesas Fechadas';
                    break;
                case 'ENTREGOU_PEDIDO':
                    nomeAcao = 'Pedidos Entregues';
                    break;
                default:
                    // Formata outras ações de forma genérica
                    nomeAcao = ativ.acao.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                    break;
            }
            return { acao: nomeAcao, total: ativ.total };
        });

        res.json(atividadesFormatadas);

    } catch (error) {
        console.error('Erro ao gerar relatório de atividade:', error);
        res.status(500).json({ message: 'Erro no servidor ao gerar relatório.' });
    }
});





// ==================================================================
// --- ROTA PARA RESETAR O BANCO DE DADOS (VERSÃO FINAL E CORRIGIDA) ---
// ==================================================================
// REMOVEMOS o middleware 'checarPermissaoRelatorios' daqui
router.post('/reset-database', async (req, res) => {
    // A verificação de permissão já acontece implicitamente pelo 'protegerRota'
    // que protege todo o arquivo /api. E a validação principal é a da chave secreta.
    if (req.usuario.nivel_acesso !== 'geral') {
        return res.status(403).json({ message: 'Apenas o administrador geral pode executar esta ação.' });
    }

    const { secretKey } = req.body;

    // 1. Validação da chave secreta
    if (!secretKey || secretKey !== process.env.RESET_SECRET_TOKEN) {
        return res.status(403).json({ message: 'Chave de acesso para reset inválida ou não fornecida.' });
    }

    try {
        // 2. Desativa temporariamente a verificação de chaves estrangeiras
        await query('SET FOREIGN_KEY_CHECKS = 0;');

        // 3. Define a ordem correta de TRUNCATE
        const tabelasParaLimpar = [
            'pedidos', 'sessoes_cliente', 'chamados', 'produtos', 'mesas', 'categorias', 'configuracoes'
        ];

        // 4. Executa o TRUNCATE para cada tabela
        for (const tabela of tabelasParaLimpar) {
            await query(`TRUNCATE TABLE ${tabela};`);
        }

        // 5. Reativa a verificação de chaves estrangeiras
        await query('SET FOREIGN_KEY_CHECKS = 1;');

        // 6. Registra o log da ação
        await registrarLog(req.usuario.id, req.usuario.nome, 'RESET_SISTEMA', 'O banco de dados foi resetado para o estado inicial (exceto logs e usuários).');

        // 7. Envia a resposta de sucesso
        res.status(200).json({ message: 'Sistema resetado com sucesso! Produtos, categorias, mesas e todas as sessões foram apagados.' });

    } catch (error) {
        console.error("Erro crítico ao resetar o banco de dados:", error);
        await query('SET FOREIGN_KEY_CHECKS = 1;');
        res.status(500).json({ message: 'Ocorreu um erro grave durante o reset do banco de dados.', error: error.message });
    }
});



// GET /api/configuracoes/:chaves
// Busca múltiplas configurações de uma vez. Ex: /api/configuracoes/fonte_cliente,permissoes_home
router.get('/configuracoes/:chaves', checarPermissaoConfig, async (req, res) => {
    try {
        const chaves = req.params.chaves.split(',');
        const placeholders = chaves.map(() => '?').join(',');
        const sql = `SELECT chave, valor FROM configuracoes WHERE chave IN (${placeholders})`;
        const resultados = await query(sql, chaves);
        const configs = resultados.reduce((obj, item) => {
            try {
                // Tenta fazer o parse do valor, se for um JSON válido (para permissões)
                obj[item.chave] = JSON.parse(item.valor);
            } catch (e) {
                // Se não for JSON, usa o valor como string (para a fonte)
                obj[item.chave] = item.valor;
            }
            return obj;
        }, {});
        res.json(configs);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao buscar configurações.' });
    }
});

// POST /api/configuracoes
// Salva uma ou mais configurações.
router.post('/configuracoes', checarPermissaoConfig, async (req, res) => {
    try {
        const configsParaSalvar = req.body;
        const promessas = [];

        for (const chave in configsParaSalvar) {
            if (Object.hasOwnProperty.call(configsParaSalvar, chave)) {
                let valor = configsParaSalvar[chave];
                // Se o valor for um objeto (como a lista de permissões), converte para string JSON
                if (typeof valor === 'object') {
                    valor = JSON.stringify(valor);
                }
                const sql = 'INSERT INTO configuracoes (chave, valor) VALUES (?, ?) ON DUPLICATE KEY UPDATE valor = ?';
                promessas.push(query(sql, [chave, valor, valor]));
            }
        }

        await Promise.all(promessas);
        await registrarLog(req.usuario.id, req.usuario.nome, 'ATUALIZOU_CONFIGS', `Salvou alterações na página de configurações.`);
        
        if (req.broadcast) {
            req.broadcast({ type: 'CONFIG_ATUALIZADA', payload: configsParaSalvar });
        }

        res.status(200).json({ message: 'Configurações salvas com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao salvar configurações.' });
    }
});

// GET /api/usuarios-para-relatorio
// Busca uma lista de todos os usuários para preencher o seletor.


// GET /api/relatorio-atividade?usuarioId=X&periodo=Y
// Gera o relatório de atividade.
router.get('/relatorio-atividade', checarPermissaoConfig, async (req, res) => {
    const { usuarioId, periodo } = req.query;
    if (!usuarioId || !periodo) return res.status(400).json({ message: 'ID do usuário e período são obrigatórios.' });
    try {
        const { inicio, fim } = obterIntervaloDeDatas(periodo);
        const sql = `SELECT acao, COUNT(id) as total FROM logs WHERE id_usuario = ? AND data_hora BETWEEN ? AND ? GROUP BY acao ORDER BY total DESC;`;
        const atividades = await query(sql, [usuarioId, inicio, fim]);
        res.json(atividades);
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao gerar relatório.' });
    }
});

// DELETE /api/usuarios/:id
// Rota para deletar um funcionário.
router.delete('/usuarios/:id', checarPermissaoConfig, async (req, res) => {
    const { id } = req.params;
    const idGerenteLogado = req.usuario.id;

    if (parseInt(id, 10) === idGerenteLogado) {
        return res.status(400).json({ message: 'Você não pode deletar a si mesmo.' });
    }

    try {
        const [usuario] = await query('SELECT nome FROM usuarios WHERE id = ?', [id]);
        if (!usuario) return res.status(404).json({ message: 'Funcionário não encontrado.' });

        await query('DELETE FROM usuarios WHERE id = ?', [id]);
        await registrarLog(req.usuario.id, req.usuario.nome, 'DELETOU_USUARIO', `Deletou o funcionário '${usuario.nome}' (ID: ${id}).`);
        res.status(200).json({ message: `Funcionário '${usuario.nome}' deletado com sucesso.` });
    } catch (error) {
        res.status(500).json({ message: 'Erro no servidor ao deletar funcionário.' });
    }
});

// POST /api/reset-database
// Rota perigosa para limpar as tabelas principais.
router.post('/reset-database', checarPermissaoConfig, async (req, res) => {
    const { secretKey } = req.body;

    if (!secretKey || secretKey !== process.env.RESET_SECRET_TOKEN) {
        return res.status(403).json({ message: 'Chave de acesso para reset inválida ou não fornecida.' });
    }

    try {
        await query('SET FOREIGN_KEY_CHECKS = 0;');
        const tabelasParaLimpar = ['pedidos', 'sessoes_cliente', 'chamados', 'produtos', 'categorias', 'configuracoes'];
        const promessasDeLimpeza = tabelasParaLimpar.map(tabela => query(`TRUNCATE TABLE ${tabela};`));
        await Promise.all(promessasDeLimpeza);
        await query('SET FOREIGN_KEY_CHECKS = 1;');
        await registrarLog(req.usuario.id, req.usuario.nome, 'RESET_DATABASE', 'Executou um reset completo do banco de dados.');
        if (req.broadcast) req.broadcast({ type: 'SISTEMA_RESETADO' });
        res.status(200).json({ message: 'O sistema foi resetado com sucesso!' });
    } catch (error) {
        await query('SET FOREIGN_KEY_CHECKS = 1;');
        res.status(500).json({ message: 'Ocorreu um erro grave durante o reset.' });
    }
});




module.exports = router;




