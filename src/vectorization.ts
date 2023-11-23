const lancedb = require("vectordb");
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as vscode from "vscode";
import { getPythonInterpreter, getWorkSpaceFolder } from "./utils";
import { copilotUtilsSubfolderName } from "./initUtils";
import { copilotFIles } from "./filesToInit";
import { spawn } from "child_process";
const workspaceFolder = getWorkSpaceFolder();
const pythonInterpreter = getPythonInterpreter();

function generateEmbedding(textToEmbed: string) {
  return new Promise((resolve, reject) => {
    const command = `${pythonInterpreter} ${workspaceFolder}/${copilotFIles.embedUtilFile.workspaceRelativeFilepath} "${textToEmbed}"`;

    const pythonProcess = spawn(command, { shell: true });
    // const pythonProcess = spawn('python', ['path/to/your_script.py', text]);

    let output = "";
    pythonProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error("stderr:", data.toString());
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}`));
      } else {
        try {
          const embedding = JSON.parse(output);
          resolve(embedding);
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

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
  console.log(await db.tableNames());

  let files = await vscode.workspace.findFiles("**/resources/**/*");

  // const { exec } = require("child_process");

  for (const file of files) {
    const content = await vscode.workspace.fs.readFile(file);
    console.log("hf9uewhdcisj");
    // try {
    const vector: any = await generateEmbedding(queryString);
    const parsedVec = vector;
    console.log("fidsoajodsjia");
    console.log({ file, content, vector, parsedVec });
    // } catch (error) {
    //   console.error(error);
    // }
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
      const table = await db.openTable("my_table");
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
