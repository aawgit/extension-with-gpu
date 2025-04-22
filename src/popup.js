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
const buttonElement = document.getElementById("run-button");

buttonElement.addEventListener("click", async () => {
  const inputText = inputElement.value.trim();
  if (!inputText) return;

  const message = {
    action: ACTION_NAME,
    text: inputText,
  };

  try {
    const response = await chrome.runtime.sendMessage(message);
    outputElement.innerText = JSON.stringify(response, null, 2);
  } catch (error) {
    outputElement.innerText = `Error: ${error.message}`;
  }
});



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


