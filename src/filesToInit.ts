import { copilotUtilsSubfolderName } from "./initUtils";

export const copilotFIles = {
  embedUtilFile: {
    workspaceRelativeParentFolderFilepath: `${copilotUtilsSubfolderName}`,
    fileName: "embed.py",
    get workspaceRelativeFilepath() {
      return `${this.workspaceRelativeParentFolderFilepath}/${this.fileName}`;
    },
    fileContent: `
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
`,
  },
  pythonRequirementsFile: {
    workspaceRelativeParentFolderFilepath: `${copilotUtilsSubfolderName}`,
    fileName: "requirements.txt",
    get workspaceRelativeFilepath() {
      return `${this.workspaceRelativeParentFolderFilepath}/${this.fileName}`;
    },
    fileContent: `
certifi==2023.11.17
charset-normalizer==3.3.2
click==8.1.7
filelock==3.13.1
fsspec==2023.10.0
huggingface-hub==0.19.4
idna==3.4
Jinja2==3.1.2
joblib==1.3.2
MarkupSafe==2.1.3
mpmath==1.3.0
networkx==3.2.1
nltk==3.8.1
numpy==1.26.2
packaging==23.2
Pillow==10.1.0
PyYAML==6.0.1
regex==2023.10.3
requests==2.31.0
safetensors==0.4.0
scikit-learn==1.3.2
scipy==1.11.4
sentence-transformers==2.2.2
sentencepiece==0.1.99
sympy==1.12
threadpoolctl==3.2.0
tokenizers==0.15.0
torch==2.1.1
torchvision==0.16.1
tqdm==4.66.1
transformers==4.35.2
typing_extensions==4.8.0
urllib3==2.1.0
`,
  },
};
