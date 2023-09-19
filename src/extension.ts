// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
const awaitFetch = import('node-fetch');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "genesis-translator" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('genesis-translator.helloWorld', async () => {
		if(vscode.workspace.workspaceFolders !== undefined) {
            const rootPath = vscode.workspace.workspaceFolders[0].uri;
            const pattern = new vscode.RelativePattern(rootPath, '**/*');
            try {
                const uris = await vscode.workspace.findFiles(pattern, null, 1000);
                for (const uri of uris) {
                    // Exclude folders and non-text files (by a simple extension check)
                    if (uri.path.endsWith('.txt')) {
                        try {
                            // Read the file content
                            const fileContentUint8Array = await vscode.workspace.fs.readFile(uri);
                            const fileContent = new TextDecoder().decode(fileContentUint8Array);
                            const fetch: any = await awaitFetch
                            // Make POST request to the API
                            const response = await fetch('http://localhost:11434/api/generate', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    model: "llama2",
                                    prompt: fileContent
                                })
                            });
							// const responseData = await response.json();
                            // Get the response text
							const responseText = await response.text();
							let responseLines = responseText.split('\n');
							let finalResponse = "";

							responseLines.forEach((line:any) => {
							if (line) {
								let jsonResponse = JSON.parse(line);
								if (jsonResponse.response) {
								finalResponse += jsonResponse.response;
								}
								if (jsonResponse.done) {
								// The operation is complete
								console.log("Final response:", finalResponse);
								}
							}
							});
							// console.log(responseText);
							// const responseData = JSON.parse(responseText);
							const translatedContent = finalResponse;
							// Append the translated content to the file.
							const newContent = Buffer.from(fileContent + '\n' + translatedContent);
                            await vscode.workspace.fs.writeFile(uri, newContent);
                        } catch (error: any) {
                            vscode.window.showErrorMessage('Error processing file ' + uri.fsPath + ': ' + error.message);
                        }
                    }
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
