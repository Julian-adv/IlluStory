import chromadb
from fastapi import APIRouter
from pydantic import BaseModel
import re
import logging

router = APIRouter(prefix="/api/memory")

path = "data/memory.chromadb"
client = chromadb.PersistentClient(path=path)
print(f"chromadb at {path}")


class Memory(BaseModel):
    collection: str
    doc: str
    meta: dict
    id: str


class Query(BaseModel):
    collection: str
    text: str
    n: int


def extract_name_and_dialogue(text):
    pattern = r'(\b[A-Za-z][A-Za-z-]*(?:\s[A-Za-z][A-Za-z-]*)*:\s*"[^"]*")'
    matches = re.findall(pattern, text)
    remaining_text = re.sub(pattern, "", text).strip()
    return matches, remaining_text


@router.post("/save")
def save_memory(memory: Memory):
    print(f"id: {memory.id} doc: {memory.doc}")
    collection = client.get_or_create_collection(
        name=memory.collection, metadata={"hnsw:space": "cosine"}
    )

    dialogues, remaining_text = extract_name_and_dialogue(memory.doc)
    sentences = re.split(r'(?<=[.!?])"?\s+', remaining_text)
    sentences = dialogues + sentences
    print(f"sentences: {sentences}")
    metas = [memory.meta] * len(sentences)
    ids = [f"{memory.id}{i:03}" for i in range(0, len(sentences))]

    collection.add(
        documents=sentences,
        metadatas=metas,
        ids=ids,
    )
    return {"ok": True}


@router.post("/get")
def get_memory(query: Query):
    print(f"query {query.n}: {query.text}")
    collection = client.get_collection(name=query.collection)
    results = collection.query(
        query_texts=[query.text],
        n_results=query.n,
        where={"role": "assistant"},  # optional filter
        # where_document={"$contains":"search_string"}  # optional filter
    )
    print(f"id: {results['ids'][0]}")
    print(f"doc: {results['documents'][0]}")
    return {"results": results}
