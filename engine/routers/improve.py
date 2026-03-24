from fastapi import APIRouter, HTTPException
from schemas import ImproveRequest, ImproveResponse
from services.llm import improve_tweet

router = APIRouter()


@router.post("/improve-tweet", response_model=ImproveResponse)
async def improve(req: ImproveRequest):
    """Improve an existing tweet based on user suggestions."""
    try:
        result = improve_tweet(
            original_text=req.original_text,
            topic=req.topic,
            suggestion=req.suggestion,
            context=req.context,
        )

        return ImproveResponse(
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
