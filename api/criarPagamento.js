const admin = require('firebase-admin');
const axios = require('axios');

const PAGBANK_TOKEN = process.env.PAGBANK_TOKEN;
const PAGBANK_URL = process.env.PAGBANK_TOKEN?.startsWith('test_') 
  ? 'https://sandbox.api.pagseguro.com/checkouts' 
  : 'https://api.pagseguro.com/checkouts';

module.exports = async (req, res) => {
  // Inicialização segura do Firebase
  try {
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      if (!projectId || !clientEmail || !process.env.FIREBASE_PRIVATE_KEY) throw new Error("Variáveis de ambiente do Firebase ausentes.");

      // Tratamento robusto da Private Key
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
        : undefined;

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  } catch (e) {
    return res.status(500).send("Erro na chave do Firebase: " + e.message);
  }

  const db = admin.firestore();

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

  if (!PAGBANK_TOKEN) {
    return res.status(500).json({ error: 'Configuração do PagBank ausente (PAGBANK_TOKEN)' });
  }

  try {
    const pedidoRef = db.collection('pedidos').doc();
    await pedidoRef.set({
      id: pedidoRef.id,
      itens,
      total: resumo.total || 0,
      cliente,
      status: 'Aguardando Pagamento',
      criadoEm: admin.firestore.FieldValue.serverTimestamp()
    });

    // Pega o domínio atual da Vercel (garante que use HTTPS)
    const domain = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://casa-das-coxinhas.vercel.app';

    const payload = {
      reference_id: pedidoRef.id,
      customer: { name: cliente.nome || "Cliente", email: "cliente@exemplo.com", phone: { country: "55", area: "81", number: "982116454" } },
      items: [{ reference_id: "PEDIDO_DELIVERY", name: "Pedido Casa das Coxinhas", quantity: 1, unit_amount: Math.round(resumo.total * 100) }],
      notification_urls: [domain.includes('localhost') ? 'https://webhook.site/seu-id' : `${domain}/api/webhookPagBank`],
      redirect_url: `${domain}/sucesso.html`,
      payment_methods: [{ type: cliente.metodo === 'pix_online' ? 'PIX' : 'CREDIT_CARD' }]
    };

    const response = await axios.post(PAGBANK_URL, payload, {
      headers: {
        'Authorization': `Bearer ${PAGBANK_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const payLink = response.data.links.find(l => l.rel === 'PAY');
    
    if (!payLink) {
      throw new Error("Link de pagamento não retornado pelo PagBank.");
    }

    const paymentUrl = payLink.href;
    await pedidoRef.update({ payment_url: paymentUrl, pagbank_id: response.data.id });

    res.json({ url: paymentUrl });
  } catch (error) {
    const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
    res.status(500).json({ error: 'Erro ao processar checkout', details: errorDetail });
  }
};