const admin = require('firebase-admin');
const axios = require('axios');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
const PAGBANK_URL = 'https://api.pagseguro.com/checkouts';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const { itens, resumo, cliente } = req.body;

  try {
    const pedidoRef = db.collection('pedidos').doc();
    await pedidoRef.set({
      id: pedidoRef.id,
      itens,
      total: resumo.total,
      cliente,
      status: 'Aguardando Pagamento',
      criadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

    // Pega o domínio atual da Vercel ou usa o seu oficial
    const domain = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://casa-das-coxinhas-5f0c5.vercel.app';

    const payload = {
      reference_id: pedidoRef.id,
      customer: { name: "Cliente Casa das Coxinhas", email: "cliente@email.com", phone: { country: "55", area: "81", number: "999999999" } },
      items: [{ reference_id: "PEDIDO_DELIVERY", name: "Pedido Casa das Coxinhas", quantity: 1, unit_amount: Math.round(resumo.total * 100) }],
      notification_urls: [`${domain}/api/webhookPagBank`],
      redirect_url: `${domain}/sucesso.html`,
      payment_methods: [{ type: cliente.metodo === 'pix_online' ? 'PIX' : 'CREDIT_CARD' }]
    };

    const response = await axios.post(PAGBANK_URL, payload, {
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const paymentUrl = response.data.links.find(l => l.rel === 'PAY').href;
    await pedidoRef.update({ payment_url: paymentUrl });

    res.json({ url: paymentUrl });
  } catch (error) {
    console.error("Erro PagBank:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Erro ao processar checkout' });
  }
};