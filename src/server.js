// server.js
const express = require('express');
const session = require('express-session');

const cors = require('cors'); // 👈 Adicione esta dependência
require('dotenv').config();

const metaAuthRouter = require('./routes/metaAuth');
const metaCallbackRouter = require('./routes/metaCallback');
const authRoutes = require('./routes/authRoutes');

const app = express();

// ✅ CORS - Permitir requisições do React (porta 3000)
app.use(cors({
    origin: 'http://localhost:3000', // Seu frontend React
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Middleware de Log - Ver todas as requisições
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    console.log(`🔗 Protocol: ${req.protocol}`); // Mostra se é http ou https
    console.log(`🌐 Origin: ${req.get('origin') || 'Direct access'}`);
    next();
});


// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'seu-secret-aqui',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // ✅ Correto para HTTP
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// ✅ Rota de teste para verificar se o servidor está funcionando
app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        message: '✅ Servidor funcionando corretamente!',
        protocol: req.protocol,
        timestamp: new Date().toISOString()
    });
});

// ✅ Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// ⭐ REGISTRAR AS ROTAS
app.use('/api/meta', metaAuthRouter);
app.use('/auth/meta', metaCallbackRouter);
app.use('/api/auth', authRoutes);

// ✅ Middleware para debugar rotas não encontradas
app.use((req, res) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'route_not_found', 
        path: req.path,
        method: req.method,
        availableRoutes: [
            'GET /',
            'GET /health',
            'POST /api/meta/exchange-code',
            'GET /auth/meta/callback',
            'POST /api/auth/login',
            'POST /api/auth/register'
        ]
    });
});

// ✅ Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('❌ Erro no servidor:', err);
    res.status(500).json({ 
        error: 'internal_server_error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log('🚀 ========================================\n');
    console.log('📍 Rotas disponíveis:');
    console.log(`  🏠 GET  http://localhost:${PORT}/`);
    console.log(`  💚 GET  http://localhost:${PORT}/health`);
    console.log(`  🔐 POST http://localhost:${PORT}/api/auth/login`);
    console.log(`  📝 POST http://localhost:${PORT}/api/auth/register`);
    console.log(`  📱 POST http://localhost:${PORT}/api/meta/exchange-code`);
    console.log(`  🔄 GET  http://localhost:${PORT}/auth/meta/callback`);
    console.log('\n⚠️  USE HTTP (não HTTPS) para acessar as rotas!\n');
});