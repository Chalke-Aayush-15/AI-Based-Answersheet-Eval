"""
chatbot.py
AI chatbot endpoint — reuses the existing NVIDIA NIM API key already
configured in app/config.py (settings.NVIDIA_API_KEY).

Uses the text-only chat completions endpoint with the same NVIDIA NIM
base URL already used for OCR, but with the llama-3.3-70b-instruct model
for higher quality conversational responses.

Security:
  - Requires JWT authentication (get_current_user dependency).
  - The system prompt is generated server-side — the user cannot inject
    a system prompt, change the model, or supply API credentials.
  - Analytics context is only injected when the client provides it, and
    only from data the same user already fetched (they own the data).
  - No user data from OTHER teachers is ever injected or accessible.
"""

import json
import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from app.auth import get_current_user
from app.config import settings

router = APIRouter()

# ── NVIDIA NIM config ─────────────────────────────────────────────────────────
NVIDIA_URL   = "https://integrate.api.nvidia.com/v1/chat/completions"
# Use the text-only instruct model (no vision needed for chat)
NVIDIA_MODEL = "meta/llama-3.3-70b-instruct"
# Fallback to the same vision model already used by OCR if the above is unavailable
NVIDIA_MODEL_FALLBACK = "meta/llama-3.2-11b-vision-instruct"

MAX_HISTORY_TURNS = 8   # keep last 8 user+assistant pairs to stay within context

# ── Pydantic models ───────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000,
                         description="The user's latest message")
    history: List[ChatMessage] = Field(
        default_factory=list,
        max_length=MAX_HISTORY_TURNS * 2,
        description="Previous conversation turns (user + assistant alternating)"
    )
    # Optional analytics context — only included when the user is on the
    # Analytics tab. The client sends a snapshot of what it currently shows.
    analytics_context: Optional[Dict[str, Any]] = Field(
        None,
        description="Snapshot of currently displayed analytics data (optional)"
    )
    current_tab: Optional[str] = Field(
        None,
        description="Which dashboard tab the user is currently viewing"
    )


class ChatResponse(BaseModel):
    reply: str
    model_used: str


# ── System prompt builder ─────────────────────────────────────────────────────

def _build_system_prompt(user_name: str, current_tab: Optional[str],
                         analytics_context: Optional[Dict]) -> str:
    base = f"""You are EvalAI Assistant, a helpful AI integrated inside EvalAI — an AI-powered exam answer sheet evaluation platform used by teachers and educators.

You are talking with {user_name}, a teacher using the platform.

## What EvalAI Does
- Teachers upload exam answer PDFs (master answer key + student answer sheets)
- The FAIR evaluation engine scores each student's answers using:
  * Semantic similarity (60%) via sentence-transformers
  * Keyword coverage (25%) based on subject-specific terms
  * Answer structure (10%)
  * Answer length ratio (5%)
- Main questions are worth 10 marks each; sub-questions (e.g. Q1a) are worth 5 marks
- Grades: A+ (≥90%), A (≥80%), B+ (≥70%), B (≥60%), C (≥50%), D (≥40%), F (<40%)
- Results are saved to MongoDB and can be exported as Excel files
- Optional: email results to students via Gmail SMTP

## Dashboard Tabs
- **Subjects**: Add/manage subjects, upload master + student PDFs
- **Evaluation**: Run the FAIR scoring engine, view live logs, download results
- **PDF Tools**: Standalone OCR — extract text from scanned/handwritten PDFs using NVIDIA NIM
- **Analytics**: View charts and statistics from past evaluations
- **Settings**: Configure email, API keys, evaluation options

## Subscription Plans
- Free Trial: 5 days, all tabs
- Silver (₹299/mo): Subjects + Evaluation only
- Gold (₹699/mo): All tabs, unlimited students

## Your Behaviour
- Be concise, friendly, and helpful — like a knowledgeable colleague
- If a question relates to the current tab, give context-specific guidance
- For analytics questions, explain the data clearly and provide insights
- Do NOT make up data — only reference what is explicitly provided in analytics context
- Do NOT expose or discuss other users' data
- Do NOT discuss topics unrelated to the platform or education
- Answer in the same language the user writes in
- Keep responses under 300 words unless the user needs a detailed explanation"""

    # Inject tab-specific guidance
    if current_tab == "analytics":
        base += "\n\n## Current Context\nThe user is currently viewing the **Analytics tab**."
        if analytics_context:
            base += "\n\n## Currently Displayed Analytics Data\n"
            try:
                # Summary stats
                total = analytics_context.get("total_evaluations", 0)
                avg   = analytics_context.get("avg_percentage", 0)
                high  = analytics_context.get("highest", 0)
                low   = analytics_context.get("lowest", 0)
                pr    = analytics_context.get("pass_rate", 0)
                base += f"- Total evaluations: {total}\n"
                base += f"- Average score: {round(avg, 1) if avg else 0}%\n"
                base += f"- Highest score: {round(high, 1) if high else 0}%\n"
                base += f"- Lowest score: {round(low, 1) if low else 0}%\n"
                base += f"- Pass rate: {pr}%\n"

                # Grade distribution
                gd = analytics_context.get("grade_distribution", {})
                if gd:
                    base += f"- Grade distribution: {json.dumps(gd)}\n"

                # Subject breakdown
                subjects = analytics_context.get("subjects", [])
                if subjects:
                    base += "- Subject averages:\n"
                    for s in subjects[:6]:
                        name = s.get("subject") or s.get("_id", "Unknown")
                        avg_s = round(s.get("avg_pct", 0), 1)
                        cnt   = s.get("count", 0)
                        base += f"  * {name}: avg {avg_s}%, {cnt} student(s)\n"

                # Active filters
                filters = analytics_context.get("filters", {})
                active = {k: v for k, v in filters.items() if v}
                if active:
                    base += f"- Active filters: {json.dumps(active)}\n"

                # Trend data (last few points)
                trend = analytics_context.get("trend", [])
                if trend:
                    base += f"- Score trend (last {min(5, len(trend))} periods): "
                    base += ", ".join(
                        f"{t['date']}: {t['avg_score']}%" for t in trend[-5:]
                    ) + "\n"

            except Exception:
                pass  # silently skip malformed context — never crash

            base += "\nUse this data to answer questions about the analytics the user sees. "
            base += "If the user asks about something not in this data, say so honestly."

    elif current_tab == "evaluation":
        base += "\n\n## Current Context\nThe user is currently on the **Evaluation** tab. " \
                "Help them with running evaluations, understanding results, " \
                "uploading PDFs, and interpreting scores."

    elif current_tab == "subjects":
        base += "\n\n## Current Context\nThe user is on the **Subjects** tab. " \
                "Help them with adding subjects, uploading master and student PDFs."

    elif current_tab == "pdf":
        base += "\n\n## Current Context\nThe user is on the **PDF Tools** tab. " \
                "Help with OCR extraction, understanding text results, and batch processing."

    elif current_tab == "settings":
        base += "\n\n## Current Context\nThe user is on the **Settings** tab. " \
                "Help with configuring email (Gmail SMTP), API keys, and evaluation options."

    return base


# ── POST /api/chatbot/chat ────────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse,
             summary="Send a message to the EvalAI AI assistant")
async def chat(
    req: ChatRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Stateless chat endpoint — the client sends the conversation history.
    Requires a valid JWT — unauthenticated users cannot call this endpoint.
    The system prompt is built server-side using the authenticated user's
    name; the user cannot modify the system prompt.
    """
    if not settings.NVIDIA_API_KEY or settings.NVIDIA_API_KEY.startswith("your"):
        raise HTTPException(
            status_code=503,
            detail="NVIDIA API key not configured. Add NVIDIA_API_KEY to backend/.env"
        )

    user_name = current_user.get("name", "Teacher")

    system_prompt = _build_system_prompt(
        user_name=user_name,
        current_tab=req.current_tab,
        analytics_context=req.analytics_context,
    )

    # Build message list for the API
    messages = [{"role": "system", "content": system_prompt}]

    # Append trimmed history
    history = req.history[-(MAX_HISTORY_TURNS * 2):]
    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    # Append the new user message
    messages.append({"role": "user", "content": req.message})

    headers = {
        "Authorization": f"Bearer {settings.NVIDIA_API_KEY}",
        "Content-Type":  "application/json",
        "Accept":        "application/json",
    }

    payload = {
        "model":       NVIDIA_MODEL,
        "messages":    messages,
        "max_tokens":  600,
        "temperature": 0.6,
        "top_p":       0.9,
        "stream":      False,
    }

    # Try primary model, fall back to vision model if unavailable
    for model in [NVIDIA_MODEL, NVIDIA_MODEL_FALLBACK]:
        payload["model"] = model
        try:
            resp = requests.post(NVIDIA_URL, headers=headers, json=payload, timeout=30)

            if resp.status_code == 404:
                # Model not available — try fallback
                continue

            if resp.status_code == 429:
                raise HTTPException(
                    status_code=429,
                    detail="AI service rate limit reached. Please wait a moment and try again."
                )

            if resp.status_code == 401:
                raise HTTPException(
                    status_code=503,
                    detail="Invalid NVIDIA API key. Check your backend/.env configuration."
                )

            resp.raise_for_status()
            data = resp.json()
            reply = data["choices"][0]["message"]["content"].strip()
            return ChatResponse(reply=reply, model_used=model)

        except HTTPException:
            raise
        except requests.exceptions.Timeout:
            raise HTTPException(
                status_code=504,
                detail="AI service timed out. Please try again."
            )
        except Exception as e:
            # If it's the last model, raise
            if model == NVIDIA_MODEL_FALLBACK:
                raise HTTPException(
                    status_code=502,
                    detail=f"AI service error: {str(e)}"
                )
            continue

    raise HTTPException(status_code=503, detail="AI service unavailable")
