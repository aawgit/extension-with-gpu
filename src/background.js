// background.js - Handles requests from the UI, runs the model, then sends back a response

import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";
import { cosineSimilarity } from "./utils.js";
import { EmbeddingModel, LanguageModel } from "../models.js";

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
    const result = await getFolderName(message, "Movies")

    // Send response back to UI
    sendResponse(result);
  })();

  // return true to indicate we will send a response asynchronously
  // see https://stackoverflow.com/a/46628145 for more information
  return true;
});
//////////////////////////////////////////////////////////////


const getFolderName = async (message) => {
  console.log(message)
  // const pageSummary = await getPageSummary()
  // const folderName = await findFolder(pageSummary)
  return 0 //folderName
};

const getPageSummary = async () => {
  const model = await LanguageModel.getInstance(progress => console.log(`Loading: ${progress}%`));
  let prompt = `Hi! How are you?`
  let curMessage = ""
  const completion = await model.engine.chat.completions.create({
    stream: true,
    messages: [{ role: "user", content: prompt }],
  });
  curMessage = `prompt: ${prompt}
  res: `

  // Update the answer as the model generates more text
  let answer = ""
  for await (const chunk of completion) {
    const curDelta = chunk.choices[0].delta.content;
    if (curDelta) {
      curMessage += curDelta;
      answer += curDelta
    }
  }
  console.log(answer)
  return answer
}

const findFolder = async (pageSummary, text2) => {
// Get the pipeline instance. This will load and build the model when run for the first time.
const classifier = await EmbeddingModel.getInstance((data) => {
  // You can track the progress of the pipeline creation here.
  // e.g., you can send `data` back to the UI to indicate a progress bar
  // console.log(data)
});

// Run the model on the input text
const result1 = await classifier(pageSummary, { pooling: 'mean', normalize: true });
const result2 = await classifier(text2, { pooling: 'mean', normalize: true });
const vec1 = Array.from(result1.tolist()[0]);
const vec2 = Array.from(result2.tolist()[0]);
console.log(vec1)

const similarity = cosineSimilarity(vec1, vec2)
console.log(similarity)





return similarity;
}


