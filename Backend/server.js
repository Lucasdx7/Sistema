// Backend/server.js

// --- 1. Módulos Necessários ---
const express = require('express');
const cors = require('cors');
const path = require('path'); // Essencial para lidar com caminhos de arquivos
const http = require('http' ); // Módulo HTTP nativo do Node.js
const { WebSocketServer } = require('ws'); // Biblioteca de WebSocket

const apiRoutes = require('./routes/api');

// --- 2. Configuração Inicial ---
const app = express();
const PORT = 3000;

// --- 3. Middlewares do Express ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- 4. Servindo os Arquivos do Frontend ---
// Esta é a linha mais importante para a sua estrutura de pastas.
// Ela diz ao Express: "Os arquivos públicos (HTML, CSS, JS) estão na pasta irmã chamada 'Frontend'".
// path.join(__dirname, '..', 'Frontend') significa: a partir daqui (__dirname), volte um nível (..), e entre em 'Frontend'.
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

wss.on('connection', ws => {
    console.log('Novo cliente conectado ao WebSocket!');
});

// Middleware para passar a função 'broadcast' para as rotas da API
app.use((req, res, next) => {
    req.broadcast = broadcast;
    next();
});

// --- 6. Rotas da API e das Páginas ---
app.use('/api', apiRoutes);

// Rota para a página de GERENCIAMENTO
app.get('/gerencia', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia.html'));
});

// Rota para a página do CLIENTE
app.get('/cardapio', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'Paginausuario.html'));
});

// Rota raiz: redireciona para o cardápio
app.get('/', (req, res) => {
    res.redirect('/cardapio');
});

// --- 7. Inicia o Servidor ---
server.listen(PORT, () => {
    console.log(`Servidor rodando!`);
    console.log(`Acesse o cardápio em http://localhost:${PORT}/cardapio` );
    console.log(`Acesse o painel em http://localhost:${PORT}/gerencia` );
});
