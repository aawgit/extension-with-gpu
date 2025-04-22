// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline } from "@huggingface/transformers";

import { CONTEXT_MENU_ITEM_ID } from "./constants.js";

import { ExtensionServiceWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

/**
 * Wrap the pipeline construction in a Singleton class to ensure:
 * (1) the pipeline is only loaded once, and
 * (2) the pipeline can be loaded lazily (only when needed).
 */
class Singleton {
  static async getInstance(progress_callback) {
    // Return a function which does the following:
    // - Load the pipeline if it hasn't been loaded yet
    // - Run the pipeline, waiting for previous executions to finish if needed
    return (this.fn ??= async (...args) => {
      this.instance ??= pipeline(
        "text-classification",
        "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
        {
          progress_callback,
          device: "webgpu",
          dtype: "q4",
        },
      );

      return (this.promise_chain = (
        this.promise_chain ?? Promise.resolve()
      ).then(async () => (await this.instance)(...args)));
    });
  }
}

// Create generic classify function, which will be reused for the different types of events.
const classify = async (text) => {
  // Get the pipeline instance. This will load and build the model when run for the first time.
  const classifier = await Singleton.getInstance((data) => {
    // You can track the progress of the pipeline creation here.
    // e.g., you can send `data` back to the UI to indicate a progress bar
    // console.log(data)
  });

  // Run the model on the input text
  const result = await classifier(text);
  return result;
};

////////////////////// 1. Context Menus //////////////////////
//
// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(function () {
  // Register a context menu item that will only show up for selection text.
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ITEM_ID,
    title: 'Classify "%s"',
    contexts: ["selection"],
  });
});

// Perform inference when the user clicks a context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Ignore context menu clicks that are not for classifications (or when there is no input)
  if (info.menuItemId !== CONTEXT_MENU_ITEM_ID || !info.selectionText) return;

  // Perform classification on the selected text
  const result = await classify(info.selectionText);

  // Do something with the result
  chrome.scripting.executeScript({
    target: { tabId: tab.id }, // Run in the tab that the user clicked in
    args: [result], // The arguments to pass to the function
    function: (result) => {
      // The function to run
      // NOTE: This function is run in the context of the web page, meaning that `document` is available.
      console.log("result", result);
      console.log("document", document);
    },
  });
});
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
//
// Listen for messages from the UI, process it, and send the result back.
let loaded = false
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action !== "classify") return; // Ignore messages that are not meant for classification.
  // if(!loaded){
  //   LanguageModel.getInstance(progress => console.log(`Loading: ${progress}%`));
  //   return true
  // }
  // Run model prediction asynchronously
  (async function () {
    // Perform classification
    const result = "dummy text" //await classify(message.text);
    await findSimilarity(message.text, "Movies")

    // Send response back to UI
    sendResponse(result);
  })();

  // return true to indicate we will send a response asynchronously
  // see https://stackoverflow.com/a/46628145 for more information
  return true;
});
//////////////////////////////////////////////////////////////

export async function similarity(text1, text2) {
  let e0 = await embed(text1);
  let e1 = await embed(text2);

  return cosineSimilarity(e0, e1);
}

function cosineSimilarity(v1, v2) {
  console.log(`v1 ${typeof (v1)}`)
  console.log(`v2 ${typeof (v2)}`)
  if (v1.length !== v2.length) {
    return -1;
  }
  let dotProduct = 0;
  let v1_mag = 0;
  let v2_mag = 0;
  for (let i = 0; i < v1.length; i++) {
    dotProduct += v1[i] * v2[i];
    v1_mag += v1[i] ** 2;
    v2_mag += v2[i] ** 2;
  }
  return dotProduct / (Math.sqrt(v1_mag) * Math.sqrt(v2_mag));
}

class EmbeddingModel {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';

  static async getInstance(progress_callback) {
    // Return a function which does the following:
    // - Load the pipeline if it hasn't been loaded yet
    // - Run the pipeline, waiting for previous executions to finish if needed
    return (this.fn ??= async (...args) => {
      this.instance ??= pipeline(
        this.task,
        this.model,
        {
          progress_callback,
          device: "webgpu",
          // dtype: "q4",
        },
      );

      return (this.promise_chain = (
        this.promise_chain ?? Promise.resolve()
      ).then(async () => (await this.instance)(...args)));
    });
  }

}

const findSimilarity = async (text1, text2) => {
  // Get the pipeline instance. This will load and build the model when run for the first time.
  const classifier = await EmbeddingModel.getInstance((data) => {
    // You can track the progress of the pipeline creation here.
    // e.g., you can send `data` back to the UI to indicate a progress bar
    // console.log(data)
  });

  // Run the model on the input text
  const result1 = await classifier(text1, { pooling: 'mean', normalize: true });
  const result2 = await classifier(text2, { pooling: 'mean', normalize: true });
  const vec1 = Array.from(result1.tolist()[0]);
  const vec2 = Array.from(result2.tolist()[0]);
  console.log(vec1)

  const similarity = cosineSimilarity(vec1, vec2)
  console.log(similarity)
  return similarity;
};


chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// chrome.action.onClicked.addListener((tab) => {
//     // This opens the side panel when the extension icon is clicked
//     chrome.sidePanel.open({ tabId: tab.id });
//   });


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




