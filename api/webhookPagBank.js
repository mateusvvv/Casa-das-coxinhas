const admin = require('firebase-admin');

module.exports = async (req, res) => {
  try {
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, '')
        : undefined;

      if (!projectId || !clientEmail || !privateKey) throw new Error("Variáveis de ambiente incompletas.");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    }
  } catch (e) {
    return res.status(500).send("Erro Firebase Webhook: " + e.message);
  }

  const db = admin.firestore();
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  try {
    // O PagBank pode enviar o ID de referência ou o ID da transação
    const { reference_id, status, id: transacao_id } = req.body;

    if (!reference_id) {
      return res.status(200).send('Ignorado: Sem reference_id');
    }

    if (reference_id) {
      let statusTraduzido = 'Aguardando Pagamento';
      
      if (status === 'PAID' || status === 'COMPLETED') statusTraduzido = 'Pago';
      else if (status === 'DECLINED' || status === 'CANCELED' || status === 'EXPIRED') statusTraduzido = 'Cancelado';

      const pedidoRef = db.collection('pedidos').doc(reference_id);
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