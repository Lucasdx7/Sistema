// /Backend/middleware/authMiddleware.js - VERSÃO ATUALIZADA E CORRIGIDA

const jwt = require('jsonwebtoken');
const { query } = require('../db');

const protegerRota = async (req, res, next) => {
    let token;

    // Verifica se o token está no cabeçalho e começa com "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 1. Extrai o token do cabeçalho (formato: "Bearer TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // 2. Decodifica o token para ver o que tem dentro
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // --- LÓGICA ATUALIZADA PARA LIDAR COM MÚLTIPLOS TIPOS DE LOGIN ---
            let usuarioEncontrado;

            // 3. Verifica o tipo de entidade no token (se é 'mesa' ou um gerente/usuário padrão)
            if (decoded.tipo === 'mesa') {
                // Se for uma MESA, busca na tabela 'mesas'
                [usuarioEncontrado] = await query('SELECT id, nome_usuario FROM mesas WHERE id = ?', [decoded.id]);
                // Adiciona o tipo para uso posterior nas rotas
                if (usuarioEncontrado) usuarioEncontrado.tipo = 'mesa';
            } else {
                // Se não for uma mesa (ou não tiver o campo 'tipo'), assume que é um USUÁRIO da gerência
                [usuarioEncontrado] = await query('SELECT id, nome, email, nivel_acesso FROM usuarios WHERE id = ?', [decoded.id]);
                if (usuarioEncontrado) usuarioEncontrado.tipo = 'usuario';
            }
            // -----------------------------------------------------------------

            // 4. Verifica se a entidade (mesa ou usuário) foi encontrada no banco
            if (!usuarioEncontrado) {
                return res.status(401).json({ message: 'Não autorizado, usuário não encontrado.' });
            }

            // 5. Anexa os dados do usuário/mesa ao objeto 'req' para que as rotas possam usá-lo
            req.usuario = usuarioEncontrado;
            next(); // Tudo certo, pode prosseguir para a rota solicitada

        } catch (error) {
            console.error('Erro de autenticação:', error.message);
            return res.status(401).json({ message: 'Não autorizado, token inválido.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Não autorizado, nenhum token fornecido.' });
    }
};

module.exports = { protegerRota };
