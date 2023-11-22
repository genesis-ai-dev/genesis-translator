// eslint-disable-next-line @typescript-eslint/naming-convention
import * as vscode from "vscode";
import { getWorkSpaceFolder } from "./utils";
const path = require("path");

export const generateFiles = async ({
  workspaceRelativeParentFolderFilepath,
  fileName,
  fileContent,
  shouldOverWrite,
}: {
  workspaceRelativeParentFolderFilepath?: string;
  fileName: string;
  fileContent: string;
  shouldOverWrite: boolean;
}) => {
  const workspaceFolder = getWorkSpaceFolder();

  const newFilePath = vscode.Uri.file(
    path.join(
      `${workspaceFolder}${
        workspaceRelativeParentFolderFilepath
          ? `/${workspaceRelativeParentFolderFilepath}`
          : ""
      }`,
      fileName,
    ),
  );
  const encoder = new TextEncoder();

  let fileSuccessfullyCreated: boolean = false;

  vscode.workspace.fs.stat(newFilePath).then(
    () => {
      if (shouldOverWrite) {
        vscode.workspace.fs
          .writeFile(newFilePath, encoder.encode(fileContent))
          .then(
            () => {
              fileSuccessfullyCreated = true;
              vscode.window.showInformationMessage(
                `${fileName} file overwritten successfully!`,
              );
            },
            (err) => {
              console.error(`Error: ${err}`);
              vscode.window.showErrorMessage(
                `Error overwriting ${fileName} file: ${err.message}`,
              );
            },
          );
      } else {
        vscode.window.showInformationMessage(
          `${fileName} file already exists!`,
        );
      }
    },
    (err) => {
      vscode.workspace.fs
        .writeFile(newFilePath, encoder.encode(fileContent))
        .then(
          () => {
            fileSuccessfullyCreated = true;
            vscode.window.showInformationMessage(
              `${fileName} file created successfully!`,
            );
          },
          (err) => {
            console.error(`Error: ${err}`);
            vscode.window.showErrorMessage(
              `Error creating new ${fileName} file: ${err.message}`,
            );
          },
        );
    },
  );
  return fileSuccessfullyCreated;
};
