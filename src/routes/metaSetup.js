// server/routes/metaSetup.js
const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();

router.post('/setup-whatsapp', async (req, res) => {
    try {
        const userToken = req.session.metaUserToken; // ajuste para o seu auth/session
        if (!userToken) {
            return res.status(401).json({ error: 'no_user_token' });
        }

        // 1) Descobrir Businesses e WABAs
        const bResp = await fetch('https://graph.facebook.com/v20.0/me/businesses?fields=name,whatsapp_business_accounts{id,name}&limit=50', {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const bData = await bResp.json();
        const waba = bData?.data?.flatMap(b => b.whatsapp_business_accounts?.data || [])?.[0];
        if (!waba) {
            return res.status(400).json({ error: 'no_waba_found' });
        }

        // 2) Listar números verificados
        const pnResp = await fetch(`https://graph.facebook.com/v20.0/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating`, {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const pnData = await pnResp.json();
        const phone = pnData?.data?.[0];

        // 3) Assinar app no WABA (para receber webhooks)
        const subResp = await fetch(`https://graph.facebook.com/v20.0/${waba.id}/subscribed_apps`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${userToken}` }
        });
        const subData = await subResp.json();

        // TODO: salvar no banco: waba.id, phone.id, phone.display_phone_number, status
        return res.json({
            status: 'connected',
            waba: { id: waba.id, name: waba.name },
            phone: phone ? {
                id: phone.id,
                number: phone.display_phone_number,
                verified_name: phone.verified_name
            } : null,
            subscription: subData
        });
    } catch (e) {
        return res.status(500).json({ error: 'server_error' });
    }
});

module.export = router;