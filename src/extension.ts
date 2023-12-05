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
import {
  CodeLensArgs,
  SelectionCodeLensProvider,
  editFile,
  showDiffWithOriginal,
} from "./projectEditingTools";
import { generateFiles } from "./fileUtils";

const grammar = require("usfm-grammar");
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

  let editFilesCommand = vscode.commands.registerCommand(
    "genesis-translator.editFiles",
    async () => {
      showDiffWithOriginal("/resources/lexicon.tsv");
      // vscode.window.showInformationMessage("Vectorizing Resources");
      // try {
      //   await vectorizeResources();
      // } catch (error) {
      //   console.error(error);
      // }
      // vscode.window.showInformationMessage(
      //   "Hello World from translation-test!",
      // );
      // vscode.window.showInformationMessage("Vectorization Complete");
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
    },
  );

  let disposable = vscode.commands.registerCommand(
    "genesis-translator.processSelection",
    function (codeLensArgs: CodeLensArgs) {
      // Process the selected text as required
      vscode.window.showInformationMessage(
        `Selected text: ${codeLensArgs.currentText}`,
      );

      editFile({
        fileUri: codeLensArgs.document.uri,
        positionRange: codeLensArgs.positionRange,
        newContent: "test content",
      });
    },
  );

  context.subscriptions.push(disposable);

  let openUsfmConverterCommand = vscode.commands.registerCommand(
    "genesis-translator.openUsfmConverter",
    async () => {
      const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        canSelectFolders: true,
        canSelectFiles: false,
        openLabel: "Open",
      };

      vscode.window.showOpenDialog(options).then((folderUri) => {
        if (folderUri && folderUri[0]) {
          console.log("Selected file: " + folderUri[0].fsPath);
          const conversionOptions = [
            "USFM to JSON",
            "JSON to USFM",
            "Export to CSV",
          ];
          vscode.window
            .showQuickPick(conversionOptions, {
              placeHolder: "Choose conversion option",
            })
            .then((selectedOption) => {
              console.log({ selectedOption });
              // Handle the selected option
              if (selectedOption === "USFM to JSON") {
                const fs = require("fs");
                const path = require("path");
                const directoryPath = folderUri[0].fsPath;
                fs.readdir(
                  directoryPath,
                  async function (err: any, files: any) {
                    if (err) {
                      return console.log("Unable to scan directory: " + err);
                    }
                    for (const file of files) {
                      if (
                        path.extname(file) === ".SFM" ||
                        path.extname(file) === ".sfm"
                      ) {
                        fs.readFile(
                          path.join(directoryPath, file),
                          "utf8",
                          async function (err: any, contents: any) {
                            console.log({ contents });
                            const myUsfmParser = new grammar.USFMParser(
                              contents,
                            );

                            const jsonOutput: JSON = myUsfmParser.toJSON();
                            console.log({ jsonOutput });
                            const fileName =
                              path.basename(file, path.extname(file)) + ".json";
                            console.log({ fileName }, path.extname(file));

                            await generateFiles({
                              workspaceRelativeParentFolderFilepath:
                                "importedProject",
                              fileName: fileName,
                              fileContent: JSON.stringify(jsonOutput),
                              shouldOverWrite: true,
                            });
                          },
                        );
                      }
                    }
                  },
                );
              }
            });
        }
      });

      // Implement file picker logic here
    },
  );

  context.subscriptions.push(openUsfmConverterCommand);

  // Register the CodeLens provider
  const selectionCodeLensProvider = new SelectionCodeLensProvider();
  let providerDisposable = vscode.languages.registerCodeLensProvider(
    "*",
    selectionCodeLensProvider,
  );
  context.subscriptions.push(providerDisposable);

  // Set up the event listener for selection changes
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      // console.log({ event });
      if (event.textEditor === vscode.window.activeTextEditor) {
        // Refresh CodeLens
        selectionCodeLensProvider.onDidChangeCodeLensesEmitter.fire(
          event.textEditor.document,
        );
      }
    }),
  );
  context.subscriptions.push(disposableThree);

  context.subscriptions.push(translatorsCopilot);

  context.subscriptions.push(createVectorDB);

  context.subscriptions.push(editFilesCommand);
}

// This method is called when your extension is deactivated
export function deactivate() {}
