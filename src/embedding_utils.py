import sys
import json
from sentence_transformers import SentenceTransformer
# vectorize_resources.py
import os
import glob
import json
import lancedb

def get_embeddings(text):
    model_name = "paraphrase-albert-small-v2"
    model = SentenceTransformer(model_name)
    return model.encode(text)

if __name__ == "__main__":
    input_text = sys.argv[1]
    embeddings = get_embeddings(input_text)
    print(json.dumps(embeddings.tolist()))  # Convert numpy array to list and print as JSON

def read_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def main():
    uri = "./src/lancedb"
    db = lancedb.connect(uri)
    table = db.create_table("file_vectors", mode="create")

    # Update this path to your resources directory
    resource_path = "./resources/**/*"
    files = glob.glob(resource_path, recursive=True)

    for file_path in files:
        if os.path.isfile(file_path):
            content = read_file(file_path)
            vector = get_embeddings(content)
            table.insert({"path": file_path, "vector": json.dumps(vector.tolist())})
            


if __name__ == "__main__":
    main()
