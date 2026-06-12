import asyncio
import os
import time

from fastapi import FastAPI
from pydantic import BaseModel
from duckduckgo_search import DDGS
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title='Search Service')

_last_search: float = 0.0
MIN_INTERVAL = float(os.getenv('SEARCH_DELAY', '1.5'))


class SearchRequest(BaseModel):
    query: str
    max_results: int = 8


class SearchResult(BaseModel):
    title: str
    href: str
    body: str


@app.post('/search', response_model=list[SearchResult])
async def search(req: SearchRequest):
    global _last_search

    elapsed = time.time() - _last_search
    if elapsed < MIN_INTERVAL:
        await asyncio.sleep(MIN_INTERVAL - elapsed)
    _last_search = time.time()

    headers = {}
    cookie = os.getenv('SEARCH_COOKIE')
    if cookie:
        headers['cookie'] = cookie

    ddgs = DDGS(headers=headers or None)
    results = ddgs.text(req.query, max_results=req.max_results)
    return [SearchResult(**r) for r in results]
