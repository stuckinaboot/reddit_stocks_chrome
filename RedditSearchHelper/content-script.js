function enrichSearchResults(contextNode = document) {
  const googleSearchLinks = document.evaluate(
    `//div[contains(@class,"Post") and not(@rsh-processed)]`,
    contextNode,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (let i = 0; i < googleSearchLinks.snapshotLength; i++) {
    googleSearchLinks.snapshotItem(i).setAttribute("rsh-processed", true);
    const postHeaderEval = document.evaluate(
      `.//h3`,
      googleSearchLinks.snapshotItem(i),
      null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null
    );

    if (postHeaderEval.snapshotLength === 0) {
      continue;
    }
    const postHeader = postHeaderEval.snapshotItem(0);
    const postHeaderText = postHeader.textContent;

    const postContentsEval = document.evaluate(
      ".//p",
      googleSearchLinks.snapshotItem(i),
      null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    let postContentsText = "";
    for (let i = 0; i < postContentsEval.snapshotLength; i++) {
      postContentsText += postContentsEval.snapshotItem(i).textContent + ". ";
    }

    function extractParams(txt) {
      const tickers = txt.match(/\b([A-Z]{4}|[A-Z]{3})\b/g);
      const callCheck = txt.match(/call[s]\b/gi);
      const putCheck = txt.match(/put[s]\b/gi);
    }

    const combinedText = postHeaderText + ". " + postContentsText;

    console.log(combinedText);

    const params = {
      targetStrike: 105,
      targetExpDate: 1606435200,
      ticker: "AAPL",
      targetOptionType: "calls",
    };
    chrome.runtime.sendMessage(
      {
        contentScriptQuery: "fetchOption",
        ...params,
      },
      (response) => {
        if (response.error) {
          return;
        }
        var redditInfo = document.createElement("div");
        redditInfo.setAttribute("class", "rsh-wrapper");

        function addIconAndText(icon, text) {
          const textElement = document.createElement("a");

          // Open link in new window on click
          textElement.setAttribute(
            "href",
            "https://finance.yahoo.com/quote/" + params.ticker
          );
          textElement.setAttribute("target", "_blank");
          textElement.textContent = icon + text;
          textElement.setAttribute("class", "rsh-text");
          redditInfo.append(textElement);
        }

        addIconAndText("📈", params.ticker + ": $" + response.marketPrice);
        addIconAndText(
          "💵",
          "2020-03-18 $" +
            params.targetStrike +
            "c: $" +
            response.specificOptionPrice
        );

        postHeader.insertAdjacentElement("afterend", redditInfo);
      }
    );
  }
}

enrichSearchResults();

let observer = new MutationObserver(function (mutations) {
  mutations.forEach((mutation) => {
    const targetNodeName = mutation.target.nodeName;
    if (targetNodeName === "DIV" || targetNodeName === "div") {
      for (let addedNode of mutation.addedNodes) {
        enrichSearchResults(addedNode);
      }
    }
  });
});

observer.observe(document, {
  childList: true,
  subtree: true,
  attributes: false,
});
