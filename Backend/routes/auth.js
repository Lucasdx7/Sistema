// /Backend/routes/auth.js - VERSÃO COMPLETA E CORRIGIDA

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../configurar/db');
const router = express.Router();

// Função para gerar o token JWT para a GERÊNCIA
const gerarToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1d', // Token da gerência expira em 1 dia
    });
};

// Rota de Registro de Gerente/Funcionário: POST /auth/register
router.post('/register', async (req, res) => {
    const { nome, email, senha, nivel_acesso, tokenSecreto, usuario } = req.body;

    if (tokenSecreto !== process.env.REGISTER_SECRET_TOKEN) {
        return res.status(403).json({ message: 'Código de registro inválido.' });
    }

    if (!nome || !email || !senha || !nivel_acesso || !usuario) {
        return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
    }

    try {
        const [userExists] = await query('SELECT * FROM usuarios WHERE email = ? OR usuario = ?', [email, usuario]);
        if (userExists) {
            return res.status(400).json({ message: 'Este email ou nome de usuário já está em uso.' });
        }

        const salt = await bcrypt.genSalt(10);
        const senhaHash = await bcrypt.hash(senha, salt);

        const result = await query(
            'INSERT INTO usuarios (nome, email, senha, nivel_acesso, usuario) VALUES (?, ?, ?, ?, ?)',
            [nome, email, senhaHash, nivel_acesso, usuario]
        );

        res.status(201).json({
            id: result.insertId,
            nome: nome,
            email: email,
            usuario: usuario,
            nivel_acesso: nivel_acesso,
        });

    } catch (error) {
        console.error("Erro no registro:", error);
        res.status(500).json({ message: 'Erro no servidor ao tentar registrar.' });
    }
});

// Rota de Login da GERÊNCIA: POST /auth/login
// No seu arquivo de rotas de autenticação do backend
// SUBSTITUA A ROTA /auth/login por esta versão

router.post('/login', async (req, res) => {
    // Aceita tanto 'email' quanto 'nome_usuario'
    const { email, nome_usuario, senha } = req.body;
    const loginIdentifier = email || nome_usuario;

    if (!loginIdentifier || !senha) {
        return res.status(400).json({ message: 'Credenciais de login e senha são obrigatórias.' });
    }

    try {
        // A consulta agora verifica tanto a coluna 'email' quanto a 'nome'
        const sql = 'SELECT * FROM usuarios WHERE email = ? OR nome = ?';
        const [usuario] = await query(sql, [loginIdentifier, loginIdentifier]);

        if (!usuario) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const senhaValida = await bcrypt.compare(senha, usuario.senha);
        if (!senhaValida) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const payload = { id: usuario.id, nome: usuario.nome, nivel_acesso: usuario.nivel_acesso };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

        res.json({
            message: 'Login bem-sucedido!',
            token: token,
            usuario: payload // Envia os dados do usuário para o frontend
        });

    } catch (error) {
        console.error("Erro na autenticação:", error);
        res.status(500).json({ message: 'Erro interno no servidor.' });
    }
});


// ==================================================================
// ROTA CORRIGIDA PARA LOGIN DO CLIENTE (TABLET/MESA)
// ==================================================================
router.post('/login-cliente', async (req, res) => {
    // Espera 'nome_usuario' para ser consistente com o frontend e a criação de mesas
    const { nome_usuario, senha } = req.body;

    if (!nome_usuario || !senha) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const [mesa] = await query('SELECT * FROM mesas WHERE nome_usuario = ?', [nome_usuario]);

        if (!mesa || !(await bcrypt.compare(senha, mesa.senha))) {
            // Se a mesa não existe OU a senha está incorreta, retorna o mesmo erro
            return res.status(401).json({ message: 'Usuário da mesa ou senha inválida.' });
        }

        // Sucesso! Gera um token JWT para a sessão da mesa
        const token = jwt.sign(
            { id: mesa.id, nome: mesa.nome_usuario, tipo: 'mesa' },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({
            message: 'Login da mesa bem-sucedido!',
            token: token,
            mesa: {
                id: mesa.id,
                nome_usuario: mesa.nome_usuario
            }
        });

    } catch (error) {
        console.error("Erro no login da mesa:", error);
        res.status(500).json({ message: 'Erro no servidor ao tentar fazer login.' });
    }
});


// ==================================================================
// ROTA PARA AUTENTICAR UM FUNCIONÁRIO PARA AÇÕES RESTRITAS
// (Mantida aqui para uso futuro, se necessário)
// ==================================================================
router.post('/login-funcionario', async (req, res) => {
    const { nome_usuario, senha } = req.body;

    if (!nome_usuario || !senha) {
        return res.status(400).json({ message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        // Usa a coluna 'usuario' da tabela 'usuarios'
        const [user] = await query('SELECT * FROM usuarios WHERE usuario = ?', [nome_usuario]);

        if (!user || !(await bcrypt.compare(senha, user.senha))) {
            return res.status(401).json({ message: 'Credenciais de funcionário inválidas.' });
        }

        // Apenas confirma a autenticação, sem gerar token
        res.status(200).json({ message: 'Funcionário autenticado com sucesso.' });

    } catch (error) {
        console.error('Erro na autenticação do funcionário:', error);
        res.status(500).json({ message: 'Erro no servidor durante a autenticação.' });
    }
});


module.exports = router;
