import {
  ContextChatEngine,
  LLM,
  serviceContextFromDefaults,
  SimpleDocumentStore,
  storageContextFromDefaults,
  VectorStoreIndex,
} from "llamaindex";
import { CHUNK_OVERLAP, CHUNK_SIZE, STORAGE_CACHE_DIR } from "./constants";

async function getDataSource(llm: LLM) {
  const serviceContext = serviceContextFromDefaults({
    llm,
    chunkSize: CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });
  let storageContext = await storageContextFromDefaults({
    persistDir: `${STORAGE_CACHE_DIR}`,
  });
  console.log({ storageContext });
  const numberOfDocs = Object.keys(
    (storageContext.docStore as SimpleDocumentStore).toDict(),
  ).length;
  if (numberOfDocs === 0) {
    throw new Error(
      `StorageContext is empty - call 'npm run generate' to generate the storage first`,
    );
  }
  return await VectorStoreIndex.init({
    storageContext,
    serviceContext,
  });
}

export async function createChatEngine(llm: LLM) {
  console.log("createChatEngine was called");
  const index = await getDataSource(llm);
  const retriever = index.asRetriever();
  retriever.similarityTopK = 5;

  return new ContextChatEngine({
    chatModel: llm,
    retriever,
  });
}
