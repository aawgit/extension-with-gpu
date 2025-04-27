# 📚 Browser Extension to Select the Bookmark Folder
This is based on the example project to show how to run 🤗 Transformers in a browser extension.  https://github.com/huggingface/transformers.js-examples.git
transformers.js-examples/browser-extension/

## 🚀 Features

- Runs a lightweight **transformers model** entirely in your browser (no backend needed!).
- **Analyzes** the web page and suggests a suitable **bookmark folder**.
- Allows users to **manually select** a folder if needed.
- **Lightweight, fast, and private** — no server communication.

---

## ⚙️ Requirements

- **Google Chrome** or **Chromium-based browsers** (tested on Chrome).
- **Chrome version 113 or newer** is recommended (for stable WebGPU support).
- **A GPU and support for WebGPU** This can be checked from here: [webgpureport](https://webgpureport.org/)

---

## 🔧 Browser Configuration

**Important:**  
This extension relies on **WebGPU** to run AI models efficiently inside the browser.  
You need to enable WebGPU manually:

1. Open Chrome and navigate to: `chrome://flags`
2. Search for **"Enable WebGPU"**.
3. Set it to **Enabled**.
4. Restart Chrome.

If you still encounter issues, try launching Chrome with the `--enable-unsafe-webgpu` flag (only if absolutely necessary).

---

## 🛠 Installation and Usage

1. Clone or download this repository.
2. cd to the project directory and run `npm run build`
2. Open Chrome → go to `chrome://extensions/`.
3. Turn on **Developer mode** (toggle at the top-right corner).
4. Click **Load unpacked** and select `/build` directory in this project’s directory.
5. The extension icon will appear in your toolbar.
6. Navigate to any page → click the extension → click **"Bookmark this page"**!
7. Select the suggested folder or pick one manually.

The models used in this extension are approximately 1 GB in size in total. On slower internet connections, the download process may take a significant amount of time and could occasionally result in errors.
If the loading state seems to persist for too long, you can inspect the console logs by right-clicking on the panel and selecting "Inspect".
If you encounter any issues or suspect a bug, please feel free to open an issue — contributions and feedback are always welcome!

---

## 📦 Tech Stack

- [transformers.js](https://huggingface.co/docs/transformers.js/index) by Hugging Face
- [webllm](https://www.npmjs.com/package/@mlc-ai/web-llm) in-browser LLM inference tool
- Vanilla JavaScript (no frameworks)
- HTML + CSS
- Chrome Extension APIs (Manifest V3)

---

## ⚠️ Notes

- The first run may take a little longer (~a few minutes) because the ML models are downloaded and initialized.
- Subsequent uses will be much faster.
- All processing happen **locally** inside your browser — your browsing data never leaves your device.

---