// Function to check whether GitHub file explorer is being browsed
function isFileExplorerPage(url) {
  // Very ugly RegEx patterns to exclude GH pages unrelated to code
  const repoRoot = /^https:\/\/github\.com\/[^\/]+\/[^\/]+$/;
  const repoTree = /^https:\/\/github\.com\/[^\/]+\/[^\/]+\/tree\/[^\/]+/;

  // Exclude paths like issues, pulls, settings, etc., as those are not our targets
  const excluded = /(\/(issues|pulls|settings|actions|discussions|projects|wiki|security|insights))(\/|$)/;

  return (repoRoot.test(url) || repoTree.test(url)) && !excluded.test(url);
}

// Function to get preference from persistent storage
async function getPreference() {
  const result = await chrome.storage.sync.get(['scriptInjectionStatus']);
  return result.scriptInjectionStatus || 'enableInjection';
}

// Function to check whether scripts are injected already
async function isScriptAlreadyInjected(tabId) {
  // __GITHUB_FILE_DOWNLOADER_EXTENSION_LOADED__ is global variable set by injected script
  // Serves as injection flag to avoid repeated injections
  const [result] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => !!window.__GITHUB_FILE_DOWNLOADER_EXTENSION_LOADED__, 
  });
  return result?.result || false;
}

// Tab update listener that performs checks before injecting scripts
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url || !isFileExplorerPage(tab.url)) {
    return;
  }

  try {
    // Abort if user disabled injection or if scripts have been injected already
    if (await getPreference() !== 'enableInjection') return;
    if (await isScriptAlreadyInjected(tabId)) return;

    // Injecting scripts and styles
    await Promise.all([
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['lib/jszip/jszip.min.js', 'content.js'],
      }),
      chrome.scripting.insertCSS({
        target: { tabId },
        files: ['styles/ext-styles.css'],
      })
    ]);
  } catch (error) {
    console.error('Error in tab update handler:', error);
  }
});