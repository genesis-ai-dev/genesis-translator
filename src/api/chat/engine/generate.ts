import {
  serviceContextFromDefaults,
  SimpleDirectoryReader,
  storageContextFromDefaults,
  VectorStoreIndex,
} from "llamaindex";

import * as dotenv from "dotenv";

import {
  CHUNK_OVERLAP,
  CHUNK_SIZE,
  STORAGE_CACHE_DIR,
  STORAGE_DIR,
} from "./constants";

// Load environment variables from local .env file
dotenv.config();

async function getRuntime(func: any) {
  const start = Date.now();
  await func();
  const end = Date.now();
  return end - start;
}

async function generateDatasource(serviceContext: any) {
  console.log(`Generating storage context...`);
  // Split documents, create embeddings and store them in the storage context
  const ms = await getRuntime(async () => {
    try {
      const storageContext = await storageContextFromDefaults({
        persistDir: STORAGE_CACHE_DIR,
      });
      const documents = await new SimpleDirectoryReader().loadData({
        directoryPath: STORAGE_DIR,
      });
      console.log({ documents });
      await VectorStoreIndex.fromDocuments(documents, {
        storageContext,
        serviceContext,
      });
    } catch (error) {
      console.log({ error });
    }
  });
  console.log(`Storage context successfully generated in ${ms / 1000}s.`);
}

export async function generateVectors() {
  try {
    const serviceContext = serviceContextFromDefaults({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });
    console.log("before generateDatasource");
    await generateDatasource(serviceContext);
    console.log("Finished generating storage.");
  } catch (error) {
    console.log({ error });
  }
}
