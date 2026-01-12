console.log("📍 aiChatService.js carregado");

const axios = require("axios");
const n8nConfig = require("../config/n8nConfig");

console.log("🔗 N8N Webhook URL:", n8nConfig.webhookUrl);

async function sendMessageToN8N(message, context, sessionId) {
    try {
        // Validação básica
        if (!message || typeof message !== "string") {
            throw new Error("Mensagem inválida");
        }

        if (message.length > n8nConfig.maxMessageLength) {
            throw new Error(
                `Mensagem excede ${n8nConfig.maxMessageLength} caracteres`
            );
        }

        if (!sessionId || typeof sessionId !== "string") {
            throw new Error("SessionId inválido");
        }

        // Montar payload para o N8N
        const payload = {
            message: message.trim(),
            sessionId, // ✅ Enviar sessionId para o N8N
            context: {
                userId: context?.user?.id || null,
                userName: context?.user?.name || "Anônimo",
                userEmail: context?.user?.email || null,
                customerSegment: context?.customer?.segmento || null,
                customerClients: context?.customer?.qtdClientes || null,
                customerSite: context?.customer?.site || null,
                timestamp: new Date().toISOString()
            }
        };

        // Headers
        const headers = {
            "Content-Type": "application/json"
        };

        // Se tiver API key, adiciona
        if (n8nConfig.apiKey) {
            headers["Authorization"] = `Bearer ${n8nConfig.apiKey}`;
        }

        console.log("🚀 Enviando para N8N:", JSON.stringify(payload, null, 2));

        // Chamada ao N8N
        const response = await axios.post(n8nConfig.webhookUrl, payload, {
            headers,
            timeout: n8nConfig.timeout
        });

        console.log("✅ Resposta do N8N:", response.data);

        // Extrair resposta
        const reply = response.data?.reply || response.data?.message || "Sem resposta";

        return {
            success: true,
            reply,
            metadata: {
                timestamp: new Date().toISOString(),
                n8nStatus: response.status,
                sessionId
            }
        };
    } catch (error) {
        console.error("❌ Erro ao chamar N8N:", error.message);

        return {
            success: false,
            reply: "Desculpe, não consegui processar sua pergunta agora. Tente novamente.",
            error: error.message,
            metadata: {
                timestamp: new Date().toISOString(),
                sessionId
            }
        };
    }
}

module.exports = { sendMessageToN8N };