const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
    try {
        console.log('🔐 Verificando autenticação...');

        // ✅ Pegar token do header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            console.warn('⚠️ Token não fornecido');
            return res.status(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        // ✅ Extrair token (formato: "Bearer TOKEN")
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        console.log('🔑 Token extraído:', token.substring(0, 20) + '...');

        // ✅ Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log('✅ Token válido, usuário:', decoded.id);

        // ✅ Adicionar usuário ao request
        req.user = decoded;

        // ✅ CRÍTICO: Chamar next() para continuar para o próximo middleware/rota
        next();

    } catch (error) {
        console.error('❌ Erro na autenticação:', error.message);

        // ✅ Verificar tipo de erro
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        // ✅ Verificar se headers já foram enviados
        if (res.headersSent) {
            console.error('⚠️ Headers já foram enviados');
            return;
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar autenticação',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ✅ Exportar com alias para facilitar importação
module.exports = {
    authenticate,
    authMiddleware: authenticate // ✅ Alias
};