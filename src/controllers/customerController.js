// controllers/customerController.js
const { Customer, User, BusinessSegment } = require('../models');

// ✅ Criar cliente (APENAS quando usuário preenche dados no modal)
exports.createCustomer = async (req, res) => {
    try {
        const { nome, email, segmento, qtdClientes, site, telefone } = req.body;
        const userId = req.user?.id; // ✅ Vem do middleware de autenticação

        console.log('📝 Criando novo customer para usuário:', userId);
        console.log('   Dados:', { nome, email, segmento, qtdClientes, site, telefone });

        // ✅ Validação
        if (!nome || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nome e email são obrigatórios'
            });
        }

        // ✅ Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email inválido'
            });
        }

        // ✅ Verificar se usuário existe
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuário não encontrado'
            });
        }

        console.log('✅ Usuário encontrado:', user.email);

        // ✅ Verificar se customer já existe para este usuário
        const existingCustomer = await Customer.findOne({ 
            where: { user_id: userId } 
        });

        if (existingCustomer) {
            console.log('ℹ️ Customer já existe para este usuário, atualizando...');
            // Se já existe, atualizar em vez de criar
            return exports.updateCustomer(req, res);
        }

        // ✅ Criar customer
        const customer = await Customer.create({
            user_id: userId,
            nome,
            email,
            segmento: segmento || null,
            qtd_clientes: qtdClientes || 0,
            site: site || null,
            telefone: telefone || null,
        });

        console.log('✅ Customer criado com sucesso:', customer.id);

        return res.status(201).json({
            success: true,
            message: 'Customer cadastrado com sucesso',
            data: {
                id: customer.id,
                user_id: customer.user_id,
                nome: customer.nome,
                email: customer.email,
                segmento: customer.segmento,
                qtdClientes: customer.qtd_clientes,
                site: customer.site,
                telefone: customer.telefone,
            }
        });

    } catch (error) {
        console.error('❌ Erro ao criar customer:', error.message);
        console.error('   Stack:', error.stack);

        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao cadastrar customer',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ✅ Buscar customer do usuário autenticado
exports.getCustomer = async (req, res) => {
    try {
        const userId = req.user?.id;

        console.log('📋 Buscando customer do usuário:', userId);

        const customer = await Customer.findOne({
            where: { user_id: userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'email']
                }
            ]
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer não encontrado para este usuário'
            });
        }

        console.log('✅ Customer encontrado:', customer.id);

        return res.json({
            success: true,
            data: customer
        });

    } catch (error) {
        console.error('❌ Erro ao buscar customer:', error.message);

        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar customer'
        });
    }
};

// ✅ Atualizar customer
exports.updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, segmento, qtdClientes, site, telefone } = req.body;
        const userId = req.user?.id;

        console.log('✏️ Atualizando customer:', id);
        console.log('   Usuário:', userId);
        console.log('   Dados:', { nome, email, segmento, qtdClientes, site, telefone });

        // ✅ Validação básica
        if (!nome || !email) {
            return res.status(400).json({
                success: false,
                message: 'Nome e email são obrigatórios'
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

        // ✅ Buscar customer
        const customer = await Customer.findByPk(id);

        if (!customer) {
            console.warn('⚠️ Customer não encontrado:', id);
            return res.status(404).json({
                success: false,
                message: 'Customer não encontrado'
            });
        }

        // ✅ Verificar se o customer pertence ao usuário autenticado
        if (customer.user_id !== userId) {
            console.warn('⚠️ Usuário tentando atualizar customer de outro usuário');
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para atualizar este customer'
            });
        }

        console.log('✅ Customer encontrado e pertence ao usuário');

        // ✅ Verificar se email já está em uso por outro customer
        if (email !== customer.email) {
            const existingEmail = await Customer.findOne({
                where: {
                    email,
                    id: { [require('sequelize').Op.ne]: id }
                }
            });

            if (existingEmail) {
                return res.status(409).json({
                    success: false,
                    message: 'Email já cadastrado por outro customer'
                });
            }
        }

        // ✅ Atualizar dados
        console.log('🔄 Atualizando dados...');

        await customer.update({
            nome: nome || customer.nome,
            email: email || customer.email,
            segmento: segmento || customer.segmento,
            qtd_clientes: qtdClientes !== undefined ? qtdClientes : customer.qtd_clientes,
            site: site || customer.site,
            telefone: telefone || customer.telefone,
        });

        console.log('✅ Customer atualizado com sucesso:', customer.id);

        return res.json({
            success: true,
            message: 'Customer atualizado com sucesso',
            data: {
                id: customer.id,
                user_id: customer.user_id,
                nome: customer.nome,
                email: customer.email,
                segmento: customer.segmento,
                qtdClientes: customer.qtd_clientes,
                site: customer.site,
                telefone: customer.telefone,
            }
        });

    } catch (error) {
        console.error('❌ Erro ao atualizar customer:', error.message);
        console.error('   Stack:', error.stack);

        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao atualizar customer',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ✅ Deletar customer
exports.deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        console.log('🗑️ Deletando customer:', id);

        const customer = await Customer.findByPk(id);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Customer não encontrado'
            });
        }

        // ✅ Verificar se o customer pertence ao usuário autenticado
        if (customer.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Você não tem permissão para deletar este customer'
            });
        }

        await customer.destroy();

        console.log('✅ Customer deletado com sucesso');

        return res.json({
            success: true,
            message: 'Customer deletado com sucesso'
        });

    } catch (error) {
        console.error('❌ Erro ao deletar customer:', error.message);

        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao deletar customer'
        });
    }
};

// ✅ Buscar segmentos de negócio
exports.getBusinessSegments = async (req, res) => {
    try {
        console.log('📋 Buscando segmentos de negócio...');

        const segments = await BusinessSegment.findAll({
            order: [['segment', 'ASC']],
            attributes: ['id', 'segment']
        });

        console.log('✅ Segmentos encontrados:', segments.length);

        return res.json({
            success: true,
            data: segments,
            total: segments.length
        });

    } catch (error) {
        console.error('❌ Erro ao buscar segmentos:', error.message);

        if (res.headersSent) {
            return;
        }

        return res.status(500).json({
            success: false,
            message: 'Erro ao buscar segmentos',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};