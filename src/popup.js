// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

import { ACTIONS } from "./constants.js";

const outputElement = document.getElementById("output");
const buttonElement = document.getElementById("run-button");

buttonElement.disabled = false;
outputElement.innerText = "Loading...";

buttonElement.addEventListener("click", async () => {
  try {
    buttonElement.disabled = true;
    outputElement.innerText = "Loading...";

    // Get active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Inject content script if needed
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });

    // Send a message to the content script to get page content
    const tabContent = await chrome.tabs.sendMessage(tab.id, { action: "GET_PAGE_CONTENT" });
    console.log(`tab conent ${JSON.stringify(tabContent)}`)

    const message = {
      action: ACTIONS.GET_FOLDER_NAME,
      text: tabContent.text,
      url: tabContent.url,
      title: tabContent.title,
    };

    const response = await chrome.runtime.sendMessage(message);
    console.log(JSON.stringify(response))
    const { suggestedFolderName, isExistingFolder, allFolders } = response;
    outputElement.innerText = "";
    // Show options
    showOptions(suggestedFolderName, isExistingFolder, allFolders, tabContent);
  } catch (error) {
    outputElement.innerText = `Error: ${error.message}`;
  } finally {
    buttonElement.disabled = false;
  }
});

function showOptions(suggestedFolderName, isExistingFolder, allFolders, tabContent) {
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = ""; // Clear previous
  optionsDiv.style.display = "block";

  const heading = document.createElement("h3");
  heading.innerText = isExistingFolder
    ? `Suggested folder: "${suggestedFolderName}"`
    : `No matching folder found. Will create: "${suggestedFolderName}"`;
  optionsDiv.appendChild(heading);

  const bookmarkBtn = document.createElement("button");
  bookmarkBtn.innerText = isExistingFolder ? "Bookmark here" : "Create and Bookmark";
  bookmarkBtn.onclick = async () => {
    await chrome.runtime.sendMessage({
      action: ACTIONS.CONFIRM_BOOKMARK,
      folderName: suggestedFolderName,
      pageContent: tabContent,
      createNew: !isExistingFolder
    });
    outputElement.innerText = "Bookmark added!";
    optionsDiv.style.display = "none";
  };
  optionsDiv.appendChild(bookmarkBtn);

  const selectFolderBtn = document.createElement("button");
  selectFolderBtn.innerText = "Select different folder";
  selectFolderBtn.onclick = () => {
    showFolderSelection(allFolders, tabContent);
  };
  optionsDiv.appendChild(selectFolderBtn);
}

function showFolderSelection(folders, pageContent) {
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "<h3>Select a folder:</h3>";

  folders.forEach(folder => {
    const btn = document.createElement("button");
    btn.innerText = folder.title;
    btn.onclick = async () => {
      await chrome.runtime.sendMessage({
        action: ACTIONS.CONFIRM_BOOKMARK,
        folderName: folder.title,
        pageContent: pageContent,
        createNew: false
      });
      outputElement.innerText = `Bookmarked in "${folder.title}"!`;
      optionsDiv.style.display = "none";
    };
    optionsDiv.appendChild(btn);
  });
}
