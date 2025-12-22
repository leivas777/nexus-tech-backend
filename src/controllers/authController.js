const jwt = require('jsonwebtoken');
const User = require('../models/Users');

//Gerar Token JWT
const generateToken = (userId) => {
    return jwt.sign({ id:userId}, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

//Registro novo usuário
exports.register = async(req, res) => {
    try{
        const {name, email, password} = req.body;

        //Validações básicas
        if(!name || !email || !password){
            return res.status(400).json({
                success: false,
                message: 'Por favor, preencha todos os campos obrigatórios'
            });
        }

        //Verificar se usuário já existe
        const existingUser = await User.findOne({ where:{email}});
        if(existingUser){
            return res.status(409).json({
                success: false,
                message: 'E-mail já cadastrado'
            });
        }

        //Criar usuário
        const user = await User.create({name, email, password});

        //Gerar Token
        const token = generateToken(user.id);
        res.status(201).json({
            success: true, 
            message: 'Usuário registrado com sucesso',
            data: {
                user,
                token
            }
        });
    }catch(error){
        console.error('Erro no registro:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao registrar usuário',
            error: process.env.NODE_ENV === 'development'? error.message: undefined
        })
    }
};

//Login de usuário
exports.login = async(req, res) => {
    try{
        const {email, password} = req.body;

        //Validações
        if(!email || !password){
            return res.status(400).json({
                success: false,
                message: 'Por favor, forneça e-mail e senha'
            });
        }

        //Buscar usuário
        const user = await User.findOne({ where: {email}});
        if(!user){
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        //Verificar se usuário está ativo
        if(!user.isActive){
            return res.status(403).json({
                success: false,
                message: 'Conta desativada. Entre em contato com o suporte'
            });
        }

        //Verificar senha
        const isPasswordValid = await user.comparePassword(password);
        if(!isPasswordValid){
            return res.status(401).json({
                success: false,
                message: 'Credenciais inválidas'
            });
        }

        //Gerar token
        const token = generateToken(user.id);

        res.status(200).json({
            success: true,
            message: 'Login realizado com sucesso',
            data:{
                user,
                token
            }
        })
    }catch(error){
        console.error('Erro no login:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao realizar login.',
            error: process.env.NODE_ENV === 'development'?error.message:undefined
        });
    }
};

//Obter perfil do usuário autenticado
exports.getProfile = async(req, res) => {
    try{
        const user = await User.findByPk(req.userId);

        if(!user){
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: { user }
        });
    }catch(error){
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar perfil do usuário'
        })
    }
}