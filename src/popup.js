// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

import { ACTIONS } from "./constants.js";

const outputElement = document.getElementById("output");
const runButton = document.getElementById("run-button");

runButton.disabled = false;

runButton.addEventListener("click", async () => {
  try {
    runButton.disabled = true;
    outputElement.innerText = "Running... If this is the first time, it could take a few minutes to download the model...";

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
    runButton.disabled = false;
  }
});

function showOptions(suggestedFolderName, isExistingFolder, allFolders, tabContent) {
  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = ""; // Clear previous
  optionsDiv.style.display = "block";

  const heading = document.createElement("h3");
  heading.innerText = isExistingFolder
    ? `Suggested folder: "${suggestedFolderName}"`
    : `No matching folder found. I will create: "${suggestedFolderName}"`;
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
    outputElement.innerText = `Bookmarked in ${suggestedFolderName}`;
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

  const form = document.createElement("form");
  form.id = "folder-selection-form";

  folders.forEach(folder => {
    const label = document.createElement("label");
    label.style.display = "block";
    label.style.margin = "5px 0";

    const checkbox = document.createElement("input");
    checkbox.type = "radio";  // radio button to select only one
    checkbox.name = "folder"; // all belong to the same group
    checkbox.value = folder;

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(folder));
    form.appendChild(label);
  });

  const confirmButton = document.createElement("button");
  confirmButton.type = "button";
  confirmButton.innerText = "Confirm";
  confirmButton.style.marginTop = "10px";

  confirmButton.onclick = async () => {
    const selectedFolder = form.querySelector('input[name="folder"]:checked');
    if (!selectedFolder) {
      alert("Please select a folder first.");
      return;
    }

    const folderName = selectedFolder.value;

    await chrome.runtime.sendMessage({
      action: ACTIONS.CONFIRM_BOOKMARK,
      folderName: folderName,
      pageContent: pageContent,
      createNew: false
    });

    outputElement.innerText = `Bookmarked in "${folderName}"`;
    optionsDiv.style.display = "none";
  };

  optionsDiv.appendChild(form);
  optionsDiv.appendChild(confirmButton);
}

