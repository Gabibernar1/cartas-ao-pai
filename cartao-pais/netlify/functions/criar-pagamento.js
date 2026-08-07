// Função de servidor: recebe qual pacote o cliente escolheu e cria
// um link de pagamento no Mercado Pago. O preço vem daqui (do servidor),
// nunca do navegador do cliente — assim ninguém consegue alterar o preço.

const PRECOS = {
  'simples': { titulo: 'Homenagem Simples', preco: 29 },
  'completa': { titulo: 'Homenagem Completa', preco: 49 },
  'para-sempre': { titulo: 'Homenagem Para Sempre', preco: 79 },
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  try {
    const { pacote } = JSON.parse(event.body || '{}');
    const item = PRECOS[pacote];

    if (!item) {
      return { statusCode: 400, body: JSON.stringify({ erro: 'Pacote inválido' }) };
    }

    const siteUrl = `https://${event.headers.host}`;

    const preferencia = {
      items: [
        {
          title: item.titulo,
          quantity: 1,
          unit_price: item.preco,
          currency_id: 'BRL',
        },
      ],
      external_reference: pacote,
      back_urls: {
        success: `${siteUrl}/index.html`,
        failure: `${siteUrl}/index.html`,
        pending: `${siteUrl}/index.html`,
      },
      auto_return: 'approved',
    };

    const resposta = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preferencia),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error('Erro do Mercado Pago:', dados);
      return { statusCode: 500, body: JSON.stringify({ erro: 'Falha ao criar pagamento' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ init_point: dados.init_point }),
    };

  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ erro: 'Erro interno' }) };
  }
};
