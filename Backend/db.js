// /Backend/db.js
const mysql = require('mysql2/promise');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12qw34as@ZX', // Sua senha
    database: 'cardapio_db'
};

async function query(sql, params) {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [results, ] = await connection.execute(sql, params);
        return results;
    } finally {
        await connection.end();
    }
}

// --- NOVA FUNÇÃO AQUI ---
async function registrarLog(idUsuario, nomeUsuario, acao, detalhes) {
    const sql = 'INSERT INTO logs (id_usuario, nome_usuario, acao, detalhes) VALUES (?, ?, ?, ?)';
    try {
        await query(sql, [idUsuario, nomeUsuario, acao, detalhes]);
    } catch (error) {
        console.error('Falha ao registrar log:', error);
        // Não quebra a aplicação se o log falhar, apenas registra o erro no console.
    }
}

// Exporta ambas as funções
module.exports = { query, registrarLog };
