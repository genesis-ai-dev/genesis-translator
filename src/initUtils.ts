// eslint-disable-next-line @typescript-eslint/naming-convention
import * as vscode from "vscode";
import { getWorkSpaceFolder } from "./utils";
const path = require("path");
const { exec } = require("child_process");

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
  
  export const generatePythonFiles = async () => {
    const workspaceFolder = getWorkSpaceFolder();
  
    // After the virtual environment is created, write the embed.py script to a new file
    const embedScript = `
  from sentence_transformers import SentenceTransformer
  import sys
  import json
  
  def generate_embedding(text):
      model = SentenceTransformer('paraphrase-albert-small-v2')
      embedding = model.encode([text])
      return embedding.tolist()
  
  if __name__ == "__main__":
      text = sys.argv[1]
      embedding = generate_embedding(text)
      print(json.dumps(embedding))
  `;
    const newFilePath = vscode.Uri.file(path.join(workspaceFolder, "embed.py"));
    const encoder = new TextEncoder();
  
    vscode.workspace.fs.stat(newFilePath).then(
      () => {
        vscode.window.showInformationMessage("Python file already exists!");
      },
      (err) => {
        vscode.workspace.fs
          .writeFile(newFilePath, encoder.encode(embedScript))
          .then(
            () => {
              vscode.window.showInformationMessage(
                "New Python file created successfully!",
              );
            },
            (err) => {
              console.error(`Error: ${err}`);
              vscode.window.showErrorMessage(
                `Error creating new Python file: ${err.message}`,
              );
            },
          );
      },
    );
  };