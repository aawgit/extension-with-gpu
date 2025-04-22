// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.
import {
  ChatCompletionMessageParam,
  CreateExtensionServiceWorkerMLCEngine,
  MLCEngineInterface,
  InitProgressReport,
} from "@mlc-ai/web-llm";

import { ACTION_NAME } from "./constants.js";

const inputElement = document.getElementById("text");
const outputElement = document.getElementById("output");

// Listen for changes made to the textbox.
inputElement.addEventListener("input", async (event) => {
  // Bundle the input data into a message.
  const message = {
    action: ACTION_NAME,
    text: event.target.value,
  };

  // Send this message to the service worker.
  const response = await chrome.runtime.sendMessage(message);

  // Handle results returned by the service worker (`background.js`) and update the popup's UI.
  outputElement.innerText = JSON.stringify(response, null, 2);
});

class LanguageModel {
  static model = "Qwen2-1.5B-Instruct-q4f32_1-MLC";
  static engine = null;
  static instance = null;
  static loaded = false;

  constructor() {
    if (LanguageModel.instance) {
      throw new Error("Cannot instantiate singleton directly. Use getInstance() instead.");
    }
    LanguageModel.instance = this;
  }

  static async getInstance(progress_callback) {
    if (LanguageModel.loaded) {
      return LanguageModel.instance;
    }

    if (!LanguageModel.instance) {
      LanguageModel.instance = new LanguageModel();
    }

    try {
      console.log(`Creating the llm instance...`);

      const engine = await CreateExtensionServiceWorkerMLCEngine(
        LanguageModel.model,
        {
          initProgressCallback: (progress) => {
            console.log(`Progress: ${progress}%`);
            if (progress_callback) progress_callback(progress);
          },
        }
      );

      LanguageModel.engine = engine;
      LanguageModel.loaded = true;

      console.log(`Loaded llm instance`);
    } catch (error) {
      console.error("Failed to initialize language model engine:", error);
      throw error;
    }

    return LanguageModel.instance;
  }
}

(async () => {
  try {
    console.log("Preloading LanguageModel...");
    await LanguageModel.getInstance(progress => console.log(`Loading: ${progress}%`));
    console.log("LanguageModel ready.");
  } catch (e) {
    console.error("Failed to preload LanguageModel:", e);
  }
})();

//only for testing
// const model = await LanguageModel.getInstance(progress => console.log(`Loading: ${progress}%`));
// let prompt = `Hi! How are you?`

// const completion = await model.chat.completions.create({
//   stream: true,
//   messages: [{ role: "user", content: prompt }],
//   model: llmModelId,
// });
// curMessage = `prompt: ${prompt}
//   res: `

// // Update the answer as the model generates more text
// let answer = ""
// for await (const chunk of completion) {
//   const curDelta = chunk.choices[0].delta.content;
//   if (curDelta) {
//     curMessage += curDelta;
//     answer += curDelta
//   }
// }
// console.log(answer)

