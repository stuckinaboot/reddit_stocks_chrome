function enrichSearchResults(contextNode = document) {
  var googleSearchLinks = document.evaluate(
    // "//div[@class=\"g\"]//a[starts-with(@href, 'https://www.reddit.com') and not(@rsh-processed)]",
    `//div[contains(@class,"Post")]//h3[not(@rsh-processed)]`,
    contextNode,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  console.log("FISH", googleSearchLinks.snapshotLength);

  for (let i = 0; i < googleSearchLinks.snapshotLength; i++) {
    // let link = googleSearchLinks.snapshotItem(i).getAttribute("href");
    googleSearchLinks.snapshotItem(i).setAttribute("rsh-processed", true);
    // if (!link.includes("/comments/")) {
    console.log("POTATO");
    const params = {
      targetStrike: 105,
      targetExpDate: 1606435200,
      ticker: "AAPL",
      targetOptionType: "calls",
    };
    chrome.runtime.sendMessage(
      {
        contentScriptQuery: "fetchOption",
        // "fetchRedditUrl",
        // url: link,
        ...params,
      },
      function (response) {
        if (response.error) {
          return;
        }
        var redditInfo = document.createElement("div");
        redditInfo.setAttribute("class", "rsh-wrapper");

        function addIconAndText(icon, text) {
          // var icon = document.createElement("img");
          // icon.setAttribute("class", "rsh-icon");
          // icon.setAttribute("src", chrome.extension.getURL(iconPath));
          // redditInfo.append(icon);
          let textElement = document.createElement("a");

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

        // addIconAndText("assets/calendar_icon.png", response.date);
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
    // }
  }
}

enrichSearchResults();

// let additionalSearchResultsElement = document.getElementById("extrares");
let observer = new MutationObserver(function (mutations) {
  console.log("HIT THIS HERE");
  mutations.forEach(function (mutation) {
    const targetNodeName = mutation.target.nodeName;
    // let targetId = mutation.target.getAttribute("id");
    // if (targetId && targetId.startsWith("arc-srp")) {
    if (targetNodeName === "DIV" || targetNodeName === "div") {
      for (let addedNode of mutation.addedNodes) {
        enrichSearchResults(addedNode);
      }
    }
  });
});

observer.observe(
  document,
  // additionalSearchResultsElement
  {
    childList: true,
    subtree: true,
    attributes: false,
  }
);
