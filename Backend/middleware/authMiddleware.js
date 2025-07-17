// /Backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const { query } = require('../configurar/db');

const protegerRota = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            let usuarioEncontrado;
            if (decoded.tipo === 'mesa') {
                [usuarioEncontrado] = await query('SELECT id, nome_usuario FROM mesas WHERE id = ?', [decoded.id]);
                if (usuarioEncontrado) usuarioEncontrado.tipo = 'mesa';
            } else {
                [usuarioEncontrado] = await query('SELECT id, nome, email, nivel_acesso FROM usuarios WHERE id = ?', [decoded.id]);
                if (usuarioEncontrado) usuarioEncontrado.tipo = 'usuario';
            }

            if (!usuarioEncontrado) {
                return res.status(401).json({ message: 'Não autorizado, usuário não encontrado.' });
            }

            req.usuario = usuarioEncontrado;
            next();

        } catch (error) {
            console.error('Erro de autenticação:', error.message);
            return res.status(401).json({ message: 'Não autorizado, token inválido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    }
};


// ==================================================================
// --- FUNÇÃO ADICIONADA AQUI ---
// ==================================================================
/**
 * Middleware que verifica se o usuário tem um dos níveis de acesso permitidos.
 * @param {Array<string>} niveisPermitidos - Um array com os nomes dos níveis permitidos (ex: ['geral', 'pedidos']).
 */
const checarNivelAcesso = (niveisPermitidos) => {
    return (req, res, next) => {
        const nivelUsuario = req.usuario?.nivel_acesso;

        if (!nivelUsuario || !niveisPermitidos.includes(nivelUsuario)) {
            return res.status(403).json({ message: 'Acesso negado. Você não tem permissão para executar esta ação.' });
        }

        next();
    };
};


// ==================================================================
// --- EXPORTAÇÃO CORRIGIDA AQUI ---
// Adicionamos 'checarNivelAcesso' ao objeto de exportação.
// ==================================================================
module.exports = { protegerRota, checarNivelAcesso };
