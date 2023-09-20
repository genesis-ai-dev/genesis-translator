// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { promptAgent, updateLexicon, parseApiResponse } from './utils';

const dotenv = require('dotenv');
const path = require('path');

const result = dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

if (result.error) {
    throw result.error;
}

if (!process.env.OPENAI_API_KEY) {
    throw new Error("Required environment variables are not set");
}

const userQuery = `The right way to say God is with an uppercase "G"`
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const prompt = `You are a helpful assistant. Try to answer the user query below by using one of your tools. Pay attention to the input required by each tool.
	## Tools
	{name: "updateLexicon", input: [old_string,new_string]}
	{name: "updateVerses", input: [old_string,new_string]}
	## Instruction
	${userQuery}
	Please use the following format in your response:
	Action:
	{name: "tool you want to use", input: "input for tool"}
	
	
	Only respond with a value that matches the Action above
	`
	// Restate task: try to discern what the user wants to do.
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated'
	
	console.log('Congratulations, your extxension "genesis-translator" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('genesis-translator.helloWorld', async () => {
		vscode.window.showInformationMessage('Searching the Lexicon');
		if(vscode.workspace.workspaceFolders !== undefined) {
            const rootPath = vscode.workspace.workspaceFolders[0].uri;
            const pattern = new vscode.RelativePattern(rootPath, '**/*');
            try {
				const agentOutput = await promptAgent(prompt)
				const {name, input} = await parseApiResponse(agentOutput)
				console.log({name, input})
				console.log({agentOutput, prompt})
				if (name === 'updateLexicon') {
					await updateLexicon(input[0], input[1]);
				}
                vscode.window.showInformationMessage('Successfully processed files');
            } catch (error: any) {
                vscode.window.showErrorMessage('Error listing files: ' + error.message);
            }
        } else {
            vscode.window.showErrorMessage('No workspace found');
        }
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
