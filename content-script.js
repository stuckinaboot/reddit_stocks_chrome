const SUBREDDIT_INDICATOR = "/r/";

const SUPPORTED_SUBREDDITS = new Set([
  "options",
  "stocks",
  "investing",
  "thetagang",
  "wallstreetbets",
  "pennystocks",
]);

function isSupportedSubreddit() {
  const url = location.href;
  const subredditStartIndex = url.indexOf(SUBREDDIT_INDICATOR);
  if (subredditStartIndex === -1) {
    return false;
  }

  const subredditNameStartIndex =
    subredditStartIndex + SUBREDDIT_INDICATOR.length;

  // Search for trailing slash (e.g. / at end of https://www.reddit.com/r/wallstreetbets/)
  // to know the subreddit name end index
  const subredditNameEndIndex = url.indexOf("/", subredditNameStartIndex);
  const subredditName = url
    .substring(
      subredditNameStartIndex,
      // Only include trailing slash index if trailing slash was found
      subredditNameEndIndex !== -1 ? subredditNameEndIndex : undefined
    )
    .toLowerCase();
  return SUPPORTED_SUBREDDITS.has(subredditName);
}

function enrichSearchResults(contextNode = document) {
  if (!isSupportedSubreddit()) {
    return;
  }
  const redditPostLinks = document.evaluate(
    `//div[contains(@class, 'Post') or contains(@class, 'entry') and not(@rsh-processed)]`,
    contextNode,
    null,
    XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE,
    null
  );
  for (let i = 0; i < redditPostLinks.snapshotLength; i++) {
    redditPostLinks.snapshotItem(i).setAttribute("rsh-processed", true);
    const postHeaderEval = document.evaluate(
      // Selects h1 or h3 headers since
      // h1 is used on specific posts (ex. https://www.reddit.com/r/options/comments/k0xcdz/slack_in_talks_to_be_bought_by_salesforce_crm/)
      // and h3 is used on the subreddit main page (ex. https://www.reddit.com/r/options/)
      `.//*[self::h1 or self::h3 or self::a[contains(@class, 'title')]]`,
      redditPostLinks.snapshotItem(i),
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
      redditPostLinks.snapshotItem(i),
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

        const redditInfo = document.createElement("div");
        redditInfo.setAttribute("class", "rsh-wrapper");
        function addText(text, ticker) {
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

        results.forEach((result) => {
          const { ticker, marketPrice, previousClose } = result;

          // Convert decimal to percent (* 10000) and round to two decimal places
          // (/ 100)
          const percentChange =
            Math.round(
              ((marketPrice - previousClose) / previousClose) * 10000
            ) / 100;

          const txt = `${
            percentChange > 0 ? "📈" : "📉"
          }${ticker}: $${marketPrice}, ${percentChange}%`;
          addText(txt, ticker);
        });
        postHeader.insertAdjacentElement("afterend", redditInfo);
      }
    );
  }
}

enrichSearchResults();

let observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    const targetNodeName = mutation.target.nodeName;
    if (targetNodeName === "DIV" || targetNodeName === "div") {
      for (const addedNode of mutation.addedNodes) {
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
