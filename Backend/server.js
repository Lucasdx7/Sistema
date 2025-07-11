// /Backend/server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http' );
const { WebSocketServer } = require('ws');

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const { protegerRota } = require('./middleware/authMiddleware');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'Frontend')));

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

app.use((req, res, next) => {
    req.broadcast = broadcast;
    next();
});

app.use('/auth', authRoutes);
app.use('/api', protegerRota, apiRoutes);

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'login.html'));
});

app.get('/gerencia-home', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia-Home.html'));
});

app.get('/gerencia', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina gerencia', 'Gerencia.html'));
});

// ROTA PARA A PÁGINA DE LOGS REMOVIDA

app.get('/cardapio', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'Pagina cliente', 'Paginausuario.html'));
});

app.get('/', (req, res) => {
    res.redirect('/login');
});

server.listen(PORT, () => {
    console.log(`Servidor rodando!`);
    console.log(`Acesse o painel em http://localhost:${PORT}/login` );
});
