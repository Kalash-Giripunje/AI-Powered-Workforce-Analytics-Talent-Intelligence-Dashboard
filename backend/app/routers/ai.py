import os
import logging
from typing import Any, Dict, List

from fastapi import APIRouter

from backend.app.models.schemas import AIChatRequest, AIChatResponse, AIInsightRequest
from backend.app.config import settings
from backend.app.services.workforce_services import AIPredictionService, AttendanceService, PayrollService

logger = logging.getLogger("uvicorn.error")

router = APIRouter(tags=["AI Workforce Intelligence"])


async def _get_real_ai_summary() -> List[Dict[str, Any]]:
    predictions = await AIPredictionService.get_all()
    return predictions


@router.post("/chat", response_model=AIChatResponse)
@router.post("/ai/chat", response_model=AIChatResponse)
async def ai_chat_handler(payload: AIChatRequest):
    """Return AI answers based on the real ai_predictions collection and live workforce data."""
    message = payload.message or payload.prompt or ""
    role = payload.role or "HR Administrator"

    if not message:
        return AIChatResponse(
            reply="Please enter a workforce management query or instruction.",
            text="Please enter a workforce management query or instruction."
        )

    gemini_key = settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            prompt_text = f"You are an AI assistant for a workforce backend. Use only the live MongoDB workforce sources. Answer concisely.\nUser: {message}"
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt_text
            )
            if response and getattr(response, "text", None):
                return AIChatResponse(
                    reply=response.text,
                    text=response.text,
                    model="gemini-2.5-flash"
                )
        except Exception as e:
            logger.warning(f"Google GenAI SDK call failed: {e}. Falling back to live database summary.")

    lower_msg = message.lower()
    predictions = await _get_real_ai_summary()
    attendance_records, _ = await AttendanceService.get_all(page=1, size=10000)
    payroll_records = await PayrollService.get_all()

    data_widget = None

    if "attrition" in lower_msg or "risk" in lower_msg or "turnover" in lower_msg:
        if not predictions:
            reply_text = "No active ai_predictions records are available in the MongoDB dataset right now."
        else:
            top = sorted(predictions, key=lambda item: float(item.get("attritionRisk", 0) or 0), reverse=True)[:3]
            summary_lines = [
                f"{idx + 1}. EmpID {item.get('empId', 'unknown')}: attrition risk {float(item.get('attritionRisk', 0) or 0):.2f}"
                for idx, item in enumerate(top)
            ]
            reply_text = "Recent attrition-risk records from ai_predictions:\n\n" + "\n".join(summary_lines)
            data_widget = {
                "type": "attrition_widget",
                "records": len(predictions),
                "highRiskCount": sum(1 for p in predictions if float(p.get("attritionRisk", 0) or 0) > 0.7),
            }
    elif "attendance" in lower_msg or "absent" in lower_msg or "trend" in lower_msg:
        if not attendance_records:
            reply_text = "No attendance records are available in the MongoDB attendance collection right now."
        else:
            present_count = sum(1 for record in attendance_records if str(record.get("status", "")).lower() == "present")
            total = len(attendance_records)
            rate = (present_count / total * 100) if total else 0
            reply_text = f"Attendance data from MongoDB: {present_count} present out of {total} records ({rate:.1f}% present)."
            data_widget = {"type": "attendance_widget", "rate": f"{rate:.1f}%"}
    elif "payroll" in lower_msg or "salary" in lower_msg or "cost" in lower_msg:
        if not payroll_records:
            reply_text = "No payroll records are available in the MongoDB payroll collection right now."
        else:
            total_payroll = sum(float(record.get("netPay", 0) or 0) for record in payroll_records)
            reply_text = f"MongoDB payroll total for the currently loaded records: {total_payroll:.2f}."
            data_widget = {"type": "payroll_widget", "total": total_payroll}
    else:
        reply_text = (
            f"This backend is using the live MongoDB workforce data for {role}. "
            "Use real collection data from employees, attendance, payroll, performance, and ai_predictions."
        )

    return AIChatResponse(
        reply=reply_text,
        text=reply_text,
        dataWidget=data_widget,
        model="live-mongodb-ai-summary"
    )


@router.post("/ai-insights")
async def ai_insights_handler(payload: AIInsightRequest):
    """Generate structured AI insight summaries from the live ai_predictions collection."""
    predictions = await _get_real_ai_summary()
    if not predictions:
        return {
            "insight": "No AI prediction records are currently available in the ai_predictions collection.",
            "simulated": False
        }

    highest = max(predictions, key=lambda item: float(item.get("attritionRisk", 0) or 0))
    return {
        "insight": (
            f"AI prediction snapshot for {len(predictions)} record(s): highest attrition risk is "
            f"{float(highest.get('attritionRisk', 0) or 0):.2f} for EmpID {highest.get('empId', 'unknown')}."
        ),
        "simulated": False
    }
