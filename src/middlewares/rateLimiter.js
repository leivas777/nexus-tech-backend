const rateLimit = require('express-rate-limit');

//Limitar tentativas de login
exports.loginLimiter = rateLimit({
    windowMs: 15*60*1000, //15minutos
    max:5, //5 tentativas
    message:{
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false
});

//Limitar registro de usuários
exports.registerLimiter = rateLimit({
    windowMs: 60*60*1000, //15minutos
    max:3, //3 registros
    message:{
        success: false,
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos'
    }
});