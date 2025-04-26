// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.
//
// Example usage:
//
// import { ACTION_NAME } from "./constants.js";
// const message = {
//     action: ACTION_NAME,
//     text: 'text to classify',
// }
// const response = await chrome.runtime.sendMessage(message);
// console.log('received user data', response)

let pageText = document.body.innerText || "";
let pageTitle = document.title || "";
let pageBody = document.body.textContent | "";
let url =  window.location.href

// // TODO: Extract headings
// chrome.runtime.sendMessage({
//     type: "tabData",
//     url: window.location.href,
//     text: pageText.substring(0, 200),
//     title: pageTitle,
//     content: pageBody
// });

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "GET_PAGE_CONTENT") {
      sendResponse({ text: pageText.substring(0, 200),  url: url, title: pageTitle});
    }
  });
