const express = require("express");
const { authenticate } = require("../middlewares/authMiddleware");
const googleCalendarService = require("../services/googleCalendarServices");
const { sequelize } = require("../models");

const router = express.Router();

console.log("📍 Carregando rotas de autenticação Google...");

/**
 * GET /auth/google
 * Gera URL de autenticação e redireciona o usuário para Google
 */
router.get("/", authenticate, (req, res) => {
    try {
        console.log("🔐 Iniciando autenticação Google para usuário:", req.user.id);

        // Gerar URL de autenticação
        const authUrl = googleCalendarService.getAuthUrl(req.user.id);

        console.log("🔗 URL de autenticação gerada");

        // Redirecionar para Google
        res.redirect(authUrl);
    } catch (error) {
        console.error("❌ Erro ao gerar URL de autenticação:", error.message);
        res.status(500).json({
            success: false,
            message: "Erro ao iniciar autenticação com Google",
            error: error.message
        });
    }
});

/**
 * GET /auth/google/callback
 * Callback do Google após autorização
 */
router.get("/callback", async (req, res) => {
    try {
        const { code, state } = req.query; // ✅ Pegamos o 'state' que enviamos

        if (!code) {
            return res.redirect(`${process.env.FRONTEND_URL}/agenda?google_status=error`);
        }

        const tokens = await googleCalendarService.getTokensFromCode(code);

        // ✅ PASSO 2: Buscar o usuário pelo ID que veio no 'state'
        // Isso garante que os tokens caiam na conta logada, independente do e-mail do Google
        const userId = state; 
        const user = await sequelize.models.User.findByPk(userId);

        if (!user) {
            console.error("❌ Usuário não encontrado pelo ID do state:", userId);
            return res.redirect(`${process.env.FRONTEND_URL}/agenda?google_status=error&message=user_not_found`);
        }

        // ✅ PASSO 3: Atualizar
        await user.update({
            googleCalendarId: 'primary',
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
        });

        console.log("✅ Tokens salvos com sucesso para o usuário ID:", user.id);
        return res.redirect(`${process.env.FRONTEND_URL}/agenda?google_status=success`);

    } catch (error) {
        console.error("❌ Erro no callback:", error.message);
        res.redirect(`${process.env.FRONTEND_URL}/agenda?google_status=error`);
    }
});

/**
 * GET /auth/google/status
 * Verificar status da conexão Google Calendar
 */
router.get("/status", authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        console.log("🔍 Verificando status do Google Calendar para usuário:", userId);

        const user = await sequelize.models.User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado"
            });
        }

        const isConnected = !!user.googleAccessToken;

        console.log(`📊 Status: ${isConnected ? "Conectado" : "Desconectado"}`);

        return res.status(200).json({
            success: true,
            isConnected,
            calendarId: user.googleCalendarId,
            email: user.email
        });
    } catch (error) {
        console.error("❌ Erro ao verificar status:", error.message);
        return res.status(500).json({
            success: false,
            message: "Erro ao verificar status"
        });
    }
});

/**
 * POST /auth/google/disconnect
 * Desconectar Google Calendar
 */
router.post("/disconnect", authenticate, async (req, res) => {
    try {
        const userId = req.user.id;

        console.log("🔌 Desconectando Google Calendar para usuário:", userId);

        const user = await sequelize.models.User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Usuário não encontrado"
            });
        }

        // Remover tokens do Google
        await user.update({
            googleCalendarId: null,
            googleAccessToken: null,
            googleRefreshToken: null,
            googleTokenExpiry: null
        });

        console.log("✅ Google Calendar desconectado");

        return res.status(200).json({
            success: true,
            message: "Google Calendar desconectado com sucesso"
        });
    } catch (error) {
        console.error("❌ Erro ao desconectar:", error.message);
        return res.status(500).json({
            success: false,
            message: "Erro ao desconectar Google Calendar"
        });
    }
});

router.post("/store-tokens", authenticate, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id; // Identificado pelo JWT do NexusTech

        if (!code) {
            return res.status(400).json({ error: "Código não fornecido" });
        }

        // 1. Troca o código pelos tokens usando seu service
        const tokens = await googleCalendarService.getTokensFromCode(code);

        // 2. Busca o usuário logado
        const user = await sequelize.models.User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }

        // 3. Salva no Banco de Dados
        await user.update({
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            googleCalendarId: 'primary'
        });

        res.status(200).json({ success: true, message: "Conectado com sucesso" });
    } catch (error) {
        console.error("❌ Erro ao processar tokens:", error.message);
        res.status(500).json({ error: "Erro interno ao salvar tokens" });
    }
});

console.log("✅ Rotas de autenticação Google carregadas");

module.exports = router;