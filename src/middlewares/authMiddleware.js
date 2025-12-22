const jwt = require('jsonwebtoken');

exports.authenticate = async(req, res, next) => {
    try{
        //Extrair token do header
        const authHeader = req.headers.authorization;

        if(authHeader || !authHeader.startsWith('Bearer')){
            return res.json(401).json({
                success: false,
                message: 'Token não fornecido'
            });
        }

        const token = authHeader.split('')[1];

        //Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        //Adicionar userId ao request
        req.userId = decoded.id;

        next()
    }catch(error){
        if(error.name === 'TokenExpiredError'){
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        if(error.name === 'JsonWebTokenError'){
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Erro na autenticação'
        })
    }
};