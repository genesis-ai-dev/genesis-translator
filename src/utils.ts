import * as vscode from "vscode";
import { AgentFunctionName } from "./extension";

const tectalicOpenai = require("@tectalic/openai").default;

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
interface Alignment {
  "English phrase": string;
  "Greek phrase"?: string;
  "Hebrew phrase"?: string;
}

interface Verse {
  vref: string;
  alignments: Alignment[];
}

export const fetchVerse = async (targetVref: string) => {
  if (vscode.workspace.workspaceFolders !== undefined) {
    const rootPath = vscode.workspace.workspaceFolders[0].uri;
    try {
      const versesUri = vscode.Uri.joinPath(rootPath, "project/verses.jsonl");
      const versesContentUint8Array =
        await vscode.workspace.fs.readFile(versesUri);
      const versesContent = new TextDecoder().decode(versesContentUint8Array);
      const lines = versesContent?.split("\n");

      for (const line of lines) {
        const verse: Verse = JSON.parse(line);
        if (verse.vref === targetVref) {
          vscode.window.showInformationMessage(
            `Found verse: ${JSON.stringify(verse)}`,
          );
          return verse;
        }
      }

      vscode.window.showWarningMessage("Verse not found");
      return null;
    } catch (error: any) {
      vscode.window.showErrorMessage("Error processing file: " + error.message);
      return null;
    }
  } else {
    vscode.window.showErrorMessage("No workspace found");
    return null;
  }
};

export const updateVerse = async (updatedVerse: Verse) => {
  if (vscode.workspace.workspaceFolders !== undefined) {
    const rootPath = vscode.workspace.workspaceFolders[0].uri;
    try {
      const versesUri = vscode.Uri.joinPath(rootPath, "project/verses.jsonl");
      const versesContentUint8Array =
        await vscode.workspace.fs.readFile(versesUri);
      const versesContent = new TextDecoder().decode(versesContentUint8Array);
      const lines = versesContent?.split("\n");

      let verseUpdated = false;

      for (let i = 0; i < lines.length; i++) {
        const verse: Verse = JSON.parse(lines[i]);
        if (verse.vref === updatedVerse.vref) {
          lines[i] = JSON.stringify(updatedVerse);
          verseUpdated = true;
          break;
        }
      }

      if (verseUpdated) {
        const newContent = Buffer.from(lines.join("\n"));
        await vscode.workspace.fs.writeFile(versesUri, newContent);
        vscode.window.showInformationMessage(
          `Successfully updated verse: ${updatedVerse.vref}`,
        );
      } else {
        vscode.window.showWarningMessage("Verse not found. No updates made.");
      }
    } catch (error: any) {
      vscode.window.showErrorMessage("Error processing file: " + error.message);
    }
  } else {
    vscode.window.showErrorMessage("No workspace found");
  }
};
