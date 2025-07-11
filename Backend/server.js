// /Backend/server.js

// --- 1. Módulos Necessários ---
require('dotenv').config();

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

app.use((req, res, next) => {
    req.broadcast = broadcast;
    next();
});

// --- 6. Definição das Rotas ---

// As rotas de autenticação agora são acessadas via /auth
// Ex: /auth/login, /auth/register, /auth/login-cliente
app.use('/auth', authRoutes);

// Aplica o middleware 'protegerRota' a TODAS as rotas da API.
app.use('/api', protegerRota, apiRoutes);

// --- Rotas para servir as páginas HTML ---

// --- PÁGINAS DA GERÊNCIA ---
app.get('/login-gerencia', (req, res) => { // Renomeado para evitar conflito
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'login.html'));
});
app.get('/gerencia-home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia-Home.html'));
});
app.get('/gerencia', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia.html'));
});

// NOVA ROTA PARA A PÁGINA DE GERENCIAMENTO DE MESAS
app.get('/gerencia-mesas', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'gerencia_mesas.html'));
});

app.get('/logs', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'logs.html'));
});

// --- PÁGINAS DO CLIENTE (TABLET) ---
app.get('/cardapio', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'Paginausuario.html'));
});

// ==================================================================
// NOVA ROTA PARA A PÁGINA DE LOGIN DO CLIENTE
// ==================================================================
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'login_cliente.html'));
});

app.get('/dados-cliente', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'dados_cliente.html'));
});


// Rota raiz: redireciona para a página de login do CLIENTE
app.get('/', (req, res) => {
    res.redirect('/login');
});

// --- 7. Inicia o Servidor ---
server.listen(PORT, () => {
    console.log(`Servidor rodando!`);
    // Mensagens atualizadas para refletir as novas rotas
    console.log(`Acesse o cardápio (login do cliente) em: http://localhost:${PORT}/login` );
    console.log(`Acesse o painel (login da gerência) em: http://localhost:${PORT}/login-gerencia` );
});
