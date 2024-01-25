import * as vscode from "vscode";
import { apiBaseUrl } from "./constants";
import { getNonce } from "./utilities/getNonce";
import { ChatMessage, FrontEndMessage } from "../types";
import { promptAgent } from "./utils";
import { EXTENSION_NAME } from "./extension";

export class SidebarProvider implements vscode.WebviewViewProvider {
  _view?: vscode.WebviewView;
  _doc?: vscode.TextDocument;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;

    webviewView.webview.options = {
      // Allow scripts in the webview
      enableScripts: true,

      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      async (frontEndMessage: FrontEndMessage) => {
        console.log({ frontEndMessage });
        const response = await vscode.commands.executeCommand(
          `${EXTENSION_NAME}.${frontEndMessage.command.name}`,
          frontEndMessage.command.data,
        );

        console.log({ response });

        // webviewView.webview.postMessage({
        //   type: "messageForChat",
        //   value: { message: { value: `Agent: ${agentOutput}` } },
        // });

        // if (frontEndMessage.command === "sendMessage") {
        //   const message: ChatMessage = frontEndMessage.message;
        //   const prompt = `${message.value}`;
        //   const handleChatResponse = await vscode.commands.executeCommand(
        //     `${EXTENSION_NAME}.handleChatRequest`,
        //     message,
        //   );
        //   console.log({ handleChatResponse });
        //   const agentOutput = await promptAgent(prompt);
        //   webviewView.webview.postMessage({
        //     type: "messageForChat",
        //     value: { message: { value: `Agent: ${agentOutput}` } },
        //   });
        //   // vscode.commands.executeCommand("genesis-translator.openUsfmConverter");
        // } else if (frontEndMessage.command === "startChatServer") {
        //   const handleChatResponse = await vscode.commands.executeCommand(
        //     `${EXTENSION_NAME}.startChatServer`,
        //     // message,
        //   );
        // }
        // todo: Handle other messages with allCommandsObject[message.command](message.data) it's not a function but you get the point
      },
    );
  }

  public revive(panel: vscode.WebviewView) {
    this._view = panel;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "media", "reset.css"),
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "media", "vscode.css"),
    );

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "ChatSideBar",
        "build",
        "assets",
        "index.js",
      ),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this._extensionUri,
        "ChatSideBar",
        "build",
        "assets",
        "index.css",
      ),
    );
    // const styleMainUri = webview.asWebviewUri(
    //   vscode.Uri.joinPath(this._extensionUri, "out", "compiled/sidebar.css"),
    // );

    // Use a nonce to only allow a specific script to be run.
    const nonce = getNonce();
    const apiBaseUrlWebview = webview.asWebviewUri(
      vscode.Uri.parse("http://localhost:65433"),
    );
    // find where to connect react to this by looking at other example repo
    return /*html*/ `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <!--
        Use a content security policy to only allow loading images from https or from our extension directory,
        and only allow scripts that have a specific nonce.
      -->
      <meta http-equiv="Content-Security-Policy" content="img-src https: data: vscode-webview:; style-src 'unsafe-inline' ${
        webview.cspSource
      }; script-src 'nonce-${nonce}'; connect-src vscode-webview: ${apiBaseUrlWebview};">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleResetUri}" rel="stylesheet">
      <link href="${styleVSCodeUri}" rel="stylesheet">
      <link href="${styleUri}" rel="stylesheet">
      <script nonce="${nonce}">
        const apiBaseUrl = ${JSON.stringify(apiBaseUrlWebview)}
      </script>
      </head>
      <body>
      <div id="root"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
  }
}

// `<!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <!--
//         Use a content security policy to only allow loading images from https or from our extension directory,
//         and only allow scripts that have a specific nonce.
//       -->
//       <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${
//         webview.cspSource
//       }; script-src 'nonce-${nonce}';">
//       <meta name="viewport" content="width=device-width, initial-scale=1.0">
//       <link href="${styleResetUri}" rel="stylesheet">
//       <link href="${styleVSCodeUri}" rel="stylesheet">
//       <link href="${styleMainUri}" rel="stylesheet">
//       <script nonce="${nonce}">
//         const tsvscode = acquireVsCodeApi();
//         const apiBaseUrl = ${JSON.stringify(apiBaseUrl)}
//       </script>
//       </head>
//       <body>
//       <h1>HI</h1>
//       <div id="root"></div>
//       <script nonce="${nonce}" src="${scriptUri}"></script>
//     </body>
//     </html>`;
