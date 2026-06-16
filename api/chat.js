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

  const { action, ...body } = req.body;

  // Handle Airtable save
  if (action === 'save_airtable') {
    if (!airtableToken || !airtableBase || !airtableTable) {
      return res.status(500).json({ error: 'Airtable not configured' });
    }
    try {
      const response = await fetch(`https://api.airtable.com/v0/${airtableBase}/${airtableTable}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${airtableToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: body.fields }),
      });
      const data = await response.json();
      return res.status(response.status).json(data);
    } catch (error) {
      return res.status(500).json({ error: 'Airtable save failed', details: error.message });
    }
  }

  // Handle Anthropic chat
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'API request failed', details: error.message });
  }
}
