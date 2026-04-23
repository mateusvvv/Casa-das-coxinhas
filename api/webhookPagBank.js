const admin = require('firebase-admin');

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

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  try {
    const { reference_id, status } = req.body;

    if (reference_id) {
      let statusTraduzido = 'Aguardando Pagamento';
      
      if (status === 'PAID' || status === 'COMPLETED') statusTraduzido = 'Pago';
      else if (status === 'DECLINED' || status === 'CANCELED' || status === 'EXPIRED') statusTraduzido = 'Cancelado';

      await db.collection('pedidos').doc(reference_id).update({
        status: statusTraduzido,
        pagbank_status: status,
        atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("Erro no Webhook:", error);
    res.status(500).send('Erro interno');
  }
};