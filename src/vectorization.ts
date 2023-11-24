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
  try {
    const workspaceFolder = getWorkSpaceFolder();
    const db = await lancedb.connect(`${workspaceFolder}/data/my_db`);

    let files = await vscode.workspace.findFiles("**/resources/**/*");

    const resourcesTable = await db.createTable(
      "resources",
      [
        {
          vector: [3.1, 4.1],
          fileLineNumber: 0,
          fileLineContent: "Hello World",
          filePath: "none",
        },
        { mode: "overwrite" },
      ],
      { mode: "overwrite" },
    );
    console.log({ resourcesTable });
    for (const file of files) {
      const content = await vscode.workspace.fs.readFile(file);
      const lines = content.toString().split("\n");
      console.log({ lines });
      if (lines?.length > 0) {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const vector = await generateEmbedding(line);
          console.log({ vector });
          if (vector) {
            await resourcesTable.add({
              vector: vector,
              fileLineNumber: i,
              fileLineContent: line,
              filePath: file.path,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error(error, "ldaskjfo");
  }
}

export async function queryVectorizedResources(queryString: string) {
  const workspaceFolder = getWorkSpaceFolder();
  const db = await lancedb.connect(`${workspaceFolder}/data/my_db`);
  console.log(await db.tableNames());

  let files = await vscode.workspace.findFiles("**/resources/**/*");

  for (const file of files) {
    const content = await vscode.workspace.fs.readFile(file);
    console.log("hf9uewhdcisj");
    const vector: any = await generateEmbedding(queryString);
    const parsedVec = vector;
    console.log("fidsoajodsjia");
    console.log({ file, content, vector, parsedVec });

    console.log({ vector }, 2);
    if (vector) {
      const table = await db.openTable("my_table"); // change this to an actual table
      const results = await table.search([100, 100]).limit(2).execute();
      console.log({ results });
    }
  }
}

export default vectorizeResources;
