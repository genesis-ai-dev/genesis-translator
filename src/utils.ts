import * as vscode from "vscode";
import { AgentFunctionName } from "./extension";

const tectalicOpenai = require("@tectalic/openai").default;

const fs = require("fs");
const path = require("path");

export function parseApiResponse(response: string): {
  name: AgentFunctionName | null;
  input: string[];
} {
  try {
    const JSON5 = require("json5");
    try {
      const parsedObj = JSON5.parse(response);
      console.log(parsedObj);
      return parsedObj;
    } catch (e) {
      console.error("Failed to parse JSON:", e);
    }

    throw new Error("Could not parse response:" + response);
  } catch (error) {
    console.error("Error parsing response:", error);
    vscode.window.showErrorMessage("Error parsing response: " + error);
    return { name: null, input: [] };
  }
}

async function createChatCompletionWithOpenAi(promt: string) {
  try {
    return await tectalicOpenai(process.env.OPENAI_API_KEY)
      .chatCompletions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: promt }],
      })
      .then((response: any) => {
        const responseText = response.data.choices[0].message.content.trim();
        console.log({ response });
        return responseText;
      });
  } catch (error) {
    console.error(error);
  }
}

export const promptAgent = async (prompt: string) => {
  const response = await createChatCompletionWithOpenAi(prompt);
  return response;
};
export const fetchVerse = async (prompt: string) => {};
export const updateVerse = async (prompt: string) => {};

export const updateLexicon = async (oldString: string, newString: string) => {
  if (vscode.workspace.workspaceFolders !== undefined) {
    const rootPath = vscode.workspace.workspaceFolders[0].uri;
    try {
      const lexiconUri = vscode.Uri.joinPath(rootPath, "project/lexicon.csv");
      const lexiconContentUint8Array =
        await vscode.workspace.fs.readFile(lexiconUri);
      const lexiconContent = new TextDecoder().decode(lexiconContentUint8Array);
      console.log({ lexiconContent });
      const lines = lexiconContent?.split("\n");
      // FIXME: this should be finding multiple lines with the old string
      const indexOfRelevantLines = lines.findIndex((line: string) => {
        // example value of line: "hello,world"
        return line.includes(oldString);
      });
      const lineIndex = indexOfRelevantLines; // Replace with the desired line index
      if (lines.length > lineIndex) {
        const lineContent = lines[lineIndex];
        vscode.window.showInformationMessage(
          "Line Content to update: " + lineContent,
        );
        const updatedLine = lineContent
          ?.split(",")
          .map((word: string) => {
            if (word === oldString) {
              return newString;
            }
            return word;
          })
          .join(",");

        lines[lineIndex] = updatedLine;
        const newContent = Buffer.from(lines.join("\n"));
        await vscode.workspace.fs.writeFile(lexiconUri, newContent);
        vscode.window.showInformationMessage(
          "Successfully processed lexicon.csv",
        );
      } else {
        vscode.window.showErrorMessage("Line index out of bounds");
      }
    } catch (error: any) {
      vscode.window.showErrorMessage("Error processing file: " + error.message);
    }
  } else {
    vscode.window.showErrorMessage("No workspace found");
  }
};

export const createFile = async () => {
  const folderPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath; // Get the path of the first workspace folder

  if (folderPath) {
    const filePath = path.join(folderPath, "newfile.txt"); // Define the file path

    const fileUri = vscode.Uri.file(filePath); // Create a URI for the file
    const data = Buffer.from("Hello, World!", "utf-8"); // Data to write in the file

    vscode.workspace.fs.writeFile(fileUri, data).then(
      () => {
        vscode.window.showInformationMessage("File created successfully!");
      },
      (err) => {
        vscode.window.showErrorMessage("Error creating file: " + err);
      },
    );
  }
};
