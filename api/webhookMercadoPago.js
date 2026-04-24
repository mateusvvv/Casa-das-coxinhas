const admin = require('firebase-admin');
const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  // Inicialização do Firebase (mesma lógica dos outros arquivos)
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').replace(/"/g, '');
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    });
  }

  const db = admin.firestore();
  const { type, data } = req.body;

  // O Mercado Pago envia uma notificação informando que um "payment" mudou
  if (type === 'payment' && data.id) {
    try {
      // Precisamos consultar o Mercado Pago para ver o status real desse pagamento
      const response = await axios.get(`https://api.mercadopago.com/v1/payments/${data.id}`, {
        headers: { 'Authorization': `Bearer ${process.env.MERCADO_PAGO_TOKEN}` }
      });

      const paymentData = response.data;
      const pedidoId = paymentData.external_reference;
      const statusMP = paymentData.status; // 'approved', 'pending', 'rejected', etc.

      if (pedidoId) {
        let statusTraduzido = 'Aguardando Pagamento';
        if (statusMP === 'approved') statusTraduzido = 'Pago';
        else if (statusMP === 'rejected' || statusMP === 'cancelled') statusTraduzido = 'Cancelado';

        const pedidoRef = db.collection('pedidos').doc(pedidoId);
        const pedidoDoc = await pedidoRef.get();

        if (pedidoDoc.exists && statusTraduzido === 'Pago' && pedidoDoc.data().status !== 'Pago') {
          const itensPedido = pedidoDoc.data().itens || [];
          const disponibilidadeRef = db.collection('configuracoes').doc('disponibilidade');

          await db.runTransaction(async (transaction) => {
            const dispDoc = await transaction.get(disponibilidadeRef);
            if (!dispDoc.exists) return;

            const dispData = dispDoc.data();
            itensPedido.forEach(item => {
              if (item.id && dispData.itens && dispData.itens[item.id]) {
                const estoqueAtual = dispData.itens[item.id].estoque || 0;
                dispData.itens[item.id].estoque = Math.max(0, estoqueAtual - 1);
              }
            });
            transaction.update(disponibilidadeRef, dispData);
          });
        }

        await pedidoRef.update({
          status: statusTraduzido,
          mp_status: statusMP,
          atualizadoEm: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Erro no Webhook MP:", error.message);
      return res.status(500).send("Erro ao processar");
    }
  }

  res.status(200).send('OK');
};