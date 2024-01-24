import * as vscode from "vscode";

export const STORAGE_DIR =
  vscode.workspace.workspaceFolders?.[0].uri.fsPath + "/resources";
export const STORAGE_CACHE_DIR =
  vscode.workspace.workspaceFolders?.[0].uri.fsPath + "/cache";
export const CHUNK_SIZE = 512;
export const CHUNK_OVERLAP = 20;
