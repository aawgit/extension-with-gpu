// background.js - Handles requests from the UI, runs the model, then sends back a response

import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { cosineSimilarity } from "./utils.js";
import { EmbeddingModel, LanguageModel } from "./models.js";
import {getSummerizationPrmpt} from "./prompts.js"
import { getBookmarkFolders } from "./bookmarks.js";

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
  if (message.action !== "classify") return; // Ignore messages that are not meant for classification.
  
  // Run model prediction asynchronously
  (async function () {
    // Perform classification
    // const result = "dummy text" //await classify(message.text);
    const folderName = await createBookmark(message)

    // Send response back to UI
    sendResponse('wow!');
  })();

  // return true to indicate we will send a response asynchronously
  // see https://stackoverflow.com/a/46628145 for more information
  return true;
});
//////////////////////////////////////////////////////////////

const createBookmark = async(pageContent) => {
  const pageSummary = await getPageSummary(pageContent)
  const bookmarkFolders = await getBookmarkFolders()
  const folderName = await findFolder(pageSummary, bookmarkFolders)
  if(!folderName){
    // TODO: create a new folder with pageSummary as name and put the url
  }
  else{
    // TODO: put the bookmark in to folder
  }
  return folderName
}


const getPageSummary = async (pageContent) => {
  const model = await LanguageModel.getInstance(progress => console.log(`Loading: ${progress}%`));
  let prompt = getSummerizationPrmpt(pageContent.url, pageContent.title, pageContent.text)
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




