// /Backend/server.js - VERSÃO FINAL E CORRIGIDA

// --- 1. Módulos Necessários ---
console.log('[DEBUG] 1. Iniciando o carregamento dos módulos...');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http' );
const { WebSocketServer } = require('ws');
const url = require('url');
console.log('[DEBUG] 1. Módulos básicos carregados com sucesso.');

// --- 2. Importação das Rotas e Middlewares ---
console.log('[DEBUG] 2. Tentando carregar os arquivos de rotas e middlewares...');
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');
const publicRoutes = require('./routes/public'); // Rota pública
const { protegerRota } = require('./middleware/authMiddleware');
console.log('[DEBUG] 2. Todos os arquivos de rotas e middlewares foram carregados sem erro.');

// --- 3. Configuração Inicial ---
console.log('[DEBUG] 3. Configurando o Express...');
const app = express();
const PORT = process.env.PORT || 3000; // Usa a porta do ambiente ou 3000 como padrão
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

function broadcast(data) {
    wss.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

wss.on('connection', (ws, req) => {
    const parameters = url.parse(req.url, true);
    const sessaoId = parameters.query.sessaoId;
    if (sessaoId) {
        ws.sessaoId = sessaoId;
    }
    ws.on('error', (error) => console.error('Erro no WebSocket:', error));
});

app.use((req, res, next) => {
    req.broadcast = broadcast;
    next();
});
console.log('[DEBUG] 5. Servidor WebSocket configurado.');

// --- 6. Definição das Rotas da API ---
console.log('[DEBUG] 6. Vinculando as rotas da API...');

// ROTA PÚBLICA (para fontes, permissões, etc.) - SEM PROTEÇÃO
// **DEVE VIR ANTES** da rota principal da API para não ser bloqueada.
app.use('/api/public', publicRoutes);
console.log('[DEBUG] 6a. Rota PÚBLICA /api/public vinculada.');

// ROTA DE AUTENTICAÇÃO (login, registro) - SEM PROTEÇÃO
app.use('/auth', authRoutes);
console.log('[DEBUG] 6b. Rota de AUTENTICAÇÃO /auth vinculada.');

// ROTA PRINCIPAL DA API - COM PROTEÇÃO
app.use('/api', protegerRota, apiRoutes);
console.log('[DEBUG] 6c. Rota PROTEGIDA /api vinculada.');

// --- 7. Rotas para servir as páginas HTML ---
console.log('[DEBUG] 7. Servindo rotas de arquivos HTML...');
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
console.log('[DEBUG] 7. Rotas de arquivos HTML servidas.');

// --- 8. Inicia o Servidor ---
console.log('[DEBUG] 8. TENTANDO INICIAR O SERVIDOR...');
server.listen(PORT, () => {
    console.log('================================================');
    console.log('🎉 SERVIDOR INICIADO COM SUCESSO! 🎉');
    console.log(`Acesse o cardápio (login do cliente) em: http://localhost:${PORT}/login` );
    console.log(`Acesse o painel (login da gerência) em: http://localhost:${PORT}/login-gerencia` );
    console.log('================================================');
});
