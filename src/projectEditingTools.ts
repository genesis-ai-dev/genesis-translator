import * as vscode from "vscode";
import { getWorkSpaceFolder } from "./utils";

const editFile = ({ fileUri }: { fileUri: vscode.Uri }) => {
  vscode.workspace
    .openTextDocument(fileUri)
    .then((document: any) => {
      console.log({ document });
      let edit = new vscode.WorkspaceEdit();
      // Add your file modifications here
      // For example, to insert text:
      edit.insert(fileUri, new vscode.Position(0, 0), "Your Text\n");
      return vscode.workspace.applyEdit(edit);
    })
    .then((success: any) => {
      console.log({ success });
      if (success) {
        vscode.window.showTextDocument(fileUri);
      } else {
        vscode.window.showInformationMessage("Error!");
      }
    });
};

const editFileWithEditor = () => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showInformationMessage("No editor is active");
    return;
  }

  editor.edit((editBuilder) => {
    // Insert text at the current cursor position
    editBuilder.insert(editor.selection.active, "Hello, World!");
  });
};

const workspaceFolder = getWorkSpaceFolder();
export function openAndEditFile(relativeFilePath: string) {
  const fileUri = vscode.Uri.file(workspaceFolder + relativeFilePath);
  editFile({ fileUri });
}

export function showDiffWithOriginal(filePath: string) {
  const originalUri = vscode.Uri.file(workspaceFolder + filePath);
  const tempUri = originalUri.with({ path: `${originalUri.path}.temp` });
  editFile({ fileUri: tempUri });
  // Apply changes to the temp file
  // ...

  vscode.commands.executeCommand(
    "vscode.diff",
    originalUri,
    tempUri,
    "Changes",
  );
}

export class SelectionCodeLensProvider {
  constructor() {
    this.onDidChangeCodeLensesEmitter = new vscode.EventEmitter();
    this.onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;
  }

  provideCodeLenses(document, token) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      return;
    }

    const range = new vscode.Range(selection.start, selection.end);
    const command = {
      title: "Process This Selection",
      command: "extension.processSelection",
      arguments: [document.getText(range)],
    };

    return [new vscode.CodeLens(range, command)];
  }
}
