import * as vscode from "vscode";
import { getWorkSpaceFolder } from "./utils";
import {
  CodeAction,
  CodeActionKind,
  TextEdit,
} from "vscode-languageserver-types";
import type {
  CodeActionParams,
  Range as LangServerRange,
  TextDocuments,
} from "vscode-languageserver/node.js";

// todo: look into spell checker repo. We should start a server
function replaceText(range: vscode.Range, text?: string) {
  return TextEdit.replace(range, text || "");
}

export const editFile = ({
  fileUri,
  positionRange: position,
  newContent,
}: {
  fileUri: vscode.Uri;
  positionRange: vscode.Range;
  newContent: string;
}) => {
  vscode.workspace
    .openTextDocument(fileUri)
    .then((document: any) => {
      let edit = new vscode.WorkspaceEdit();
      edit.replace(fileUri, position, newContent);
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
  const rangeStart = new vscode.Position(0, 0);
  const rangeEnd = new vscode.Position(1, 1);

  const range = new vscode.Range(rangeStart, rangeEnd);
  editFile({
    fileUri,
    positionRange: range,
    newContent: "test content",
  });
}

export function showDiffWithOriginal(filePath: string) {
  const originalUri = vscode.Uri.file(workspaceFolder + filePath);
  const tempUri = originalUri.with({ path: `${originalUri.path}.temp` });
  const rangeStart = new vscode.Position(0, 0);
  const rangeEnd = new vscode.Position(1, 1);

  const range = new vscode.Range(rangeStart, rangeEnd);
  editFile({
    fileUri: tempUri,
    positionRange: range,
    newContent: "test content diff",
  });
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
  onDidChangeCodeLensesEmitter: vscode.EventEmitter<vscode.TextDocument>;
  onDidChangeCodeLenses: vscode.Event<any>;
  constructor() {
    this.onDidChangeCodeLensesEmitter = new vscode.EventEmitter();
    this.onDidChangeCodeLenses = this.onDidChangeCodeLensesEmitter.event;
  }

  provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken,
  ) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      return;
    }
    console.log({ selection });
    const range = new vscode.Range(selection.start, selection.end);
    const command: Command = {
      title: "Process This Selection",
      command: "genesis-translator.processSelection",
      arguments: [
        {
          currentText: document.getText(range),
          positionRange: range,
          document,
        },
      ],
    };

    return [new vscode.CodeLens(range, command)];
  }
}

interface Command {
  title: string;
  command: string;
  arguments: CodeLensArgs[];
}
export interface CodeLensArgs {
  currentText: string;
  positionRange: vscode.Range;
  document: vscode.TextDocument;
}
