import os
import requests
import fitz  # PyMuPDF
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from dotenv import load_dotenv

from langchain_text_splitters import RecursiveCharacterTextSplitter
# .env file se keys read karo
load_dotenv()

# Setup
embedder = SentenceTransformer('all-MiniLM-L6-v2')
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
pinecone_index = pc.Index("ragpipeline")

# Yeh ab ek simple function hai, API endpoint nahi!
def process_and_ingest_pdf(file_url: str, document_id: str):
    print(f"--> Processing doc: {document_id}")
    
    response = requests.get(file_url)
    response.raise_for_status()
    
    doc = fitz.open(stream=response.content, filetype="pdf")
    raw_text = ""
    for page in doc:
        raw_text += page.get_text()
        
    # LangChain Text Splitter ka use karke smart chunking karo
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    
    # create_documents ki jagah split_text use karenge
    chunks_list = text_splitter.split_text(raw_text) 

    pinecone_vectors = []
    for i, chunk_text in enumerate(chunks_list):
        # Ab chunk_text seedha ek string hai, usko encode karo
        vector = embedder.encode(chunk_text).tolist()
        
        unique_id = f"{document_id}_chunk_{i}"
        metadata = {"document_id": document_id, "text": chunk_text}
        
        pinecone_vectors.append((unique_id, vector, metadata))
        
    # Pinecone Cloud mein push karo
    pinecone_index.upsert(vectors=pinecone_vectors)
    return len(chunks_list)