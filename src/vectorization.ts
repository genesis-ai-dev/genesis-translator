const lancedb = require("vectordb");
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as vscode from "vscode";
const path = require("path");
const { exec } = require("child_process");

const getWorkSpaceFolder = () => {
  const workspaceFolder = vscode.workspace.workspaceFolders
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : null;
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace found");
    return;
  }
  return workspaceFolder;
};

const generatePythonEnv = async () => {
  const pythonInterpreter = "python3";
  const workspaceFolder = getWorkSpaceFolder();
  const venvPath = path.join(workspaceFolder, "myenv");
  const command = `${pythonInterpreter} -m venv ${venvPath}`;

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
};

const generatePythonFiles = async () => {
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
  const newFilePath = vscode.Uri.file(
    path.join(workspaceFolder, "new_embed.py"),
  );
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

async function createVectorFromContent() {
  // Update this line to the path of the Python executable in your virtual environment
  const workspaceFolder = getWorkSpaceFolder();
  console.log({ workspaceFolder });
  const pythonInterpreter = `${workspaceFolder}/myenv/bin/python`;
  // Embedded in your app, no servers to manage!
  const lancedb = require("vectordb");

  // Persist your embeddings, metadata, text, images, video, audio & more
  const db = await lancedb.connect(`${workspaceFolder}/data/my_db`);
  console.log({ db });
  const table = await db.createTable("my_table", [
    { id: 1, vector: [3.1, 4.1], item: "foo", price: 10.0 },
    { id: 2, vector: [5.9, 26.5], item: "bar", price: 20.0 },
  ]);
  const results = await table.search([100, 100]).limit(2).execute();

  console.log({ results });
  // return new Promise((resolve, reject) => {
  //   const venvPath = path.join(workspaceFolder, "myenv");
  //   if (!fs.existsSync(venvPath)) {
  //     generatePythonEnv();
  //   }
  //   const command = `${pythonInterpreter} embedding_utils.py`;

  //   exec(command, (error: Error, stdout: string, stderr: string) => {
  //     if (error) {
  //       console.error(`Error: ${error}`);
  //       return reject(error);
  //     }
  //     if (stderr) {
  //       console.error(`Stderr: ${stderr}`);
  //       return reject(stderr);
  //     }
  //     try {
  //       const vector = JSON.parse(stdout);
  //       resolve(vector);
  //     } catch (parseError) {
  //       reject(parseError);
  //     }
  //   });
  // });
}

async function vectorizeResources() {
  // const uri = "./src/lancedb";
  // const db = await lancedb.connect(uri);
  // const table = await db.createTable("my_table", [
  //   { id: 1, vector: [3.1, 4.1], item: "foo", price: 10.0 },
  //   { id: 2, vector: [5.9, 26.5], item: "bar", price: 20.0 },
  // ]);
  // const results = await table.search([100, 100]).limit(2).execute();
  // console.log({ results });

  // await createVectorFromContent();
  const workspaceFolder = getWorkSpaceFolder();
  const db = await lancedb.connect(`${workspaceFolder}/data/my_db`);
  // const uri = "./src/lancedb";
  // const db = await lancedb.connect(uri);

  let files = await vscode.workspace.findFiles("**/resources/**/*");

  const { exec } = require("child_process");

  for (const file of files) {
    const content = await vscode.workspace.fs.readFile(file);
    console.log({ file, content });

    // Process file to create a vector representation
    let vector: string = "";
    const pythonInterpreter = `${workspaceFolder}/myenv/bin/python`;
    const command = `${pythonInterpreter} ${workspaceFolder}/embed.py "${content}"`;
    exec(command, (error: Error, stdout: string, stderr: string) => {
      if (error) {
        console.error(`Error: ${error}`);
        return;
      }
      vector = JSON.parse(stdout);
      console.log({ vector }, 1);
    });
    console.log({ vector }, 2);
    if (vector) {
      const table = await db.createTable(
        file.path,
        [{ path: file.path, vector: vector, content }],
        { mode: "overwrite" },
      );
      const results = await table.search([100, 100]).limit(2).execute();
      console.log({ results });
      // await table.insert({ path: file.path, vector: vector, content });
    }
  }

  // for (const file of files) {
  //   const content = await vscode.workspace.fs.readFile(file);
  //   // Process file to create a vector representation
  //   await table.insert({ path: file.path, vector: vector });
  // }
}
export default vectorizeResources;
