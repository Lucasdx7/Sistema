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

            // 3. LÓGICA APRIMORADA: Verifica o 'role' (papel) dentro do token
            //    para saber em qual tabela procurar.
            if (decoded.role === 'cliente') {
                // ===================================================
                // CASO 1: O TOKEN É DE UM CLIENTE (MESA/TABLET)
                // ===================================================
                // Busca o ID na tabela 'mesas'.
                const [mesa] = await query('SELECT id, nome_usuario FROM mesas WHERE id = ?', [decoded.id]);
                
                if (!mesa) {
                    // Se a mesa foi deletada, mas o token ainda existe.
                    return res.status(401).json({ message: 'Não autorizado, a mesa para este tablet não foi encontrada.' });
                }
                
                // Anexa os dados da MESA à requisição.
                // O objeto 'req.usuario' agora conterá as informações da mesa.
                req.usuario = { id: mesa.id, nome: mesa.nome_usuario, role: 'cliente' };

            } else {
                // ===================================================
                // CASO 2: O TOKEN É DE UM GERENTE/FUNCIONÁRIO
                // ===================================================
                // Busca o ID na tabela 'usuarios'.
                const [usuario] = await query('SELECT id, nome, email, nivel_acesso FROM usuarios WHERE id = ?', [decoded.id]);
                
                if (!usuario) {
                    return res.status(401).json({ message: 'Não autorizado, usuário não encontrado.' });
                }
                
                // Anexa os dados do USUÁRIO à requisição.
                req.usuario = usuario;
            }

            // 4. Se encontrou um usuário ou uma mesa, permite o acesso à rota.
            next();

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
