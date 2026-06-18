// Listen for when a user clicks the extension button on the toolbar
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("reader.html")
  });
});