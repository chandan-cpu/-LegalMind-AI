import os
from langchain_groq import ChatGroq
from app.services.rag_service import embedder, pinecone_index
from app.models.schemas import RiskFinding
from dotenv import load_dotenv

load_dotenv()

# LLM Initialize karo
llm = ChatGroq(
    temperature=0, 
    model_name="llama-3.3-70b-versatile", 
    api_key=os.getenv("GROQ_API_KEY")
)

# --- THE REAL QUERY AGENT ---
def query_node(state: dict):
    print("--> Query Agent is running with Pinecone & Groq...")
    
    query = state["user_query"]
    doc_id = state["document_id"]
    
    # STEP 1: Question ko Vector banao
    query_vector = embedder.encode(query).tolist()
    
    # STEP 2: Pinecone mein Semantic Search karo
    # Notice the filter! Hum strictly usi doc mein search kar rahe hain.
    search_results = pinecone_index.query(
        vector=query_vector,
        top_k=5,
        include_metadata=True,
        filter={"document_id": doc_id} 
    )
    
    # STEP 3: Context (Mega String) banao
    context_text = ""
    for match in search_results['matches']:
        # Yaad hai? Text 'metadata' ke andar save kiya tha humne!
        context_text += match['metadata']['text'] + "\n\n---\n\n"
        
    # STEP 4: Prompt Engineering
    prompt = f"""You are an Expert Legal Assistant. 
    Answer the user's question strictly using ONLY the context provided below.
    If the answer is not in the context, say "I cannot find the answer in the provided document."
    
    [CONTEXT]
    {context_text}
    
    [USER QUESTION]
    {query}
    """
    
    # STEP 5: Call LLM
    response = llm.invoke(prompt)
    
    return {"final_answer": response.content}


# --- DUMMY AGENTS (Inko baad mein RAG se connect karenge) ---
def risk_node(state: dict):
    print("--> Risk Agent is scanning for risks (JSON Output)...")
    
    doc_id = state["document_id"]
    
    # 1. Risks dhoondhne ke liye Vector Search (High-risk keywords)
    risk_keywords = "penalty termination liability breach danger loss"
    risk_query_vector = embedder.encode(risk_keywords).tolist()
    
    search_results = pinecone_index.query(
        vector=risk_query_vector,
        top_k=3,
        include_metadata=True,
        filter={"document_id": doc_id} 
    )
    
    context_text = ""
    for match in search_results['matches']:
        context_text += match['metadata']['text'] + "\n\n---\n\n"
        
    # 2. Groq LLM ko Pydantic Schema ke sath "Structured Output" mode me daalo!
    # Yeh Langchain ka magic hai, yeh LLM ko majboor karega ki output sirf JSON me aaye.
    structured_llm = llm.with_structured_output(RiskFinding)
    
    prompt = f"""You are an Expert Legal Auditor. 
    Review the following contract excerpts and identify the most critical risk.
    You MUST return the output strictly matching the provided JSON schema format.
    If no risks are found, invent a hypothetical one based on standard legal risks for testing purposes.
    
    [CONTRACT EXCERPTS]
    {context_text}
    """
    
    # 3. Call LLM (Yeh directly humein Pydantic object dega)
    response_obj = structured_llm.invoke(prompt)
    
    # 4. Pydantic Object ko wapas JSON string mein convert karke return karo
    return {"final_answer": response_obj.model_dump_json(indent=2)}

def summary_node(state: dict):
    print("--> Summary Agent is generating a document overview...")
    
    doc_id = state["document_id"]
    
    # 1. Broad keywords to grab the most important context
    summary_keywords = "contract agreement terms purpose overview objective"
    summary_query_vector = embedder.encode(summary_keywords).tolist()
    
    # Fetching top 5 large chunks to get a good idea of the document
    search_results = pinecone_index.query(
        vector=summary_query_vector,
        top_k=5,
        include_metadata=True,
        filter={"document_id": doc_id} 
    )
    
    context_text = ""
    for match in search_results['matches']:
        context_text += match['metadata']['text'] + "\n\n---\n\n"
        
    # 2. Prompt Engineering for the Clerk
    prompt = f"""You are an Expert Legal Clerk. 
    Read the following excerpts from a legal document and provide a clear, concise 1-paragraph summary of its main purpose and key terms.
    Keep it professional but easy to understand for a non-lawyer.
    If the document is too short or dummy text, just state what it is.
    
    [DOCUMENT EXCERPTS]
    {context_text}
    """
    
    # 3. Call LLM (Normal output, JSON ki zaroorat nahi hai yahan)
    response = llm.invoke(prompt)
    
    return {"final_answer": response.content}