from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-5.6",
    temperature=0
)