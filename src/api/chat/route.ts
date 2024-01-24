import express from "express";
import { ChatMessage, MessageContent, OpenAI } from "llamaindex";
import { createChatEngine } from "./engine";
import { LlamaIndexStream } from "./llamaindex-stream";
import { apiBaseUrl } from "../../constants";

const router = express.Router();

const convertMessageContent = (
  textMessage: string,
  imageUrl: string | undefined,
): MessageContent => {
  if (!imageUrl) {
    return textMessage;
  }
  return [
    {
      type: "text",
      text: textMessage,
    },
    {
      type: "image_url",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      image_url: {
        url: imageUrl,
      },
    },
  ];
};

router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    console.log({ request: req });
    const body = req.body;
    const { messages, data } = body;
    const userMessage = messages.pop();
    if (!messages || !userMessage || userMessage.role !== "user") {
      return res.status(400).json({
        error:
          "messages are required in the request body and the last message must be from the user",
      });
    }

    const llm = new OpenAI({
      model: process.env.MODEL ?? "gpt-3.5-turbo",
      maxTokens: 512,
    });

    const chatEngine = await createChatEngine(llm);

    // Convert message content from Vercel/AI format to LlamaIndex/OpenAI format
    const userMessageContent = convertMessageContent(
      userMessage.content,
      data?.imageUrl,
    );

    // Calling LlamaIndex's ChatEngine to get a streamed response
    const response = await chatEngine.chat({
      message: userMessageContent,
      chatHistory: messages,
      stream: true,
    });

    // Transform LlamaIndex stream to Vercel/AI format
    const { stream, data: streamData } = LlamaIndexStream(response, {
      parserOptions: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        image_url: data?.imageUrl,
      },
    });

    // Return a StreamingTextResponse, which can be consumed by the Vercel/AI client
    return res.json({ stream, data: streamData });
  } catch (error: any) {
    console.error("[LlamaIndex]", error);
    return res.status(500).json({
      error: error.message,
    });
  }
});

export const chatServer = express();

chatServer.use("/api/chat", router);

export function startChatServer() {
  console.log(`startChatServer called`, { apiBaseUrl });
  const url = new URL(apiBaseUrl);
  const port = url.port;
  chatServer.listen(port, () => {
    console.log(`Server is running on port ${port}`); // this is not firing WHY??
  });
}
