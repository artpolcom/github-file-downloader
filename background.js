function isFileExplorerPage(url) {
  // Very complex patterns to exclude GH pages unrelated to code
  const repoRoot = /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/;
  const repoTree = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/tree\/[^\/]+/;

  // Exclude paths like issues, pulls, settings, etc.
  const excluded = /(\/(issues|pulls|settings|actions|discussions|projects|wiki|security|insights))(\/|$)/;

  return (repoRoot.test(url) || repoTree.test(url)) && !excluded.test(url);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && isFileExplorerPage(tab.url)) {
    // Check if script is already injected by checking a certain global variable which is set from content script
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => !!window.__GITHUB_FILE_DOWNLOADER_EXTENSION_LOADED__
    }, (results) => {
      if (results && results[0] && results[0].result) {
        return;
      }

      // Inject scripts and CSS
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["lib/jszip/jszip.min.js", "content.js"]
      });
      chrome.scripting.insertCSS({
        target: { tabId },
        files: ["styles/ext-styles.css"]
      });
    });
  }
});