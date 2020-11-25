chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.contentScriptQuery == "fetchRedditUrl") {
    performRequest(request).then((res) => sendResponse(res));
  }

  if (request.contentScriptQuery == "fetchOption") {
    getSpecificOption(request).then((res) => sendResponse(res));
  }
  return true;
});

async function performRequest(request) {
  try {
    let response = await fetch(request.url, { mode: "cors" });
    let body = await response.text();
    let parser = new DOMParser();
    let doc = parser.parseFromString(body, "text/html");
    let findDateResult = doc.evaluate(
      "//a[@data-click-id='timestamp']",
      doc,
      null,
      XPathResult.ANY_TYPE,
      null
    );
    let dateElement = findDateResult.iterateNext();
    let findDescriptionResult = doc.evaluate(
      "//meta[@property='og:description']",
      doc,
      null,
      XPathResult.ANY_TYPE,
      null
    );
    let descriptionTag = findDescriptionResult.iterateNext();
    let votesCommentsRegex = /([0-9,]*) vote.* ([0-9,]*) comments/;
    let findVotesComentsResult = votesCommentsRegex.exec(
      descriptionTag.getAttribute("content")
    );
    return {
      votes: findVotesComentsResult[1],
      comments: findVotesComentsResult[2],
      date: dateElement.text,
    };
  } catch (error) {
    console.error(error);
    return {
      error: error,
    };
  }
}

async function getSpecificOption(params) {
  try {
    const { targetStrike, targetExpDate, ticker, targetOptionType } = params;

    const optionsRes = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/options/${ticker}?date=${targetExpDate}`
      // { mode: "no-cors" }
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

    return {
      votes: 1,
      comments: 2,
      date: "foo",
      marketPrice,
      specificOptionPrice,
    };
  } catch (error) {
    return { error };
  }
}
