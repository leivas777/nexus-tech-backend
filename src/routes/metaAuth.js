// server/routes/metaAuth.js (CommonJS)
const express = require('express');
const fetch = require('node-fetch');
const { validateState } = require('./metaCallback');

const router = express.Router();

router.post('/exchange-code', async (req, res) => {
    try {
        const { code, redirectUri, state } = req.body;

        console.log('📍 Exchange-code recebido:', { code: code?.substring(0, 20) + '...', redirectUri, state });

        // Validar state (CSRF)
        if (state && !validateState(state)) {
            return res.status(401).json({ error: 'invalid_or_expired_state' });
        }

        const params = new URLSearchParams({
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            redirect_uri: redirectUri || process.env.META_REDIRECT_URI,
            code
        });

        console.log('📍 Parâmetros enviados ao Meta:', {
            client_id: process.env.META_APP_ID,
            redirect_uri: redirectUri || process.env.META_REDIRECT_URI
        });

        const r = await fetch('https://graph.facebook.com/v20.0/oauth/access_token?' + params.toString());
        const data = await r.json();

        console.log('📍 Resposta do Meta:', data);

        if (!data.access_token) {
            console.error('❌ Erro no exchange:', data);
            return res.status(400).json({ error: 'oauth_failed', details: data });
        }

        req.session.metaUserToken = data.access_token;
        req.session.metaUserId = data.user_id;

        console.log('✅ Token armazenado com sucesso');
        return res.json({ ok: true });
    } catch (e) {
        console.error('❌ Erro no exchange:', e);
        return res.status(500).json({ error: 'server_error', message: e.message });
    }
});

module.exports = router;