// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

import { ACTION_NAME } from "./constants.js";

const inputElement = document.getElementById("text");
const outputElement = document.getElementById("output");
const buttonElement = document.getElementById("run-button");

buttonElement.disabled = false;
outputElement.innerText = "Loading...";

buttonElement.addEventListener("click", async () => {
  const inputText = inputElement.value.trim();
  if (!inputText) return;

  const message = {
    action: ACTION_NAME,
    text: inputText,
  };

  try {
    buttonElement.disabled = true
    const response = await chrome.runtime.sendMessage(message);
    outputElement.innerText = JSON.stringify(response, null, 2);
  } catch (error) {
    outputElement.innerText = `Error: ${error.message}`;
  }finally {
    buttonElement.disabled = false;
  }
});

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

    const message = {
      action: ACTION_NAME,
      text: tabContent.text,
      url: tab.url,
      title: tab.title,
    };

    const response = await chrome.runtime.sendMessage(message);
    outputElement.innerText = JSON.stringify(response, null, 2);
  } catch (error) {
    outputElement.innerText = `Error: ${error.message}`;
  } finally {
    buttonElement.disabled = false;
  }
});




