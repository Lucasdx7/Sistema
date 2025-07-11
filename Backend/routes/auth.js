// /Backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const { query } = require('../db');

const JWT_SECRET = 'seu_segredo_super_secreto_aqui';

// --- NOSSO CÓDIGO SECRETO DE REGISTRO ---
// Mude este código para algo que só você saiba.
const REGISTRO_TOKEN_SECRETO = "teste";

// ROTA DE LOGIN (sem alterações)
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const results = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (results.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const usuario = results[0];
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, nivel_acesso: usuario.nivel_acesso },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({ token, usuario: { nome: usuario.nome, nivel_acesso: usuario.nivel_acesso } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});

// ROTA PARA CRIAR UM NOVO USUÁRIO (AGORA COM VALIDAÇÃO DE TOKEN)
router.post('/register', async (req, res) => {
    // 1. Pega o token de registro do corpo da requisição
    const { nome, email, senha, nivel_acesso, tokenSecreto } = req.body;

    // 2. Valida o token secreto
    if (tokenSecreto !== REGISTRO_TOKEN_SECRETO) {
        return res.status(403).json({ message: 'Código de registro inválido.' }); // 403 Forbidden
    }

    // 3. Valida os outros campos
    if (!nome || !email || !senha || !nivel_acesso) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    if (!['geral', 'pedidos'].includes(nivel_acesso)) {
        return res.status(400).json({ message: 'Nível de acesso inválido.' });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const result = await query(
            'INSERT INTO usuarios (nome, email, senha, nivel_acesso) VALUES (?, ?, ?, ?)',
            [nome, email, senhaHash, nivel_acesso]
        );
        res.status(201).json({ message: 'Usuário criado com sucesso!', id: result.insertId });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Este email já está em uso.' });
        }
        res.status(500).json({ message: 'Erro ao criar usuário.' });
    }
});

module.exports = router;
