const lancedb = require("vectordb");
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as vscode from "vscode";
import { getWorkSpaceFolder } from "./utils";


async function vectorizeResources() {
  const workspaceFolder = getWorkSpaceFolder();
  const db = await lancedb.connect(`${workspaceFolder}/data/my_db`);

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
