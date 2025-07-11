// /Backend/db.js
const mysql = require('mysql2/promise');

// Configuração da conexão com o banco de dados
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '12qw34as@ZX', // Sua senha do MySQL
    database: 'cardapio_db'
};

// Função helper para executar queries
async function query(sql, params) {
    const connection = await mysql.createConnection(dbConfig);
    try {
        const [results, ] = await connection.execute(sql, params);
        return results;
    } finally {
        await connection.end();
    }
}

// Exporta apenas a função 'query'
module.exports = { query };
