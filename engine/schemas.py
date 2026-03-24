from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    topic: str
    context: str


class MediaInstructions(BaseModel):
    required: bool = False
    description: str = ""
    search_terms: list[str] = Field(default_factory=list)


class GenerateResponse(BaseModel):
    tweet_text: str
    media_instructions: MediaInstructions
    embedding: list[float] | None = None


class ImproveRequest(BaseModel):
    original_text: str
    topic: str
    suggestion: str
    context: str


class ImproveResponse(BaseModel):
    tweet_text: str
    media_instructions: MediaInstructions
    embedding: list[float] | None = None


class EvaluateRequest(BaseModel):
    tweet_text: str
    metrics: dict
    engagement_score: float
    context: str = ""


class CorrectionRule(BaseModel):
    issue: str
    correction: str
    severity: str = "medium"


class EvaluateResponse(BaseModel):
    analysis: str
    score_assessment: str
    correction_rules: list[CorrectionRule] = Field(default_factory=list)
