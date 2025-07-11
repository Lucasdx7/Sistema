// /Backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const router = express.Router();

// Função para gerar o token JWT
const gerarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token expira em 1 dia
    });
};

// Rota de Registro: POST /auth/register
router.post('/register', async (req, res) => {
    const { nome, email, senha, nivel_acesso, tokenSecreto } = req.body;

    // Validação do token de registro secreto
    if (tokenSecreto !== process.env.REGISTER_SECRET_TOKEN) {
        return res.status(403).json({ message: 'Código de registro inválido.' });
    }

    if (!nome || !email || !senha || !nivel_acesso) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
        const [userExists] = await query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (userExists) {
            return res.status(400).json({ message: 'Este email já está em uso.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const result = await query(
            'INSERT INTO usuarios (nome, email, senha, nivel_acesso) VALUES (?, ?, ?, ?)',
            [nome, email, senhaHash, nivel_acesso]
        );

        res.status(201).json({
            id: result.insertId,
            nome: nome,
            email: email,
            nivel_acesso: nivel_acesso,
        });

    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: 'Erro no servidor ao tentar registrar.' });
    }
});

// Rota de Login: POST /auth/login
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const [usuario] = await query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (usuario && (await bcrypt.compare(senha, usuario.senha))) {
            // Sucesso no login
            res.json({
                token: gerarToken(usuario.id),
                usuario: {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    nivel_acesso: usuario.nivel_acesso,
                },
            });
        } else {
            // Falha no login
            res.status(401).json({ message: 'Email ou senha inválidos.' });
        }
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ message: 'Erro no servidor ao tentar fazer login.' });
    }
});

module.exports = router;
