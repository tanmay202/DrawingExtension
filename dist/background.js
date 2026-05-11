chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || message.type !== "ANNOTATOR_CAPTURE_VISIBLE_TAB") {
    return false;
  }

  const windowId = sender.tab && typeof sender.tab.windowId === "number"
    ? sender.tab.windowId
    : undefined;

  chrome.tabs.captureVisibleTab(windowId, { format: "png" }, (dataUrl) => {
    if (chrome.runtime.lastError) {
      sendResponse({ ok: false, error: chrome.runtime.lastError.message });
      return;
    }

    sendResponse({ ok: true, dataUrl });
  });

  return true;
});
