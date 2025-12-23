// server.js
const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const metaAuthRouter = require('./routes/metaAuth');
const metaCallbackRouter = require('./routes/metaCallback');
const authRoutes = require('./routes/authRoutes');

const app = express();

// ✅ DETECÇÃO AUTOMÁTICA DE AMBIENTE
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

console.log('\n🌍 ========================================');
console.log(`   Ambiente: ${isDevelopment ? '🔧 DESENVOLVIMENTO' : '🚀 PRODUÇÃO'}`);
console.log('🌍 ========================================\n');

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
        process.env.FRONTEND_URL
    ].filter(Boolean);

console.log('✅ CORS configurado para as seguintes origens:');
allowedOrigins.forEach(origin => console.log(`   - ${origin}`));
console.log();

// ✅ CORS OPTIONS - Mais restritivo e explícito
const corsOptions = {
    origin: function (origin, callback) {
        // ✅ Permitir requisições sem origin (mobile, Postman, etc)
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
    maxAge: 86400 // 24 horas - cache do preflight
};

// ✅ APLICAR CORS GLOBALMENTE
app.use(cors(corsOptions));

// ✅ RESPONDER EXPLICITAMENTE A OPTIONS (importante!)
app.options('*', cors(corsOptions));

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
        secure: isProduction, // true em HTTPS, false em HTTP
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

// ✅ Rota de CORS check
app.get('/api/cors-check', (req, res) => {
    res.json({
        origin: req.get('origin'),
        allowed: allowedOrigins,
        isAllowed: !req.get('origin') || allowedOrigins.includes(req.get('origin')),
        message: req.get('origin') && allowedOrigins.includes(req.get('origin')) 
            ? '✅ CORS permitido'
            : '❌ CORS bloqueado'
    });
});

// ✅ Rota de configuração (apenas em desenvolvimento)
if (isDevelopment) {
    app.get('/api/config', (req, res) => {
        res.json({
            environment: 'development',
            corsOrigins: allowedOrigins,
            sessionSecret: '***' + process.env.SESSION_SECRET?.slice(-4),
            nodeEnv: process.env.NODE_ENV,
            frontendUrl: process.env.FRONTEND_URL
        });
    });
}

// ⭐ REGISTRAR AS ROTAS
app.use('/api/meta', metaAuthRouter);
app.use('/auth/meta', metaCallbackRouter);
app.use('/api/auth', authRoutes);

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
            'GET /api/cors-check',
            'POST /api/auth/login',
            'POST /api/auth/register',
            'GET /api/auth/profile'
        ]
    });
});

// ✅ Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error('❌ Erro no servidor:', err.message);
    
    if (err.message.includes('CORS')) {
        return res.status(403).json({ 
            error: 'CORS_ERROR',
            message: 'Origem não permitida',
            origin: req.get('origin'),
            allowedOrigins: allowedOrigins
        });
    }

    res.status(500).json({ 
        error: 'internal_server_error',
        message: err.message,
        stack: isDevelopment ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log('\n🚀 ========================================');
    console.log(`✅ Servidor rodando em ${isDevelopment ? 'http' : 'https'}://localhost:${PORT}`);
    console.log('🚀 ========================================\n');
    console.log('📍 Rotas disponíveis:');
    console.log(`  🏠 GET  /`);
    console.log(`  💚 GET  /health`);
    console.log(`  🔐 POST /api/auth/login`);
    console.log(`  📝 POST /api/auth/register`);
    console.log(`  👤 GET  /api/auth/profile`);
    console.log();
});