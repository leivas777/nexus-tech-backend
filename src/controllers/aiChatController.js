console.log("📍 aiChatController.js carregado");

const { sendMessageToN8N } = require("../services/aiChatService");

async function handleChat(req, res) {
    try {
        console.log("📥 POST /api/ai/chat recebido");

        const { message, context, sessionId } = req.body;

        console.log("   Message:", message);
        console.log("   SessionId:", sessionId);

        // Validação básica
        if (!message) {
            return res.status(400).json({
                error: "Campo 'message' é obrigatório"
            });
        }

        if (!sessionId) {
            return res.status(400).json({
                error: "Campo 'sessionId' é obrigatório"
            });
        }

        // Chamar serviço (passando sessionId)
        const result = await sendMessageToN8N(message, context, sessionId);

        // Retornar resposta
        if (result.success) {
            return res.status(200).json({
                reply: result.reply,
                sessionId,
                metadata: result.metadata
            });
        } else {
            return res.status(500).json({
                error: result.reply,
                sessionId,
                details: result.error
            });
        }
    } catch (error) {
        console.error("❌ Erro no controller:", error);
        return res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
}

module.exports = { handleChat };