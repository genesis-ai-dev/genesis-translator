// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { promptAgent, updateLexicon, parseApiResponse } from "./utils";

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
}

const tools = [
  {
    name: AgentFunctionName.updateLexicon,
    input: ["old_string", "new_string"],
  },
  { name: AgentFunctionName.updateVerse, input: ["old_string", "new_string"] },
];

const agentFunctions: any = {
  [AgentFunctionName.updateLexicon]: async function (
    ...args: Parameters<typeof updateLexicon>
  ) {
    await updateLexicon(...args);
    console.log("updateLexicon was called");
  },
};

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
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
							{name: "updateLexicon", input: ['jesus', 'Jesus']}
							
							
							Only respond with a value that matches the Action above
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

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
