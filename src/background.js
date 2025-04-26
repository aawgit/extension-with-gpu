// background.js - Handles requests from the UI, runs the model, then sends back a response

import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { cosineSimilarity } from "./utils.js";
import { EmbeddingModel, LanguageModel } from "./models.js";
import {getSummerizationPrmpt} from "./prompts.js"
import { getBookmarkFolders } from "./bookmarks.js";
import {ACTIONS} from "./constants.js"

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Hookup an engine to a service worker handler
let handler;

chrome.runtime.onConnect.addListener(function (port) {
  console.assert(port.name === "web_llm_service_worker");
  if (handler === undefined) {
    handler = new ExtensionServiceWorkerMLCEngineHandler(port);
  } else {
    handler.setPort(port);
  }
  port.onMessage.addListener(handler.onmessage.bind(handler));
});

// Listen for messages from the UI, process it, and send the result back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === ACTIONS.GET_FOLDER_NAME) {
    (async function () {
      const pageSummary = await getPageSummary(message);
      const bookmarkFolders = await getBookmarkFolders();
      const folderName = await findFolder(pageSummary, bookmarkFolders);

      const isExistingFolder = folderName ? true : false;
      const allFolders = bookmarkFolders;

      sendResponse({
        suggestedFolderName: folderName || pageSummary,
        isExistingFolder,
        allFolders,
      });
    })();
    return true;
  } else if (message.action === ACTIONS.CONFIRM_BOOKMARK) {
    (async function () {
      await createBookmarkConfirmed(message);
      sendResponse({ success: true });
    })();
    return true;
  }
});

//////////////////////////////////////////////////////////////

const createBookmarkConfirmed = async (message) => {
  console.log(message)
  const {folderName, pageContent, createNew} = message
  if (!pageContent || !pageContent.url || !pageContent.title) {
    throw new Error("Invalid page content: missing title or url.");
  }

  let folderId = null;

  if (createNew) {
    // Create a new folder
    const newFolder = await chrome.bookmarks.create({ title: folderName });
    folderId = newFolder.id;
  } else {
    // Find an existing folder by name
    const folders = await chrome.bookmarks.getTree();
    const stack = [...folders];

    while (stack.length) {
      const node = stack.pop();
      if (node.title === folderName && node.children) {
        folderId = node.id;
        break;
      }
      if (node.children) stack.push(...node.children);
    }

    if (!folderId) {
      throw new Error(`Folder "${folderName}" not found.`);
    }
  }

  // Add the actual page bookmark under the folder
  await chrome.bookmarks.create({
    parentId: folderId,
    title: pageContent.title,
    url: pageContent.url,
  });
};



const getPageSummary = async (pageContent) => {
  const model = await LanguageModel.getInstance(progress => console.log(`Loading: ${progress}%`));
  let prompt = getSummerizationPrmpt(pageContent.url, pageContent.title, pageContent.text)
  console.log(prompt)
  const completion = await model.engine.chat.completions.create({
    stream: true,
    messages: [{ role: "user", content: prompt }],
  });
  // Update the answer as the model generates more text
  let answer = ""
  for await (const chunk of completion) {
    const curDelta = chunk.choices[0].delta.content;
    if (curDelta) {
      answer += curDelta
    }
  }
  console.log(answer)
  return answer
}

const findFolder = async (pageSummary, folders) => {
  const classifier = await EmbeddingModel.getInstance();

  // Get page vector
  const pageResult = await classifier(pageSummary, { pooling: 'mean', normalize: true });
  const pageVector = Array.from(pageResult.tolist()[0]);

  let bestMatch = null;
  let highestSimilarity = 0;

  for (const folder of folders) {
    if (typeof folder !== 'string' || !folder.trim()) continue;

    const folderResult = await classifier(folder, { pooling: 'mean', normalize: true });
    const folderVector = Array.from(folderResult.tolist()[0]);

    // Defensive check
    if (folderVector.length !== pageVector.length) {
      console.warn(`Skipping folder "${folder}" due to vector length mismatch.`);
      continue;
    }

    const similarity = cosineSimilarity(pageVector, folderVector);
    console.log(`Similarity with "${folder}": ${similarity}`);

    if (similarity >= highestSimilarity) {
      highestSimilarity = similarity;
      bestMatch = folder;
      console.log(`--> New best match: "${bestMatch}" with similarity: ${highestSimilarity}`);
    }
  }

  console.log("Final bestMatch:", bestMatch, "with similarity:", highestSimilarity);

  return highestSimilarity >= 0.5 ? bestMatch : null;
};




