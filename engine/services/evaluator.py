import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def evaluate_tweet(
    tweet_text: str,
    metrics: dict,
    engagement_score: float,
    context: str = "",
) -> dict:
    """Use Groq LLM as a judge to critique a tweet based on engagement data."""

    messages = [
        {
            "role": "system",
            "content": """You are a Twitter engagement analyst. You analyze tweets and their performance metrics to identify specific, actionable reasons why a tweet performed well or poorly.

You must return ONLY a valid JSON object with this structure:
{
  "analysis": "2-3 sentence analysis of the tweet's performance",
  "score_assessment": "high" | "medium" | "low",
  "correction_rules": [
    {
      "issue": "specific problem identified",
      "correction": "specific actionable fix",
      "severity": "high" | "medium" | "low"
    }
  ]
}

Focus on:
- Hook strength (does the first line grab attention?)
- Specificity vs. generic statements
- Conversational tone vs. overly polished AI-sounding language
- Length and punchiness
- Technical accuracy and relevance
- Adherence to the persona tone rules below

Return valid JSON only."""
            + (f"\n\nPERSONA & TONE RULES (the tweet MUST follow these):\n{context}" if context else ""),
        },
        {
            "role": "user",
            "content": f"""Evaluate this tweet's performance:

Tweet: "{tweet_text}"

Metrics:
- Impressions: {metrics.get('impressions', 0)}
- Likes: {metrics.get('likes', 0)}
- Retweets: {metrics.get('retweets', 0)}
- Replies: {metrics.get('replies', 0)}

Engagement Score: {engagement_score:.2f}

Provide your analysis and correction rules.""",
        },
    ]

    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        temperature=0.4,
        max_tokens=800,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content or "{}"
    return json.loads(content)


def load_correction_rules(filepath: str = "correction_rules.json") -> list[dict]:
    """Load accumulated correction rules from file."""
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []


def save_correction_rules(
    new_rules: list[dict],  # type: ignore[type-arg]
    filepath: str = "correction_rules.json",
    max_rules: int = 20,
) -> None:
    """Append new correction rules, keeping only the most recent max_rules."""
    existing: list[dict] = load_correction_rules(filepath)  # type: ignore[type-arg]
    existing.extend(new_rules)
    # Keep only the latest rules to avoid prompt bloat
    while len(existing) > max_rules:
        existing.pop(0)
    with open(filepath, "w") as f:
        json.dump(existing, f, indent=2)
