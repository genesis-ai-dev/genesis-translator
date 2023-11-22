from transformers import GPT2Model, GPT2Tokenizer
import sys
import json

def get_embeddings(text):
    tokenizer = GPT2Tokenizer.from_pretrained('gpt2')
    model = GPT2Model.from_pretrained('gpt2')

    inputs = tokenizer(text, return_tensors="pt")
    outputs = model(**inputs)

    embeddings = outputs.last_hidden_state.mean(dim=1)
    return embeddings.detach().numpy().tolist()

if __name__ == "__main__":
    input_text = sys.argv[1]
    embeddings = get_embeddings(input_text)
    print(json.dumps(embeddings))
