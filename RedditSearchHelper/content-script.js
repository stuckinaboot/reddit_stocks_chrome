function enrichSearchResults(contextNode = document) {
  const googleSearchLinks = document.evaluate(
    `//div[contains(@class,"Post")]//h3[not(@rsh-processed)]`,
    contextNode,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );

  for (let i = 0; i < googleSearchLinks.snapshotLength; i++) {
    googleSearchLinks.snapshotItem(i).setAttribute("rsh-processed", true);
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

        googleSearchLinks
          .snapshotItem(i)
          .insertAdjacentElement("afterend", redditInfo);
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
