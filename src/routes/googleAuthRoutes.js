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
        const authUrl = googleCalendarService.getAuthUrl();

        console.log("🔗 URL de autenticação gerada");

        // Redirecionar para Google
        res.redirect(authUrl);
    } catch (error) {
        console.error("❌ Erro ao gerar URL de autenticação:", error.message);
        res.status(500).json({
            success: false,
            message: "Erro ao iniciar autenticação com Google"
        });
    }
});

/**
 * GET /auth/google/callback
 * Callback do Google após autorização
 */
router.get("/callback", async (req, res) => {
    try {
        const { code, state } = req.query;

        if (!code) {
            console.error("❌ Código de autorização não fornecido");
            return res.redirect(
                `${process.env.FRONTEND_URL}/dashboard?google_status=error&message=Código não fornecido`
            );
        }

        console.log("🔐 Recebido código de autorização do Google");

        // Trocar código por tokens
        const tokens = await googleCalendarService.getTokensFromCode(code);

        console.log("✅ Tokens obtidos do Google");

        // Obter ID do calendário principal
        const calendarId = await googleCalendarService.getPrimaryCalendarId(
            tokens.access_token,
            tokens.refresh_token
        );

        console.log("📅 Calendário principal:", calendarId);

        // Obter usuário do estado (você pode passar o userId no state)
        // Para simplificar, vamos obter do token de acesso
        const userInfo = await googleCalendarService.getUserInfo(tokens.access_token);

        console.log("👤 Informações do usuário Google:", userInfo.email);

        // Buscar usuário no banco de dados pelo email
        const user = await sequelize.models.User.findOne({
            where: { email: userInfo.email }
        });

        if (!user) {
            console.error("❌ Usuário não encontrado:", userInfo.email);
            return res.redirect(
                `${process.env.FRONTEND_URL}/dashboard?google_status=error&message=Usuário não encontrado`
            );
        }

        // Atualizar usuário com tokens do Google
        await user.update({
            googleCalendarId: calendarId,
            googleAccessToken: tokens.access_token,
            googleRefreshToken: tokens.refresh_token,
            googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null
        });

        console.log("✅ Usuário atualizado com tokens do Google");

        // Redirecionar para dashboard com sucesso
        res.redirect(
            `${process.env.FRONTEND_URL}/dashboard?google_status=success&message=Google Calendar conectado com sucesso`
        );
    } catch (error) {
        console.error("❌ Erro no callback do Google:", error.message);
        res.redirect(
            `${process.env.FRONTEND_URL}/dashboard?google_status=error&message=${encodeURIComponent(error.message)}`
        );
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

console.log("✅ Rotas de autenticação Google carregadas");

module.exports = router;