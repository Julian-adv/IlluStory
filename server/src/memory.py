import chromadb
from fastapi import APIRouter
from pydantic import BaseModel

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


@router.post("/save")
def save_memory(memory: Memory):
    print(f"{memory.id}")
    print(f"{memory.doc}")
    collection = client.get_or_create_collection(
        name=memory.collection, metadata={"hnsw:space": "cosine"}
    )
    collection.add(
        documents=[
            memory.doc
        ],  # we handle tokenization, embedding, and indexing automatically. You can skip that and add your own embeddings as well
        metadatas=[memory.meta],  # filter on these!
        ids=[memory.id],  # unique for each doc
    )
    return {"ok": True}


@router.post("/get")
def get_memory(query: Query):
    print(f"{query.text}")
    print(f"{query.n}")
    collection = client.get_collection(name=query.collection)
    results = collection.query(
        query_texts=[query.text],
        n_results=query.n,
        # where={"metadata_field": "is_equal_to_this"}, # optional filter
        # where_document={"$contains":"search_string"}  # optional filter
    )
    print(f"{results['ids'][0]}")
    print(f"{results['documents'][0]}")
    return {"results": results}
