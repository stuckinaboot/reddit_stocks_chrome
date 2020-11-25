chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.contentScriptQuery == "fetchOption") {
    getSpecificOption(request).then((res) => sendResponse(res));
  }
  return true;
});

async function getSpecificOption(params) {
  try {
    const { targetStrike, targetExpDate, ticker, targetOptionType } = params;

    const optionsRes = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/options/${ticker}?date=${targetExpDate}`
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

    return {
      marketPrice,
      specificOptionPrice,
    };
  } catch (error) {
    return { error };
  }
}
