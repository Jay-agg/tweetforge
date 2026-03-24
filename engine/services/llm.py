import json
import os
from groq import Groq
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def generate_tweet(
    topic: str,
    context: str,
    snippets: list[str],
    correction_rules: list[dict],
) -> dict:
    """Generate a tweet using Groq, then embed the text via OpenAI."""

    snippets_block = ""
    if snippets:
        formatted = "\n".join(f"  - {s}" for s in snippets)
        snippets_block = f"""

BACKGROUND CONTEXT (recent web snippets about '{topic}'):
{formatted}

Use these snippets ONLY as factual background to make your tweet timely and relevant.
Do NOT copy their tone or phrasing. Your tone must come EXCLUSIVELY from the persona rules above."""

    corrections_block = ""
    if correction_rules:
        rules = "\n".join(
            f"  - AVOID: {r.get('issue', '')} → INSTEAD: {r.get('correction', '')}"
            for r in correction_rules
        )
        corrections_block = f"\n\nPAST MISTAKES TO AVOID (learned from engagement data):\n{rules}"

    messages = [
        {
            "role": "system",
            "content": f"""You are a tweet generation engine. Follow these instructions EXACTLY:

{context}

{corrections_block}

Return ONLY a valid JSON object. No markdown, no explanation, no code fences.""",
        },
        {
            "role": "user",
            "content": f"""Generate a single tweet about: {topic}
{snippets_block}

Return strict JSON:
{{
  "tweet_text": "the tweet",
  "media_instructions": {{
    "required": boolean,
    "description": "what visual is needed (or empty string)",
    "search_terms": ["term1", "term2"]
  }}
}}""",
        },
    ]

    # Step 1: Generate tweet text using Groq (Llama 3)
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.8,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    result = json.loads(content)

    # Step 2: Generate embedding via OpenAI
    tweet_text = result.get("tweet_text", "")
    embedding = generate_embedding(tweet_text) if tweet_text else None

    result["embedding"] = embedding
    return result


def generate_embedding(text: str) -> list[float]:
    """Generate a 1536-dimensional embedding using OpenAI text-embedding-3-small."""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return response.data[0].embedding


def improve_tweet(
    original_text: str,
    topic: str,
    suggestion: str,
    context: str,
) -> dict:
    """Improve an existing tweet based on user feedback."""

    messages = [
        {
            "role": "system",
            "content": f"""You are a tweet improvement engine. You take an existing tweet and improve it based on specific user feedback.

Follow these persona and tone rules EXACTLY:

{context}

Return ONLY a valid JSON object. No markdown, no explanation, no code fences.""",
        },
        {
            "role": "user",
            "content": f"""Improve this tweet about "{topic}":

ORIGINAL TWEET:
"{original_text}"

USER FEEDBACK:
{suggestion}

Apply the feedback while keeping the tweet authentic and following the persona rules above.

Return strict JSON:
{{
  "tweet_text": "the improved tweet",
  "media_instructions": {{
    "required": boolean,
    "description": "what visual is needed (or empty string)",
    "search_terms": ["term1", "term2"]
  }}
}}""",
        },
    ]

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.7,
        max_tokens=500,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    result = json.loads(content)

    # Generate new embedding for the improved text
    tweet_text = result.get("tweet_text", "")
    embedding = generate_embedding(tweet_text) if tweet_text else None
    result["embedding"] = embedding

    return result

