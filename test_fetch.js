const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line && line.includes('=')) {
    const [k, ...v] = line.split('=');
    env[k.trim()] = v.join('=').trim().replace(/^"|"$|^'|'$/g, '');
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function test() {
  const token = "261efa99-29b0-4838-b6ba-992f77586c9f";
  const baseCols = "id,order_number,status,payment_status,created_at,total_paise,table_id,restaurant_id,order_items(id,item_name,quantity,line_total_paise)";
  
  const res = await fetch(`${supabaseUrl}/rest/v1/orders?status_token=eq.${token}&select=${encodeURIComponent(baseCols)}`, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`,
      "Accept": "application/vnd.pgrst.object+json" // maybeSingle behaviour
    }
  });

  console.log("Status:", res.status);
  const data = await res.text();
  console.log("Data:", data);
}

test();
