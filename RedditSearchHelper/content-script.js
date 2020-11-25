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

    const combinedText = postHeaderText + ". " + postContentsText;
    const tickers = combinedText.match(/\b([A-Z]{4}|[A-Z]{3})\b/g);

    chrome.runtime.sendMessage(
      {
        contentScriptQuery: "fetchStock",
        tickers,
      },
      (response) => {
        if (response.error) {
          return;
        }
        const { results } = response;
        results.forEach((result) => {
          const { ticker, marketPrice, previousClose } = result;
          const redditInfo = document.createElement("div");
          redditInfo.setAttribute("class", "rsh-wrapper");

          function addText(text) {
            const textElement = document.createElement("a");

            // Open link in new window on click
            textElement.setAttribute(
              "href",
              "https://finance.yahoo.com/quote/" + ticker
            );
            textElement.setAttribute("target", "_blank");
            textElement.textContent = text;
            textElement.setAttribute("class", "rsh-text");
            redditInfo.append(textElement);
          }

          const percentChange = Math.round(
            ((marketPrice - previousClose) / previousClose) * 100
          );
          const txt = `💵${ticker}: $${marketPrice} ${
            percentChange > 0 ? "📈" : "📉"
          }${percentChange}%`;
          addText(txt);
          postHeader.insertAdjacentElement("afterend", redditInfo);
        });
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
