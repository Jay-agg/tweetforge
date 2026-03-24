from duckduckgo_search import DDGS


def search_recent_snippets(topic: str, max_results: int = 3) -> list[str]:
    """Search DuckDuckGo for recent text snippets about a topic."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(topic, max_results=max_results))
            snippets: list[str] = []
            for r in results:
                title = r.get("title", "")
                body = r.get("body", "")
                if title and body:
                    snippets.append(f"{title}: {body}")
                elif title:
                    snippets.append(title)
            while len(snippets) > max_results:
                snippets.pop()
            return snippets
    except Exception as e:
        print(f"[SEARCH] DuckDuckGo search failed: {e}")
        return []
