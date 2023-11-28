// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import {
  promptAgent,
  updateLexicon,
  parseApiResponse,
  fetchVerse,
  updateVerse,
  createFile,
} from "./utils";
import vectorizeResources, { queryVectorizedResources } from "./vectorization";
import { generatePythonEnv, generateFilesInWorkspace } from "./initUtils";

const dotenv = require("dotenv");
const path = require("path");

const result = dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

if (result.error) {
  throw result.error;
}

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Required environment variables are not set");
}

export enum AgentFunctionName {
  updateLexicon = "updateLexicon",
  updateVerse = "updateVerse",
  queryResources = "queryResources",
  createFile = "createFile",
}

const tools: {
  name: string;
  input: string[];
  toolDescription: string;
  example: string;
}[] = [
  {
    name: AgentFunctionName.updateLexicon,
    input: ["old_string", "new_string"],
    toolDescription:
      "This tool allows you to update a lexicon entry by replacing an old string with a new string.",
    example: "{name: 'updateLexicon', input: ['old_string', 'new_string']}",
  },
  {
    name: AgentFunctionName.updateVerse,
    input: ["verse_reference", "new_verse_text"],
    toolDescription:
      "This tool allows you to update a verse by providing the verse reference and the new verse text.",
    example:
      "{name: 'updateVerse', input: ['John 3:16', 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.']}",
  },
  {
    name: AgentFunctionName.queryResources,
    input: ["query_string"],
    toolDescription:
      "This tool allows you to query resources by providing a query string. It performs a vector search in the lancedb vector database.",
    example: "{name: 'queryResources', input: ['Genesis 1:1']}",
  },
  {
    name: AgentFunctionName.createFile,
    input: ["file_name", "file_content"],
    toolDescription:
      "This tool allows you to create a new file in the workspace with the provided name and content.",
    example: "{name: 'createFile', input: ['example.txt', 'Hello, World!']}",
  },
];

const agentFunctions: any = {
  [AgentFunctionName.updateLexicon]: async function (
    ...args: Parameters<typeof updateLexicon>
  ) {
    await updateLexicon(...args);
    console.log("updateLexicon was called");
  },
  [AgentFunctionName.updateVerse]: async function (
    ...args: Parameters<typeof updateVerse>
  ) {
    await updateVerse(...args);
    console.log("updateVerse was called");
  },
  [AgentFunctionName.queryResources]: async function (
    ...args: Parameters<typeof fetchVerse>
  ) {
    await fetchVerse(...args);
    console.log("fetchVerse was called");
  },
  [AgentFunctionName.createFile]: async function (
    ...args: Parameters<typeof createFile>
  ) {
    await createFile(...args);
    console.log("createFile was called");
  },
};
export function activate(context: vscode.ExtensionContext) {
  let translatorsCopilot = vscode.commands.registerCommand(
    "genesis-translator.translatorsCopilot",
    async () => {
      vscode.window
        .showInputBox({
          prompt: "What can I help you with in your translation project?",
          placeHolder: "Enter your instruction here",
        })
        .then(async (userQuery) => {
          if (userQuery === undefined || userQuery === "") {
            vscode.window.showInformationMessage("No input provided");
          } else {
            if (vscode.workspace.workspaceFolders !== undefined) {
              //   const rootPath = vscode.workspace.workspaceFolders[0].uri;

              try {
                const prompt = `
							You are a helpful assistant. Try to answer the user query below by using one of your tools. Pay attention to the input required by each tool.
							## Tools
							${tools.map((tool) => tool.name).join("\n")}
							## Instruction
							${userQuery}
							Please use the following format in your response:
							
							/* Action: */
							${tools.map((tool) => JSON.stringify(tool)).join("\n")}
							
							
							The Action name must be an exact match and the input should match the format of the example given. 
              Only respond with a value that matches the Action example above.
						`;
                console.log({ prompt });
                const agentOutput = await promptAgent(prompt);
                const { name, input } = await parseApiResponse(agentOutput);
                console.log({ name, input });
                console.log({ agentOutput, prompt });

                if (!name) {
                  vscode.window.showErrorMessage(
                    "Agent did not return a tool name",
                  );
                  return;
                }
                const functionToCallBaseOnAgentResponse: (
                  ...args: any
                ) => Promise<any> | undefined = agentFunctions[name];

                if (!functionToCallBaseOnAgentResponse) {
                  vscode.window.showErrorMessage(
                    "Agent returned an invalid tool name",
                  );
                  return;
                }

                await functionToCallBaseOnAgentResponse(...input);

                vscode.window.showInformationMessage(
                  "Successfully processed files",
                );
              } catch (error: any) {
                vscode.window.showErrorMessage(
                  "Error listing files: " + error.message,
                );
              }
            } else {
              vscode.window.showErrorMessage("No workspace found");
            }
          }
        });
    },
  );

  let createVectorDB = vscode.commands.registerCommand(
    "genesis-translator.createVectorDB",
    async () => {
      vscode.window.showInformationMessage("Vectorizing Resources");
      try {
        await vectorizeResources();
      } catch (error) {
        console.error(error);
      }
      vscode.window.showInformationMessage(
        "Hello World from translation-test!",
      );
      vscode.window.showInformationMessage("Vectorization Complete");
    },
  );
  // const { exec } = require("child_process");
  let disposableThree = vscode.commands.registerCommand(
    "genesis-translator.askResources",
    async () => {
      vscode.window
        .showInputBox({
          prompt: "What Kind of information are you looking for?",
          placeHolder: "Enter your instruction here",
        })
        .then(async (userQuery) => {
          if (userQuery) {
            await queryVectorizedResources(userQuery);
          } else {
            vscode.window.showInformationMessage(
              "Type something in the prompt silly :)",
            );
          }
        });
      // await generatePythonEnv();
      // await generateFilesInWorkspace();
      // // The code you place here will be executed every time your command is executed
      // // Create a new Python virtual environment in the project
      // const pythonInterpreter = "python3";
      // const workspaceFolder = vscode.workspace.workspaceFolders
      //   ? vscode.workspace.workspaceFolders[0].uri.fsPath
      //   : null;
      // if (!workspaceFolder) {
      //   vscode.window.showErrorMessage("No workspace found");
      //   return;
      // }
      // const venvPath = path.join(workspaceFolder, "myenv");
      // const command = `${pythonInterpreter} -m venv ${venvPath}`;

      // exec(command, (error: Error, stdout: string, stderr: string) => {
      //   if (error) {
      //     console.error(`Error: ${error}`);
      //     vscode.window.showErrorMessage(
      //       `Error creating Python virtual environment: ${error.message}`,
      //     );
      //   } else {
      //     vscode.window.showInformationMessage(
      //       "Python virtual environment created successfully!",
      //     );
      //   }
      // });
    },
  );

  // add a new command that

  context.subscriptions.push(disposableThree);

  context.subscriptions.push(translatorsCopilot);

  context.subscriptions.push(createVectorDB);

  //   let disposable = vscode.commands.registerCommand('extension.analyzeText', async () => {
  //     // Get the active editor
  //     let editor = vscode.window.activeTextEditor;
  //     if (editor) {
  //         // Get the selection
  //         let selection = editor.selection;
  //         let text = editor.document.getText(selection);

  //         if (text) {
  //             // Send the text to your API
  //             try {
  //                 let response = await axios.post('https://your-api-url.com/analyze', { text });
  //                 // Handle the API response (maybe show the analysis results in a message box)
  //                 vscode.window.showInformationMessage('Analysis Result: ' + response.data);
  //             } catch (error) {
  //                 // Handle errors
  //                 vscode.window.showErrorMessage('Error analyzing text: ' + error.message);
  //             }
  //         } else {
  //             vscode.window.showInformationMessage('No text selected');
  //         }
  //     }
  // });

  // context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
