// /Backend/server.js - VERSÃO COMPLETA E ATUALIZADA

// --- 1. Módulos Necessários ---
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http' );
const { WebSocketServer } = require('ws');
const url = require('url'); // Módulo para extrair parâmetros da URL

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

// --- 5. Configuração do Servidor WebSocket (LÓGICA ATUALIZADA) ---
const server = http.createServer(app );
const wss = new WebSocketServer({ server });

// Função para enviar uma mensagem para TODOS os clientes (broadcast)
function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// NOVA FUNÇÃO: Envia uma mensagem para uma sessão específica
function sendToSession(sessaoId, data) {
    wss.clients.forEach(client => {
        // Verifica se o cliente está "etiquetado" com a sessaoId correta
        if (client.sessaoId === sessaoId && client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Lógica de conexão WebSocket atualizada para "etiquetar" clientes
wss.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    const sessaoId = parameters.query.sessaoId;

    if (sessaoId) {
        // Associa o ID da sessão à conexão WebSocket
        ws.sessaoId = sessaoId;
        console.log(`Cliente WebSocket conectado para a sessão: ${sessaoId}`);
    } else {
        console.log('Cliente WebSocket conectado sem ID de sessão (conexão genérica/gerência).');
    }

    ws.on('close', () => {
        console.log(`Cliente WebSocket da sessão ${ws.sessaoId || '(desconhecida)'} desconectado.`);
    });

    ws.on('error', (error) => {
        console.error(`Erro no WebSocket da sessão ${ws.sessaoId || '(desconhecida)'}:`, error);
    });
});

// Disponibiliza as funções de envio para as rotas da API
app.use((req, res, next) => {
    req.broadcast = broadcast;
    req.sendToSession = sendToSession; // Disponibiliza a nova função
    next();
});

// --- 6. Definição das Rotas ---
app.use('/auth', authRoutes);
app.use('/api', protegerRota, apiRoutes);

// --- Rotas para servir as páginas HTML (sem alterações) ---
app.get('/login-gerencia', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'login.html')); });

app.get('/gerencia-home', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia-Home.html')); });

app.get('/gerencia', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia.html')); });

app.get('/gerencia-mesas', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'gerencia_mesas.html')); });

app.get('/logs', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'logs.html')); });

app.get('/cardapio', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'Paginausuario.html')); });

app.get('/conta', (req, res ) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'conta_cliente.html')); });

app.get('/confirmar-pedido', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'confirmar_pedido.html')); });

app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'login_cliente.html')); });

app.get('/dados-cliente', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'dados_cliente.html')); });

app.get('/', (req, res) => { res.redirect('/login'); });

// --- 7. Inicia o Servidor ---
server.listen(PORT, () => {
    console.log(`Servidor rodando!`);
    console.log(`Acesse o cardápio (login do cliente) em: http://localhost:${PORT}/login` );
    console.log(`Acesse o painel (login da gerência) em: http://localhost:${PORT}/login-gerencia` );
});
