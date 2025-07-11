// /Backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { query } = require('../db');

const protegerRota = async (req, res, next) => {
    let token;

    // Verifica se o cabeçalho de autorização existe e começa com "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extrai o token do cabeçalho (remove "Bearer ")
            token = req.headers.authorization.split(' ')[1];

            // 2. Verifica e decodifica o token usando a mesma chave secreta
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 3. Busca o usuário no banco de dados pelo ID do token (sem a senha)
            // e anexa ao objeto da requisição (req) para uso nas próximas rotas.
            const [rows] = await query('SELECT id, nome, email, nivel_acesso FROM usuarios WHERE id = ?', [decoded.id]);
            
            if (rows) {
                req.usuario = rows; // Anexa o objeto do usuário à requisição
                next(); // Passa para a próxima etapa (a rota da API)
            } else {
                res.status(401).json({ message: 'Não autorizado, usuário não encontrado.' });
            }

        } catch (error) {
            console.error('Erro na autenticação do token:', error);
            res.status(401).json({ message: 'Não autorizado, token inválido.' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    }
};

module.exports = { protegerRota };
