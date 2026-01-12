// server.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

// ✅ Importar modelos Sequelize
const { sequelize } = require('./models');

// ✅ Importar rotas
const metaAuthRouter = require('./routes/metaAuth');
const metaCallbackRouter = require('./routes/metaCallback');
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
const appointmentRoutes = require("./routes/appointmentRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");

const app = express();

// ✅ DETECÇÃO AUTOMÁTICA DE AMBIENTE
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

console.log('\n🌍 ');
console.log(`   Ambiente: ${isDevelopment ? '🔧 DESENVOLVIMENTO' : '🚀 PRODUÇÃO'}`);
console.log('🌍 \n');

// ✅ CONFIGURAÇÃO DINÂMICA DO CORS
const allowedOrigins = isDevelopment
    ? [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
    ]
    : [
        'https://nexustech.tec.br',
        'https://www.nexustech.tec.br',
        process.env.FRONTEND_URL
    ].filter(Boolean);

console.log('✅ CORS configurado para as seguintes origens:');
allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
console.log();

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            console.log(`✅ CORS permitido para: ${origin}`);
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS bloqueado para origem: ${origin}`);
            callback(new Error('CORS não permitido para esta origem'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
    maxAge: 86400
};

app.use(cors(corsOptions));

// ✅ Middleware de Log
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path}`);
    console.log(`   🔗 Protocol: ${req.protocol}`);
    console.log(`   🌐 Origin: ${req.get('origin') || 'Direct access'}`);
    next();
});

// ✅ Middlewares de parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Configuração de Sessão
app.use(session({
    secret: process.env.SESSION_SECRET || 'seu-secret-aqui',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: isProduction,
        httpOnly: true,
        sameSite: isProduction ? 'strict' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

console.log(`🔒 Cookie seguro: ${isProduction ? '✅ Ativado (HTTPS)' : '❌ Desativado (HTTP)'}`);
console.log();

// ✅ Rota de teste
app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        message: '✅ Servidor funcionando corretamente!',
        environment: isDevelopment ? 'development' : 'production',
        protocol: req.protocol,
        timestamp: new Date().toISOString(),
        corsOrigins: allowedOrigins
    });
});

// ✅ Rota de health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        environment: isDevelopment ? 'development' : 'production',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// ⭐ REGISTRAR AS ROTAS
console.log("🔄 Carregando rotas...\n");

const routes = [
    { path: '/api/meta', router: metaAuthRouter, name: 'Meta Auth' },
    { path: '/auth/meta', router: metaCallbackRouter, name: 'Meta Callback' },
    { path: '/api/auth', router: authRoutes, name: 'Autenticação' },
    { path: '/api/auth/google', router: googleAuthRoutes, name: 'Google Calendar' },
    { path: '/api/ai', router: aiRoutes, name: 'AI' },
    { path: '/api/appointments', router: appointmentRoutes, name: 'Agendamentos' }
];

routes.forEach(({ path, router, name }) => {
    try {
        app.use(path, router);
        console.log(`✅ ${name} carregadas em ${path}`);
    } catch (e) {
        console.error(`❌ Erro ao carregar ${name}:`, e.message);
    }
});

console.log("\n🎯 Todas as rotas registradas!\n");

// ✅ Middleware para rotas não encontradas
app.use((req, res) => {
    console.log(`❌ Rota não encontrada: ${req.method} ${req.path}`);
    res.status(404).json({ 
        error: 'route_not_found', 
        path: req.path,
        method: req.method,
        availableRoutes: [
            'GET /',
            'GET /health',
            'POST /api/auth/register',
            'POST /api/auth/login',
            'GET /api/auth/profile',
            'GET /api/auth/business-segments',
            'POST /api/auth/customers',
            'GET /api/auth/customers',
            'PUT /api/auth/customers/:id',
            'DELETE /api/auth/customers/:id',
            'GET /api/auth/google/url',
            'GET /api/auth/google/status',
            'POST /api/auth/google/disconnect',
            'GET /api/auth/google/callback'
        ]
    });
});

// ✅ Middleware de tratamento de erros (DEVE SER O ÚLTIMO)
app.use((err, req, res, next) => {
    console.error('❌ Erro no servidor:', err.message);
    
    // ✅ CRÍTICO: Verificar se headers já foram enviados
    if (res.headersSent) {
        console.error('⚠️ Headers já foram enviados, não é possível enviar outra resposta');
        return next(err);
    }

    if (err.message.includes('CORS')) {
        return res.status(403).json({ 
            error: 'CORS_ERROR',
            message: 'Origem não permitida'
        });
    }

    res.status(500).json({ 
        error: 'internal_server_error',
        message: err.message,
        stack: isDevelopment ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 3001;

// ✅ Iniciar servidor após sincronizar banco de dados
sequelize.sync({ alter: false })
    .then(() => {
        app.listen(PORT, () => {
            console.log('\n🚀 ');
            console.log(`✅ Servidor rodando em ${isDevelopment ? 'http' : 'https'}://localhost:${PORT}`);
            console.log('🚀 \n');
            console.log('📍 Rotas disponíveis:');
            console.log(`  🏠 GET  /`);
            console.log(`  💚 GET  /health`);
            console.log(`  🔐 POST /api/auth/login`);
            console.log(`  📝 POST /api/auth/register`);
            console.log(`  👤 GET  /api/auth/profile`);
            console.log(`  📋 GET  /api/auth/business-segments`);
            console.log(`  💾 POST /api/auth/customers`);
            console.log(`  📊 GET  /api/auth/customers`);
            console.log(`  ✏️  PUT  /api/auth/customers/:id`);
            console.log(`  🗑️  DELETE /api/auth/customers/:id`);
            console.log(`  📅 GET  /api/auth/google/url`);
            console.log(`  📊 GET  /api/auth/google/status`);
            console.log(`  🔌 POST /api/auth/google/disconnect`);
            console.log(`  ↩️  GET  /api/auth/google/callback`);
            console.log();
        });
    })
    .catch(err => {
        console.error('❌ Erro ao sincronizar banco de dados:', err.message);
        process.exit(1);
    });

module.exports = app;