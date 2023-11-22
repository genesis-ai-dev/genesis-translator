// eslint-disable-next-line @typescript-eslint/naming-convention
import * as vscode from "vscode";
import { getWorkSpaceFolder } from "./utils";
import { copilotFIles } from "./filesToInit";
const path = require("path");
const { exec } = require("child_process");
import { generateFiles } from "./fileUtils";

export const copilotUtilsSubfolderName = `copilotUtils`;

export const generatePythonEnv = async () => {
  const pythonInterpreter = "python3";
  const workspaceFolder = getWorkSpaceFolder();
  const venvPath = path.join(workspaceFolder, "myenv");
  const command = `${pythonInterpreter} -m venv ${venvPath}`;

  const venvPathUri = vscode.Uri.file(venvPath);

  vscode.workspace.fs.stat(venvPathUri).then(
    () => {
      vscode.window.showInformationMessage(
        "Python virtual env file already exists!",
      );
    },
    (err) => {
      exec(command, (error: Error, stdout: string, stderr: string) => {
        if (error) {
          console.error(`Error: ${error}`);
          vscode.window.showErrorMessage(
            `Error creating Python virtual environment: ${error.message}`,
          );
        } else {
          vscode.window.showInformationMessage(
            "Python virtual environment created successfully!",
          );
        }
      });
    },
  );
};

export const generateFilesInWorkspace = async (shouldOverWrite = false) => {
  for (const file of Object.values(copilotFIles)) {
    const { fileName, workspaceRelativeParentFolderFilepath, fileContent } =
      file;

    await generateFiles({
      fileName,
      workspaceRelativeParentFolderFilepath,
      fileContent,
      shouldOverWrite,
    });
  }
};
