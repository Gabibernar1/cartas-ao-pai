// Função de servidor: confere direto com o Mercado Pago se um pagamento
// foi mesmo aprovado. Nunca confia no que o navegador do cliente diz.

exports.handler = async (event) => {
  const paymentId = event.queryStringParameters && event.queryStringParameters.payment_id;

  if (!paymentId) {
    return { statusCode: 400, body: JSON.stringify({ erro: 'payment_id ausente' }) };
  }

  try {
    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      return { statusCode: 500, body: JSON.stringify({ erro: 'Falha ao consultar pagamento' }) };
    }

    const aprovado = dados.status === 'approved';
    const pacote = dados.external_reference;

    return {
      statusCode: 200,
      body: JSON.stringify({ aprovado, pacote, status: dados.status }),
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ erro: 'Erro interno' }) };
  }
};
