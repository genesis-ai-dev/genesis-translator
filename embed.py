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