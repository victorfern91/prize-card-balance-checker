#!/usr/bin/env node

const yargs = require('yargs');
const ora = require('ora');
const { table } = require('table');

const { getCardsInfo } = require('./prize-checker')

async function getBalance(cards) {
  const spinner = ora('Checking your balance for your(s) prize card(s):\n').start();

  let numbers = [];

  if (typeof cards === 'string') {
    numbers = cards.split(',').map(item => item.trim());
  } else if (typeof cards === 'number') {
    numbers = [cards.toString()];
  } else if(Array.isArray(cards)) {
    numbers = cards;
  }

  numbers = [...new Set(numbers)];

  numbers.forEach(number => {
    spinner.text += `\n  💳 [${number.slice(-3).padStart(number.length, '*')}]`
  });

  const cardsInfo = await getCardsInfo(numbers);

  const data = cardsInfo.cards.reduce((acc, item) => {
    acc.push([item.card, `${item.amount} €`]);
    return acc;
  }, [['Card Number', 'Amount']]);

  data.push(['Total', `${cardsInfo.totalAmount} €`]);

  spinner.succeed('💸  Balance calculated!')

  console.log(table(data));

  process.exit(0);
}

yargs
  .alias('h', 'help')
  .alias('v', 'version')
  .help()
  .command('* [cards]', 'checks the prize card numbers', yargs => {
    yargs
      .option('card', {
        alias: 'c',
        describe: 'Card number to verify',
        default: [],
        type: 'string'
      })
  }, async argv => await getBalance(argv.cards))
  .argv;

process.on('uncaughtException', function (exception) {
  if (exception.code === 'ETIMEDOUT') {
    return;
  }
});
