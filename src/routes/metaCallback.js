// server/routes/metaCallback.js (CommonJS)
const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

// Armazena states temporários
const stateStore = new Map();

// Gera um state único para CSRF
function generateState() {
    const state = `csrf-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    stateStore.set(state, { createdAt: Date.now() });
    return state;
}

// Valida o state (máximo 10 minutos de validade)
function validateState(state) {
    const entry = stateStore.get(state);
    if (!entry) return false;
    const age = Date.now() - entry.createdAt;
    if (age > 10 * 60 * 1000) {
        stateStore.delete(state);
        return false;
    }
    stateStore.delete(state);
    return true;
}

// GET /auth/meta/callback?code=...&state=...
router.get('/callback', async (req, res) => {
    try {
        const { code, state } = req.query;

        // 1) Validar code e state
        if (!code || !state) {
            return res.status(400).json({ error: 'missing_code_or_state' });
        }

        if (!validateState(state)) {
            return res.status(401).json({ error: 'invalid_or_expired_state' });
        }

        // 2) Exchange do code por access_token
        const params = new URLSearchParams({
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            redirect_uri: process.env.META_REDIRECT_URI,
            code
        });

        const tokenResp = await fetch('https://graph.facebook.com/v20.0/oauth/access_token?' + params.toString());
        const tokenData = await tokenResp.json();

        console.log('📍 Resposta do Meta (callback):', tokenData);

        if (!tokenData.access_token) {
            return res.status(400).json({ error: 'token_exchange_failed', details: tokenData });
        }

        // 3) Armazenar token na sessão
        req.session.metaUserToken = tokenData.access_token;
        req.session.metaUserId = tokenData.user_id;

        console.log('✅ Token armazenado na sessão');

        // 4) Redirecionar de volta ao Dashboard
        return res.redirect(`/dashboard?meta_status=success&meta_user_id=${tokenData.user_id}`);
    } catch (e) {
        console.error('❌ Erro no callback:', e);
        return res.redirect('/dashboard?meta_status=error');
    }
});

module.exports = router;
module.exports.generateState = generateState;
module.exports.validateState = validateState;