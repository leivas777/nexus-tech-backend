module.exports = {
    webhookUrl: process.env.N8N_WEBHOOK_URL || "https://curso-n8n-n8n.ebwe7d.easypanel.host/webhook/nexusAi",
    apiKey: process.env.N8N_API_KEY || null,
    timeout: 30000, // 30 segundos
    maxMessageLength: 2000
};