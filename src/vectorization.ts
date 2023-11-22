const lancedb = require("vectordb");
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as vscode from "vscode";
import { getPythonInterpreter, getWorkSpaceFolder } from "./utils";
import { copilotUtilsSubfolderName } from "./initUtils";
import { copilotFIles } from "./filesToInit";
import { spawn } from "child_process";

const embedText = async (textToEmbed: string) => {
  const workspaceFolder = getWorkSpaceFolder();
  const pythonInterpreter = getPythonInterpreter();
  const command = `${pythonInterpreter} ${workspaceFolder}/${copilotFIles.embedUtilFile.workspaceRelativeFilepath} "${textToEmbed}"`;
  // const { exec } = require("child_process");
  let vector: any = [];

  const process = spawn(command, { shell: true });
  process.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    vector = JSON.parse(data);
  });

  process.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
  });

  process.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
    // if (vector) {
    //   // Rest of your code...
    // }
  });
  // try {
  //   const { stdout } = await exec(command);
  //   console.log({ stdout });
  //   // Ensure stdout is a string before parsing
  //   if (typeof stdout === "string") {
  //     vector = JSON.parse(stdout);
  //   } else {
  //     console.error("stdout is not a string:", stdout);
  //   }
  //   console.log({ vector });
  //   // Rest of your code...
  // } catch (error) {
  //   console.error(`Error: ${error}`);
  // }
  return vector;
};

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
    const pythonInterpreter = getPythonInterpreter();
    const command = `${pythonInterpreter} ${workspaceFolder}/${copilotFIles.embedUtilFile.workspaceRelativeFilepath}"${content}"`;
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

export async function queryVectorizedResources(queryString: string) {
  const workspaceFolder = getWorkSpaceFolder();
  const db = await lancedb.connect(`${workspaceFolder}/data/my_db`);

  let files = await vscode.workspace.findFiles("**/resources/**/*");

  const { exec } = require("child_process");

  for (const file of files) {
    const content = await vscode.workspace.fs.readFile(file);
    const vector = await embedText(queryString);
    //   console.log({ file, content });
    // Process file to create a vector representation
    // let vector: string = "";
    // const pythonInterpreter = getPythonInterpreter();
    // const command = `${pythonInterpreter} ${workspaceFolder}/${copilotFIles.embedUtilFile.workspaceRelativeFilepath}"${queryString}"`;
    // try {
    //   const { stdout } = await exec(command);
    //   console.log({ vector, stdout, queryString });
    //   // Ensure stdout is a string before parsing
    //   if (typeof stdout === "string") {
    //     vector = JSON.parse(stdout);
    //   } else {
    //     console.error("stdout is not a string:", stdout);
    //   }
    //   // Rest of your code...
    // } catch (error) {
    //   console.error(`Error: ${error}`);
    // }
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
