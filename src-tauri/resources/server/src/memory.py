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


class MemoryEmbeddings(BaseModel):
    collection: str
    embeddings: list
    docs: list
    meta: dict
    id: str


class Query(BaseModel):
    collection: str
    text: str
    n: int


class QueryEmbeddings(BaseModel):
    collection: str
    embeddings: list
    n: int


def extract_sentences(text):
    text = re.sub(r"\.\.\.", "<ellipsis>", text)
    pattern = r'((".+?[.!?]"|"[^"]+"[^"]+?[.!?]|[^.!?]+?".+?[.!?]"|.+?[.!?])\s*)'
    matches = re.findall(pattern, text)
    results = [match[0].strip() for match in matches]
    results = [re.sub(r"<ellipsis>", "...", result) for result in results]
    return results


@router.post("/save")
def save_memory(memory: Memory):
    print(f"id: {memory.id} doc: {memory.doc}")
    collection = client.get_or_create_collection(
        name=memory.collection, metadata={"hnsw:space": "cosine"}
    )

    sentences = extract_sentences(memory.doc)
    combined = [
        (
            sentences[i] + " " + sentences[i + 1]
            if i + 1 < len(sentences)
            else sentences[i]
        )
        for i in range(0, len(sentences), 2)
    ]

    for s in combined:
        print(f"sentence: {s}")
    metas = [memory.meta] * len(combined)
    ids = [f"{memory.id}{i:03}" for i in range(0, len(combined))]

    try:
        collection.add(
            documents=combined,
            metadatas=metas,
            ids=ids,
        )
    except Exception as e:
        print(f"collection.add error: {e}\n{combined}\n{metas}\n{ids}")

    return {"ok": True}


@router.post("/save_embeddings")
def save_embeddings(memory: MemoryEmbeddings):
    print(f"id: {memory.id} docs: {memory.docs}")
    collection = client.get_or_create_collection(
        name=memory.collection, metadata={"hnsw:space": "l2"}
    )

    metas = [memory.meta] * len(memory.embeddings)
    ids = [f"{memory.id}{i:03}" for i in range(0, len(memory.embeddings))]

    try:
        collection.add(
            embeddings=memory.embeddings,
            documents=memory.docs,
            metadatas=metas,
            ids=ids,
        )
    except Exception as e:
        print(f"collection.add error: {e}\n{memory.embeddings}\n{metas}\n{ids}")

    return {"ok": True}


@router.post("/get")
def get_memory(query: Query):
    collection = client.get_collection(name=query.collection)
    results = collection.query(
        query_texts=[query.text],
        n_results=query.n,
        where={"role": "assistant"},  # optional filter
        # where_document={"$contains":"search_string"}  # optional filter
    )
    sorted_pairs = sorted(
        zip(results["ids"][0], results["documents"][0]), key=lambda x: int(x[0])
    )
    sorted_ids, sorted_documents = zip(*sorted_pairs)
    results["ids"][0] = list(sorted_ids)
    results["documents"][0] = list(sorted_documents)

    print(f"id: {results['ids'][0]}")
    for sentence in results["documents"][0]:
        print(f"get: {sentence}")
    return {"results": results}


@router.post("/get_embeddings")
def get_embeddings(query: QueryEmbeddings):
    print(f"query {query.n}: {query.embeddings[:5]}...")
    collection = client.get_collection(name=query.collection)
    results = collection.query(
        query_embeddings=query.embeddings,
        n_results=query.n,
        where={"role": "assistant"},  # optional filter
        # where_document={"$contains":"search_string"}  # optional filter
    )
    sorted_pairs = sorted(
        zip(results["ids"][0], results["documents"][0]), key=lambda x: int(x[0])
    )
    sorted_ids, sorted_documents = zip(*sorted_pairs)
    results["ids"][0] = list(sorted_ids)
    results["documents"][0] = list(sorted_documents)

    print(f"id: {results['ids'][0]}")
    for sentence in results["documents"][0]:
        print(f"get: {sentence}")
    return {"results": results}
