const express = require('express');
const router = express.Router();
const { query, registrarLog } = require('../db');
const bcrypt = require('bcryptjs');

const authMiddleware = require('../middleware/authMiddleware'); 

const PDFDocument = require('pdfkit');
const fs = require('fs'); 

const fetch = require('node-fetch');

// NOVA LINHA DE IMPORTAÇÃO - MAIS ROBUSTA
const thermalPrinter = require('node-thermal-printer');


// --- Middleware de verificação ---
// Middleware de verificação (seu código original, mantido como está)
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
router.put('/produtos/:id', checarUsuarioParaLog, async (req, res) => {
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

// ==================================================================
// --- ROTA DE SESSÕES COM A CONSULTA DO TOTAL CORRIGIDA ---
// ==================================================================
router.get('/mesas/:id/sessoes', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params; // ID da mesa
    try {
        // --- CONSULTA SQL CORRIGIDA E MAIS ROBUSTA ---
        // Esta consulta agora calcula o 'total_gasto' de forma explícita,
        // somando apenas os pedidos onde o status é DIFERENTE de 'cancelado'.
        const sql = `
            SELECT 
                sc.id, 
                sc.nome_cliente, 
                sc.data_inicio, 
                sc.data_fim, 
                sc.status,
                (
                    SELECT SUM(p.quantidade * p.preco_unitario) 
                    FROM pedidos p 
                    WHERE p.id_sessao = sc.id AND p.status != 'cancelado'
                ) AS total_gasto
            FROM sessoes_cliente sc
            WHERE sc.id_mesa = ?
            ORDER BY sc.data_inicio DESC;
        `;
        
        const sessoes = await query(sql, [id]);

        // Formata o resultado para garantir que o total seja um número
        const sessoesFormatadas = sessoes.map(s => ({
            ...s,
            total_gasto: parseFloat(s.total_gasto) || 0 
        }));
        
        res.json(sessoesFormatadas);

    } catch (error) {
        console.error(`Erro ao buscar sessões da mesa ID ${id}:`, error);
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
router.get('/sessoes/:id/conta', checarUsuarioParaLog, async (req, res) => {
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
router.post('/sessoes/:id/fechar', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params; // id da sessão
    try {
        const result = await query(
            "UPDATE sessoes_cliente SET status = 'finalizada', data_fim = NOW() WHERE id = ? AND status = 'ativa'",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Sessão não encontrada ou já está finalizada.' });
        }

        // --- CORREÇÃO APLICADA AQUI ---
        // Determina qual nome usar para o log: 'nome' para gerentes, 'nome_usuario' para mesas.
        const nomeParaLog = req.usuario.nome || req.usuario.nome_usuario;

        // Agora, passamos a variável correta para a função de log.
        await registrarLog(req.usuario.id, nomeParaLog, 'FECHOU_SESSAO', `Fechou a sessão ID ${id}.`);
        // ------------------------------------

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
router.post('/pedidos', checarUsuarioParaLog, async (req, res) => {
    // Adicionamos 'observacao' à desestruturação
    const { id_sessao, id_produto, preco_unitario, observacao } = req.body;
    if (!id_sessao || !id_produto || preco_unitario === undefined) {
        return res.status(400).json({ message: 'Dados do pedido incompletos ou inválidos.' });
    }
    try {
        // Atualizamos a query e os parâmetros para incluir a observacao
        const sql = 'INSERT INTO pedidos (id_sessao, id_produto, preco_unitario, quantidade, observacao) VALUES (?, ?, ?, ?, ?)';
        const params = [id_sessao, id_produto, preco_unitario, 1, observacao || null];
        
        const result = await query(sql, params);
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



// **ROTA AJUSTADA** POST /pedidos/:id/cancelar (Cancela um item de pedido específico)
router.post('/pedidos/:id/cancelar', checarUsuarioParaLog, async (req, res) => {
    const { id } = req.params; // ID do item do pedido
    const { motivo } = req.body;

    // Verificação de Permissão
    if (req.usuario.nivel_acesso !== 'geral') {
        return res.status(403).json({ message: 'Acesso negado. Apenas a gerência pode cancelar itens.' });
    }

    if (!motivo || motivo.trim() === '') {
        return res.status(400).json({ message: 'O motivo do cancelamento é obrigatório.' });
    }

    try {
        // Verifica se o pedido existe
        const [pedido] = await query('SELECT * FROM pedidos WHERE id = ?', [id]);
        if (!pedido) {
            return res.status(404).json({ message: 'Item do pedido não encontrado.' });
        }
        if (pedido.status === 'cancelado') {
            return res.status(400).json({ message: 'Este item já foi cancelado.' });
        }

        // Atualiza o status do item no banco de dados
        await query(
            "UPDATE pedidos SET status = 'cancelado', motivo_cancelamento = ? WHERE id = ?",
            [motivo.trim(), id]
        );
        
        // Registra o log da ação
        const nomeGerente = req.usuario.nome;
        await registrarLog(req.usuario.id, nomeGerente, 'CANCELOU_PEDIDO', `Cancelou o item de pedido ID ${id} pelo motivo: "${motivo.trim()}".`);

        // A query que causava o erro foi REMOVIDA daqui.

        res.json({ message: 'Item do pedido cancelado com sucesso!' });

    } catch (error) {
        console.error('Erro ao cancelar item do pedido:', error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// **ROTA FINAL** GET /sessoes/:id/pedidos (Busca todos os pedidos de uma sessão)
router.get('/sessoes/:id/pedidos', checarUsuarioParaLog, async (req, res) => {
    // 1. ADICIONAR ESTA VERIFICAÇÃO DE PERMISSÃO
    if (req.usuario.nivel_acesso !== 'geral') {
        return res.status(403).json({ message: 'Acesso negado. Rota exclusiva para gerentes.' });
    }
    // 2. O RESTO DO CÓDIGO PERMANECE IGUAL
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

router.patch('/produtos/:id/sugestao', checarUsuarioParaLog, async (req, res) => {
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


module.exports = router;
