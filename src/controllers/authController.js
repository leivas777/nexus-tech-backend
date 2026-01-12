// controllers/authController.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// ✅ Importar modelos corretamente
const db = require('../models');
const { User, Customer } = db;

console.log('✅ authController carregado');
console.log(`   User disponível: ${User ? '✅' : '❌'}`);
console.log(`   Customer disponível: ${Customer ? '✅' : '❌'}\n`);

// ✅ Verificar se modelos foram carregados
if (!User) {
  console.error('❌ ERRO CRÍTICO: User model não está disponível!');
  process.exit(1);
}

if (!Customer) {
  console.error('❌ ERRO CRÍTICO: Customer model não está disponível!');
  process.exit(1);
}

// ✅ Register
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        console.log('📝 Tentativa de registro:', email);

        // ✅ Validação
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nome, email e senha são obrigatórios'
            });
        }

        // ✅ Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        // ✅ Validar comprimento da senha
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Senha deve ter pelo menos 6 caracteres'
            });
        }

        // ✅ Verificar se email já existe
        const existingUser = await User.findOne({ where: { email } });

        if (existingUser) {
            console.warn('⚠️ Email já cadastrado:', email);
            return res.status(409).json({
                success: false,
                message: 'Email já cadastrado'
            });
        }

        console.log('✅ Email disponível');

        // ✅ Criar usuário
        const user = await User.create({
            name,
            email,
            password
        });

        console.log('✅ Usuário criado com sucesso:', user.id);

        // ✅ Gerar JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ JWT gerado com sucesso');

        return res.status(201).json({
            success: true,
            message: 'Registro realizado com sucesso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            customer: null
        });

    } catch (error) {
        console.error('❌ Erro no registro:', error.message);
        console.error('   Stack:', error.stack);

        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao fazer registro',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ✅ Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Tentativa de login:', email);

        // ✅ Validação
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email e senha são obrigatórios'
            });
        }

        // ✅ Verificar se User está definido
        if (!User) {
            console.error('❌ ERRO CRÍTICO: User model não está disponível');
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }

        console.log('✅ User model disponível');

        // ✅ Buscar usuário
        const user = await User.findOne({ where: { email } });

        if (!user) {
            console.warn('⚠️ Usuário não encontrado:', email);
            return res.status(401).json({
                success: false,
                message: 'Email ou senha inválidos'
            });
        }

        console.log('✅ Usuário encontrado:', user.id);

        // ✅ Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.warn('⚠️ Senha inválida para usuário:', email);
            return res.status(401).json({
                success: false,
                message: 'Email ou senha inválidos'
            });
        }

        console.log('✅ Senha válida');

        // ✅ Buscar customer do usuário
        const customer = await Customer.findOne({ where: { user_id: user.id } });

        console.log('📋 Customer encontrado:', customer ? customer.id : 'Nenhum');

        // ✅ Gerar JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ JWT gerado com sucesso');

        return res.json({
            success: true,
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            customer: customer ? {
                id: customer.id,
                nome: customer.nome,
                email: customer.email,
                segmento: customer.segmento,
                qtdClientes: customer.qtd_clientes,
                site: customer.site,
                telefone: customer.telefone
            } : null
        });

    } catch (error) {
        console.error('❌ Erro no login:', error.message);
        console.error('   Stack:', error.stack);

        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao fazer login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ✅ Get Profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user?.id;

        console.log('👤 Buscando perfil do usuário:', userId);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
        }

        // ✅ Buscar usuário
        const user = await User.findByPk(userId, {
            attributes: ['id', 'name', 'email']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        console.log('✅ Usuário encontrado:', user.id);

        // ✅ Buscar customer
        const customer = await Customer.findOne({ where: { user_id: userId } });

        console.log('📋 Customer encontrado:', customer ? customer.id : 'Nenhum');

        return res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            customer: customer ? {
                id: customer.id,
                nome: customer.nome,
                email: customer.email,
                segmento: customer.segmento,
                qtdClientes: customer.qtd_clientes,
                site: customer.site,
                telefone: customer.telefone
            } : null
        });

    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error.message);

        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar perfil'
        });
    }
};