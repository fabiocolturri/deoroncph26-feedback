export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const airtableToken = process.env.AIRTABLE_TOKEN;
  const airtableBase = process.env.AIRTABLE_BASE;
  const airtableTable = process.env.AIRTABLE_TABLE;

  // Check env vars are present
  const envCheck = {
    AIRTABLE_TOKEN: airtableToken ? `set (starts with ${airtableToken.substring(0,8)}...)` : 'MISSING',
    AIRTABLE_BASE: airtableBase || 'MISSING',
    AIRTABLE_TABLE: airtableTable || 'MISSING',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'set' : 'MISSING',
  };

  // Try a real Airtable write with a test record
  let airtableResult = null;
  let airtableError = null;

  try {
    const url = `https://api.airtable.com/v0/${airtableBase}/${airtableTable}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${airtableToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fields: {
          "Exhibitor name": "TEST",
          "Brand / Studio": "TEST RUN",
        }
      }),
    });
    airtableResult = await response.json();
    if (!response.ok) {
      airtableError = airtableResult;
      airtableResult = null;
    }
  } catch(e) {
    airtableError = e.message;
  }

  return res.status(200).json({
    envVars: envCheck,
    airtableWrite: airtableResult ? 'SUCCESS - record created' : 'FAILED',
    airtableError: airtableError || null,
  });
}
