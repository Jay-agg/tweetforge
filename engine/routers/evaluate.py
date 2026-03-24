from fastapi import APIRouter, HTTPException
from schemas import EvaluateRequest, EvaluateResponse
from services.evaluator import evaluate_tweet, save_correction_rules

router = APIRouter()


@router.post("/evaluate-performance", response_model=EvaluateResponse)
async def evaluate(req: EvaluateRequest):
    """Evaluate a posted tweet's performance and generate correction rules."""
    try:
        result = evaluate_tweet(
            tweet_text=req.tweet_text,
            metrics=req.metrics,
            engagement_score=req.engagement_score,
            context=req.context,
        )

        # Extract and persist correction rules
        correction_rules = result.get("correction_rules", [])
        if correction_rules:
            save_correction_rules(correction_rules)

        return EvaluateResponse(
            analysis=result.get("analysis", ""),
            score_assessment=result.get("score_assessment", "medium"),
            correction_rules=[
                {
                    "issue": r.get("issue", ""),
                    "correction": r.get("correction", ""),
                    "severity": r.get("severity", "medium"),
                }
                for r in correction_rules
            ],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
