from fastapi import APIRouter, HTTPException
from schemas import GenerateRequest, GenerateResponse
from services.search import search_recent_snippets
from services.llm import generate_tweet
from services.evaluator import load_correction_rules

router = APIRouter()


@router.post("/generate-tweet", response_model=GenerateResponse)
async def generate(req: GenerateRequest):
    """Generate a tweet using Groq, embed with OpenAI, return both."""
    try:
        # Fetch recent web snippets for trend awareness
        snippets = search_recent_snippets(req.topic)

        # Load accumulated correction rules from past evaluations
        correction_rules = load_correction_rules()

        # Generate tweet via Groq + embed via OpenAI
        result = generate_tweet(
            topic=req.topic,
            context=req.context,
            snippets=snippets,
            correction_rules=correction_rules,
        )

        return GenerateResponse(
            tweet_text=result.get("tweet_text", ""),
            media_instructions={
                "required": result.get("media_instructions", {}).get("required", False),
                "description": result.get("media_instructions", {}).get("description", ""),
                "search_terms": result.get("media_instructions", {}).get("search_terms", []),
            },
            embedding=result.get("embedding"),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
