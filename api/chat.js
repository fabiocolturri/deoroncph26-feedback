export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const airtableToken = process.env.AIRTABLE_TOKEN;
  const airtableBase = process.env.AIRTABLE_BASE;
  const airtableTable = process.env.AIRTABLE_TABLE;

  if (!anthropicKey) return res.status(500).json({ error: 'Anthropic API key not configured' });

  const body = req.body;

  if (body.action === 'save_airtable') {
    if (!airtableToken || !airtableBase || !airtableTable) {
      return res.status(500).json({ error: 'Airtable env vars missing', vars: { airtableToken: !!airtableToken, airtableBase: !!airtableBase, airtableTable: !!airtableTable } });
    }
    try {
      const url = `https://api.airtable.com/v0/${airtableBase}/${airtableTable}`;
      const payload = { fields: body.fields };
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json({ error: 'Airtable error', details: data });
      }
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Airtable save failed', details: error.message });
    }
  }

  // Anthropic chat
  try {
    const { action, ...chatBody } = body;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(chatBody),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Anthropic request failed', details: error.message });
  }
}
