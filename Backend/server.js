// /Backend/server.js

// --- 1. Módulos Necessários ---
require('dotenv').config(); // <-- ESTA É A LINHA ADICIONADA. ELA DEVE SER A PRIMEIRA.

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http' );
const { WebSocketServer } = require('ws');

// --- 2. Importação das Rotas e Middlewares ---
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const { protegerRota } = require('./middleware/authMiddleware');

// --- 3. Configuração Inicial ---
const app = express();
const PORT = 3000;

// --- 4. Middlewares Globais do Express ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'Frontend')));

// --- 5. Configuração do Servidor WebSocket ---
const server = http.createServer(app );
const wss = new WebSocketServer({ server });

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}
wss.on('connection', ws => console.log('Novo cliente conectado ao WebSocket!'));

// Middleware para passar a função 'broadcast' para as rotas
app.use((req, res, next) => {
    req.broadcast = broadcast;
    next();
});

// --- 6. Definição das Rotas ---

// Rotas de Autenticação (públicas)
app.use('/auth', authRoutes);

// Aplica o middleware 'protegerRota' a TODAS as rotas da API.
app.use('/api', protegerRota, apiRoutes);

// --- Rotas para servir as páginas HTML ---
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'login.html'));
});
app.get('/gerencia-home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia-Home.html'));
});
app.get('/gerencia', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia.html'));
});
app.get('/logs', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'logs.html'));
});
app.get('/cardapio', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'Paginausuario.html'));
});

// Rota raiz: redireciona para a página de login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// --- 7. Inicia o Servidor ---
server.listen(PORT, () => {
    console.log(`Servidor rodando!`);
    console.log(`Acesse o painel em http://localhost:${PORT}/login` );
    console.log(`Acesse o cardápio em http://localhost:${PORT}/cardapio` );
});
