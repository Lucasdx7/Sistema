// /Backend/middleware/authMiddleware.js

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'seu_segredo_super_secreto_aqui'; // O mesmo segredo usado em auth.js

function protegerRota(req, res, next) {
    // O token geralmente é enviado no cabeçalho 'Authorization' no formato 'Bearer TOKEN'
    // Mas para proteger páginas HTML, é mais fácil verificar um cookie ou o localStorage no frontend.
    // Aqui, vamos criar uma lógica simples que pode ser expandida.
    // Por enquanto, vamos focar em proteger as rotas da API.

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Pega o token do 'Bearer TOKEN'

    if (token == null) {
        // Se não há token, o acesso é não autorizado.
        return res.sendStatus(401); // Unauthorized
    }

    jwt.verify(token, JWT_SECRET, (err, usuario) => {
        if (err) {
            // Se o token for inválido (expirado, malformado), o acesso é proibido.
            return res.sendStatus(403); // Forbidden
        }

        // Se o token for válido, salvamos os dados do usuário na requisição
        // para que as próximas rotas possam usá-los (ex: verificar nível de acesso).
        req.usuario = usuario;
        next(); // Passa para a próxima etapa (a rota que o usuário queria acessar)
    });
}

module.exports = { protegerRota };
