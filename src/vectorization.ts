const lancedb = require("vectordb");
import { WriteMode } from "vectordb";
// eslint-disable-next-line @typescript-eslint/naming-convention
import * as vscode from "vscode";
import { getPythonInterpreter, getWorkSpaceFolder } from "./utils";
import { copilotUtilsSubfolderName } from "./initUtils";
import { copilotFIles } from "./filesToInit";
import { spawn } from "child_process";
const workspaceFolder = getWorkSpaceFolder();
const pythonInterpreter = getPythonInterpreter();

function generateEmbedding(textToEmbed: string): Promise<number[]> {
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
          const embedding: number[] = JSON.parse(output);
          resolve(embedding);
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

interface EmbedFunction {
  (batch: string[]): Promise<number[][]>;
}

interface EmbedFun {
  sourceColumn: string;
  embed: EmbedFunction;
}
const embedFunctionJS: EmbedFun = {
  sourceColumn: "text",
  embed: async function (batch: string[]): Promise<number[][]> {
    const { pipeline } = await import("@xenova/transformers");
    const pipe = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
    let result: number[][] = [];
    for (let text of batch) {
      const res = await pipe(text, { pooling: "mean", normalize: true });
      result.push(Array.from(res["data"]));
    }
    return result;
  },
};

const embedFunctionPython: EmbedFun = {
  sourceColumn: "text",
  embed: async function (batch: string[]): Promise<number[][]> {
    const { pipeline } = await import("@xenova/transformers");
    const pipe = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2",
    );
    let result: number[][] = [];
    for (let text of batch) {
      // const res = await pipe(text, { pooling: "mean", normalize: true });
      const vector = await generateEmbedding(text);
      result.push(Array.from(vector));
    }
    return result;
  },
};
async function vectorizeResources() {
  try {
    const workspaceFolder = getWorkSpaceFolder();
    const db = await lancedb.connect(`${workspaceFolder}/data/my_db`);

    let files = await vscode.workspace.findFiles("**/resources/**/*");
    console.log("dsjhfiou4");
    // const resourcesTable = await db.createTable(
    //   "resources",
    //   [
    //     {
    //       vector: [3.1, 4.1],
    //       fileLineNumber: 0,
    //       fileLineContent: "Hello World",
    //       filePath: "none",
    //     },
    //   ],
    //   "overwrite",
    // );
    const resourcesTable = await db.createTable(
      "resources",
      [
        {
          vector: await generateEmbedding("Hello World"),
          fileLineNumber: 0,
          fileLineContent: "Hello World",
          filePath: "none",
        },
      ],
      embedFunctionPython,
      {
        writeMode: WriteMode.Overwrite,
      },
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
              vector: vector[0],
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
