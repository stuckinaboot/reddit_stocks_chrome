// const fetch = require("node-fetch");
// const format = require("string-template");

// const OPTIONS_QUERY_BASE =
// "https://query1.finance.yahoo.com/v7/finance/options/{ticker}";

// https://query1.finance.yahoo.com/v7/finance/options/aapl?date=1606435200
// const OPTIONS_QUERY_BASE_FOR_DATE =
// OPTIONS_QUERY_BASE + "?date={expirationDate}";

const YAHOO_BASE = "https://finance.yahoo.com/quote/{ticker}";

async function getSpecificOption(params) {
  const { targetStrike, targetExpDate, ticker, targetOptionType } = params;

  const optionsRes = await fetch(
    `https://query1.finance.yahoo.com/v7/finance/options/${ticker}?date=${targetExpDate}`
    // format(OPTIONS_QUERY_BASE_FOR_DATE, {
    //   ticker,
    //   expirationDate: targetExpDate,
    // })
  );
  const optionsResJson = await optionsRes.json();
  const result = optionsResJson.optionChain.result[0];

  const { quote, options } = result;
  const bid = quote.bid;
  const ask = quote.ask;
  const marketPrice = (bid + ask) / 2;
  console.log(marketPrice);

  const optionsForExpDate = options.find(
    ({ expirationDate }) => expirationDate === targetExpDate
  );
  const optionsForType = optionsForExpDate[targetOptionType];

  const specificOption = optionsForType.find(
    ({ strike }) => targetStrike === strike
  );
  const specificOptionPrice = specificOption.lastPrice;
  console.log(specificOptionPrice);
  return { error: "fuck" };
}

(async () => {
  const targetExpDate = 1606435200;
  const targetOptionType = "calls";
  const targetStrike = 115;

  const ticker = "AAPL";
  const f = await getSpecificOption({
    targetStrike,
    targetExpDate,
    targetOptionType,
    ticker,
  });
})();

module.exports = { getSpecificOption };
