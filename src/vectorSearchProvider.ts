import * as vscode from "vscode";
import { NextRequest, NextResponse } from "next/server";
import { createChatEngine } from "./api/chat/engine";
import { StreamingTextResponse } from "ai";
// import { ChatMessage } from "../types";
import {
  ChatMessage,
  MessageContent,
  OpenAI,
  ContextChatEngine,
} from "llamaindex";
import { LlamaIndexStream } from "./api/chat/llamaindex-stream";

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

export const vectorSearchProvider = (context: vscode.ExtensionContext) => {
  let chatEngine: ContextChatEngine | undefined;

  // Start the chat server when the extension is activated
  context.subscriptions.push(
    vscode.commands.registerCommand("extension.startChatServer", async () => {
      const llm = new OpenAI({
        model: (process.env.MODEL as any) ?? "gpt-3.5-turbo",
        maxTokens: 512,
      });
      chatEngine = await createChatEngine(llm);
    }),
  );

  // Handle incoming chat requests
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "extension.handleChatRequest",
      async (request) => {
        try {
          const body = await request.json();
          const { messages, data }: { messages: ChatMessage[]; data: any } =
            body;
          const userMessage = messages.pop();
          if (!messages || !userMessage || userMessage.role !== "user") {
            return NextResponse.json(
              {
                error:
                  "messages are required in the request body and the last message must be from the user",
              },
              { status: 400 },
            );
          }

          // Convert message content from Vercel/AI format to LlamaIndex/OpenAI format
          const userMessageContent = convertMessageContent(
            userMessage.content,
            data?.imageUrl,
          );

          if (chatEngine) {
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
            return new StreamingTextResponse(stream, {}, streamData);
          }
          // Calling LlamaIndex's ChatEngine to get a streamed response
        } catch (error) {
          console.error("[LlamaIndex]", error);
          return NextResponse.json(
            {
              error: (error as Error).message,
            },
            {
              status: 500,
            },
          );
        }
      },
    ),
  );
};
