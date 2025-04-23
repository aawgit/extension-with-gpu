import { pipeline } from "@huggingface/transformers";
import { CreateExtensionServiceWorkerMLCEngine } from "@mlc-ai/web-llm";


export class EmbeddingModel {
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
        }
      );

      return (this.promise_chain = (
        this.promise_chain ?? Promise.resolve()
      ).then(async () => (await this.instance)(...args)));
    });
  }
}
export class LanguageModel {
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

      LanguageModel.instance.engine = engine; // Add this line
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

