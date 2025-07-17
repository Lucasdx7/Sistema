// /Backend/server.js - VERSÃO DE DEPURAÇÃO PARA ENCONTRAR O ERRO

// --- 1. Módulos Necessários ---
console.log('[DEBUG] 1. Iniciando o carregamento dos módulos...');
require('dotenv').config();
const express = require('express');
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};
const cors = require('cors');
const path = require('path');
const http = require('http' );
const { WebSocketServer } = require('ws');
const url = require('url');
console.log('[DEBUG] 1. Módulos básicos carregados com sucesso.');

// --- 2. Importação das Rotas e Middlewares ---
console.log('[DEBUG] 2. Tentando carregar os arquivos de rotas e middlewares...');

// VAMOS CARREGAR UM DE CADA VEZ PARA ISOLAR O ERRO
console.log('[DEBUG] 2a. Carregando ./routes/auth.js...');
const authRoutes = require('./routes/auth');
console.log('[DEBUG] 2a. SUCESSO: ./routes/auth.js carregado.');

console.log('[DEBUG] 2b. Carregando ./routes/api.js...');
const apiRoutes = require('./routes/api');
console.log('[DEBUG] 2b. SUCESSO: ./routes/api.js carregado.');

console.log('[DEBUG] 2c. Carregando ./middleware/authMiddleware.js...');
const { protegerRota } = require('./middleware/authMiddleware');
console.log('[DEBUG] 2c. SUCESSO: ./middleware/authMiddleware.js carregado.');

console.log('[DEBUG] 2. Todos os arquivos de rotas e middlewares foram carregados sem erro.');

// --- 3. Configuração Inicial ---
console.log('[DEBUG] 3. Configurando o Express...');
const app = express();
const PORT = 3000;
console.log('[DEBUG] 3. Express configurado.');

// --- 4. Middlewares Globais do Express ---
console.log('[DEBUG] 4. Aplicando middlewares globais (cors, json, etc)...');
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'Frontend')));
console.log('[DEBUG] 4. Middlewares globais aplicados.');

// --- 5. Configuração do Servidor WebSocket ---
console.log('[DEBUG] 5. Configurando o servidor HTTP e WebSocket...');
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
        if (client.sessaoId === sessaoId && client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Lógica de conexão WebSocket
wss.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    const sessaoId = parameters.query.sessaoId;
    if (sessaoId) {
        ws.sessaoId = sessaoId;
        // Removido console.log daqui para não poluir o teste
    }
    ws.on('close', () => {});
    ws.on('error', (error) => {});
});

// Disponibiliza as funções de envio para as rotas da API
app.use((req, res, next) => {
    req.broadcast = broadcast;
    req.sendToSession = sendToSession;
    next();
});
console.log('[DEBUG] 5. Servidor WebSocket configurado.');

// --- 6. Definição das Rotas ---
console.log('[DEBUG] 6. Tentando VINCULAR as rotas ao Express...');

// VAMOS VINCULAR UMA DE CADA VEZ
console.log('[DEBUG] 6a. Vinculando rota /auth...');
app.use('/auth', authRoutes);
console.log('[DEBUG] 6a. SUCESSO: Rota /auth vinculada.');

console.log('[DEBUG] 6b. Vinculando rota /api...');
app.use('/api', protegerRota, apiRoutes);
console.log('[DEBUG] 6b. SUCESSO: Rota /api vinculada.');

console.log('[DEBUG] 6. Todas as rotas principais foram vinculadas sem erro.');

// --- Rotas para servir as páginas HTML ---
console.log('[DEBUG] Servindo rotas de arquivos HTML...');
app.get('/login-gerencia', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'login.html')); });
app.get('/gerencia-home', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia-Home.html')); });
app.get('/gerencia', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia.html')); });
app.get('/gerencia-mesas', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'gerencia_mesas.html')); });
app.get('/logs', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'logs.html')); });
app.get('/cardapio', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'Paginausuario.html')); });
app.get('/conta', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'conta_cliente.html')); });
app.get('/confirmar-pedido', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'confirmar_pedido.html')); });
app.get('/login', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'login_cliente.html')); });
app.get('/dados-cliente', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'dados_cliente.html')); });
app.get('/chamados', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'chamado.html')); });
app.get('/relatorios', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'relatorio.html')); });
app.get('/acompanhar', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'pedidos.html')); });
app.get('/configuracoes', (req, res) => { res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'configuracoes.html')); });

app.get('/', (req, res) => { res.redirect('/login'); });
console.log('[DEBUG] Rotas de arquivos HTML servidas.');

const HOST = '0.0.0.0'; // Escuta em todos os endereços de rede disponíveis

console.log('[DEBUG] 7. TENTANDO INICIAR O SERVIDOR...');
server.listen(PORT, HOST, () => {
    // Para obter o IP local dinamicamente (opcional, mas útil)
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIp = 'localhost';
    // Procura pelo endereço IPv4 na rede local
    for (const name of Object.keys(networkInterfaces)) {
        for (const net of networkInterfaces[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                localIp = net.address;
                break;
            }
        }
        if (localIp !== 'localhost') break;
    }

    console.log('================================================');
    console.log('🎉 SERVIDOR INICIADO COM SUCESSO! 🎉');
    console.log(`🚀 Servidor rodando em rede local no endereço: http://${localIp}:${PORT}` );
    console.log('================================================');
    console.log(`Acesse o cardápio (login do cliente) em: http://${localIp}:${PORT}/login` );
    console.log(`Acesse o painel (login da gerência) em: http://${localIp}:${PORT}/login-gerencia` );
    console.log('================================================');
});
