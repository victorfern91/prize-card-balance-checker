const got = require('got');
const cheerio = require('cheerio')
const FormData = require('form-data');

function getCardInfo(cardNumber) {
  return new Promise(resolve => {
    const form = new FormData();

    form.append('User', cardNumber);
    form.append('Password', cardNumber.slice(-7));

    got.post('https://hbprepagos.unicre.pt', {
      body: form,
      followRedirect: true,
      retry: 0,
      timeout: 5000,
      headers: {'Host': 'hbprepagos.unicre.pt'},
      hooks: {
        afterResponse: [
          response => {
            resolve({ card: cardNumber, amount: 0, isValid: false });

            return response;
          }
        ],
        beforeRedirect: [
          (options, response) => {

            got.get('https://hbprepagos.unicre.pt/area-cliente', {
              headers: {cookie: response.headers['set-cookie']}
            }).then(data => {
              const $ = cheerio.load(data.body);
              resolve({
                card: cardNumber,
                amount: parseFloat($('.valueLabel').last().text()),
                isValid: true
              });
            });
          }
        ]
      }
    }).catch(() => {});
  });
}

async function getCardsInfo(cards) {
  const requests = [];

  cards.forEach(card => {
    requests.push(getCardInfo(card));
  });

  const cardsInfo = await Promise.all(requests);

  const info = cardsInfo.reduce((acc, element) => {
    acc.cards.push(element);
    acc.totalAmount += element.amount;
    return acc;
  }, { cards: [], totalAmount: 0 });

  info.totalAmount = parseFloat(info.totalAmount.toFixed(2));

  return info;
}

module.exports = {
  getCardInfo,
  getCardsInfo
}
