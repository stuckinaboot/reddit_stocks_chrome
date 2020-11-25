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
    console.log(postHeaderText);

    const postContentsEval = document.evaluate(
      './/div[contains(@class,"RichTextJSON-root")]',
      googleSearchLinks.snapshotItem(i),
      null,
      XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    const postContentsText =
      postContentsEval.snapshotLength !== 0
        ? postContentsEval.snapshotItem(0).textContent
        : "";
    const combinedText = postHeaderText + ". " + postContentsText;

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
