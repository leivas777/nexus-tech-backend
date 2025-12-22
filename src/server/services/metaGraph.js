// server/services/metaGraph.js
export async function getBusinesses(userToken) {
    const url = 'https://graph.facebook.com/v20.0/me/businesses?fields=name,verification_status,whatsapp_business_accounts{id,name}';
    const r = await fetch(url, { headers: { Authorization: `Bearer ${userToken}` } });
    return await r.json();
}

export async function getWabaPhones(userToken, wabaId) {
    const url = `https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?fields=id,display_phone_number,verified_name`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${userToken}` } });
    return await r.json();
}

// server/services/metaGraph.js
export async function subscribeAppToWaba(userToken, wabaId) {
    const url = `https://graph.facebook.com/v20.0/${wabaId}/subscribed_apps`;
    const r = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${userToken}` }
    });
    return await r.json();
}