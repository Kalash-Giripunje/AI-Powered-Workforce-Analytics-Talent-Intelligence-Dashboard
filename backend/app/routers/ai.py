import os
import logging
from typing import Any, Dict, List

from fastapi import APIRouter, Request

from backend.app.models.schemas import AIChatRequest, AIChatResponse, AIInsightRequest
from backend.app.config import settings
from backend.app.routers.auth import require_hr_admin
from backend.app.services.workforce_services import AIPredictionService, AttendanceService, PayrollService

logger = logging.getLogger("uvicorn.error")

router = APIRouter(tags=["AI Workforce Intelligence"])


async def _get_real_ai_summary() -> List[Dict[str, Any]]:
    predictions = await AIPredictionService.get_all()
    return predictions


@router.post("/chat", response_model=AIChatResponse)
@router.post("/ai/chat", response_model=AIChatResponse)
async def ai_chat_handler(request: Request, payload: AIChatRequest):
    """Return AI answers based on the real ai_predictions collection and live workforce data.
 
    Implements deterministic handlers for common HR queries (attrition, headcount by department,
    attendance anomalies, payroll totals and projections, and workforce expansion recommendations).
    Falls back to Gemini if configured.
    """
    await require_hr_admin(request)
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
            # Keep Gemini usage as a straightforward user-facing completion only
            prompt_text = f"You are an enterprise HR assistant. Answer concisely using available HR data if appropriate.\nUser: {message}"
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

    lower_msg = (message or "").lower()

    # Intent priority: payroll-projection, headcount-by-department, attendance-anomalies,
    # attrition, payroll total, attendance summary, recommendations, fallback.

    db = None
    try:
        from backend.app.database import get_database
        db = get_database()
    except Exception:
        db = None

    data_widget = None

    # -----------------------------
    # 1) Payroll projection intent
    # -----------------------------
    import re
    month_names = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
    }

    def format_currency(value: float) -> str:
        try:
            return f"₹{value:,.2f}"
        except Exception:
            return f"₹{value:.2f}"

    # Detect explicit year-month like 2026-08 or 2026/08 or 'August 2026'
    year_match = re.search(r"\b(20\d{2})\b", lower_msg)
    month_name_match = None
    requested_month_num = None
    requested_year = None

    for name in month_names:
        if name in lower_msg:
            month_name_match = name
            requested_month_num = month_names[name]
            break

    if year_match:
        requested_year = year_match.group(1)

    is_payroll_projection = (('project' in lower_msg or 'projected' in lower_msg or 'estimate' in lower_msg or 'project' in lower_msg) and ('payroll' in lower_msg or 'salary' in lower_msg or 'pay' in lower_msg))

    if is_payroll_projection and db is not None:
        # Aggregate historical monthly totals from payroll collection
        try:
            pipeline = [
                {"$group": {"_id": "$PayrollMonth", "total": {"$sum": {"$ifNull": ["$NetSalary", 0]}}}},
                {"$project": {"month": "$_id", "total": 1, "_id": 0}},
                {"$sort": {"month": 1}}
            ]
            cursor = db.payroll.aggregate(pipeline)
            monthly_list = await cursor.to_list(length=1000)
            # Normalize month strings (keep as-is)
            # If user requested a specific YYYY-MM (constructed from detected year+month), try to match exact
            target_month = None
            if requested_year and requested_month_num:
                target_month = f"{requested_year}-{requested_month_num}"
            elif requested_month_num and requested_year is None:
                # No year provided: try to find any month that ends with '-MM'
                # We'll look for the most recent matching month
                matches = [m for m in monthly_list if m.get('month') and str(m.get('month')).endswith(f"-{requested_month_num}")]
                if matches:
                    # pick latest by month string
                    matches_sorted = sorted(matches, key=lambda x: x.get('month') or '')
                    target_month = matches_sorted[-1].get('month')

            if target_month:
                found = next((m for m in monthly_list if m.get('month') == target_month), None)
                if found:
                    total = float(found.get('total', 0) or 0)
                    # Present as actual, not a projection
                    reply_text = f"Actual payroll for {target_month}: {format_currency(total)}."
                    data_widget = {"type": "payroll_month", "month": target_month, "total": total}
                    return AIChatResponse(reply=reply_text, text=reply_text, dataWidget=data_widget, model="live-mongodb-ai-summary")
                # else fallthrough to projection estimate

            # No exact month data available — compute an estimate using historical averages
            if not monthly_list or len(monthly_list) < 3:
                reply_text = "I don't have enough historical payroll data to produce a reliable estimate for the requested month."
                return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")

            # Use average of available monthly totals
            totals = [float(m.get('total', 0) or 0) for m in monthly_list if m.get('total') is not None]
            if not totals:
                reply_text = "I don't have enough payroll totals to compute an estimate."
                return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")

            avg = sum(totals) / len(totals)
            # Build historical sample (last 6 months or available)
            historical_sample = monthly_list[-6:] if len(monthly_list) >= 6 else monthly_list
            lines = [f"{item.get('month') or 'Unknown'} — {format_currency(float(item.get('total',0) or 0))}" for item in historical_sample]

            reply_lines = ["Projected payroll", "", f"Estimated payroll: {format_currency(avg)}", "", "Method:", f"Average of {len(totals)} historical monthly payroll totals.", "", "Historical monthly payroll used:"]
            reply_lines.extend(lines)
            reply_text = "\n".join(reply_lines)
            data_widget = {"type": "payroll_projection", "estimated": avg, "historical": historical_sample}
            return AIChatResponse(reply=reply_text, text=reply_text, dataWidget=data_widget, model="live-mongodb-ai-summary")
        except Exception as e:
            logger.exception(f"Payroll projection failed: {e}")
            reply_text = "An error occurred while computing payroll projection."
            return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")

    # -----------------------------
    # 2) Headcount by department
    # -----------------------------
    if any(kw in lower_msg for kw in ("headcount", "by department", "employee count", "distribution by department")) and db is not None:
        try:
            pipeline = [
                {"$group": {"_id": {"$ifNull": ["$Department", "Unknown"]}, "count": {"$sum": 1}}},
                {"$project": {"department": "$_id", "count": 1, "_id": 0}},
                {"$sort": {"count": -1}}
            ]
            cursor = db.employees.aggregate(pipeline)
            groups = await cursor.to_list(length=1000)
            total = sum(g.get('count', 0) for g in groups)
            if not groups:
                reply_text = "No employee records are available to summarize headcount by department."
                return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")

            lines = [f"{g.get('department')} — {g.get('count')}" for g in groups]
            largest = groups[0]
            reply_lines = ["Workforce Headcount by Department", ""] + lines + ["", f"Total Workforce: {total}", f"Largest Department: {largest.get('department')} ({largest.get('count')} employees)"]
            reply_text = "\n".join(reply_lines)
            data_widget = {"type": "headcount_by_department", "groups": groups, "total": total}
            return AIChatResponse(reply=reply_text, text=reply_text, dataWidget=data_widget, model="live-mongodb-ai-summary")
        except Exception as e:
            logger.exception(f"Headcount aggregation failed: {e}")
            reply_text = "An error occurred while summarizing headcount by department."
            return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")

    # -----------------------------
    # 3) Attendance anomalies
    # -----------------------------
    if ("anomal" in lower_msg or "anomaly" in lower_msg or "issues" in lower_msg or "attendance anomalies" in lower_msg) and db is not None:
        try:
            # Use AttendanceService.get_anomalies() for late arrivals (then filter to today)
            late_items_all = await AttendanceService.get_anomalies()

            from datetime import datetime
            today_str = datetime.now().strftime("%Y-%m-%d")

            # Filter late arrivals to today's date if the records include a date
            late_items = [it for it in (late_items_all or []) if (str(it.get('date') or it.get('Date') or '')).startswith(today_str)]

            # Missing checkouts for today
            missing_checkout_query = {
                "Date": today_str,
                "CheckIn": {"$ne": None},
                "$or": [{"CheckOut": None}, {"CheckOut": ""}, {"CheckOut": "N/A"}, {"CheckOut": "--:--"}]
            }
            missing_count = await db.attendance.count_documents(missing_checkout_query)

            # Face recognition failures (if present)
            face_fail_count = await db.attendance.count_documents({"Date": today_str, "FaceRecognition": False})
            gps_fail_count = await db.attendance.count_documents({"Date": today_str, "GPSVerified": False})

            total_records_today = await db.attendance.count_documents({"Date": today_str})
            anomalies_count = len(late_items) + missing_count + (face_fail_count or 0) + (gps_fail_count or 0)

            if anomalies_count == 0:
                reply_text = "No attendance anomalies were detected in the available records for today."
                return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")

            # Build examples (from late_items and missing checkouts)
            examples = []
            for item in (late_items[:5] if late_items else []):
                examples.append(f"• {item.get('empId', item.get('EmpID', 'unknown'))} — {item.get('anomalyReason', 'Late arrival')}")

            if missing_count:
                # List up to 5 missing checkout examples
                cursor = db.attendance.find(missing_checkout_query, {"_id": 0}).limit(5)
                missing_examples = await cursor.to_list(length=5)
                for me in missing_examples:
                    examples.append(f"• {me.get('EmpID', me.get('empId', 'unknown'))} — Missing checkout")

            other_verified = 0
            if face_fail_count:
                other_verified += face_fail_count
            if gps_fail_count:
                other_verified += gps_fail_count

            reply_lines = ["Attendance Anomalies — Today", "", f"Total attendance records: {total_records_today}", f"Anomalies detected: {anomalies_count}", "", f"Late arrivals: {len(late_items)}", f"Missing check-outs: {missing_count}"]
            if face_fail_count:
                reply_lines.append(f"Face recognition failures: {face_fail_count}")
            if gps_fail_count:
                reply_lines.append(f"GPS verification failures: {gps_fail_count}")

            reply_lines.append("")
            if examples:
                reply_lines.append("Examples:")
                reply_lines.extend(examples)

            reply_text = "\n".join(reply_lines)
            data_widget = {"type": "attendance_anomalies", "total": total_records_today, "anomalies": anomalies_count}
            return AIChatResponse(reply=reply_text, text=reply_text, dataWidget=data_widget, model="live-mongodb-ai-summary")
        except Exception as e:
            logger.exception(f"Attendance anomaly analysis failed: {e}")
            reply_text = "An error occurred while analyzing attendance anomalies."
            return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")

    # -----------------------------
    # 4) Workforce expansion recommendations
    # -----------------------------
    if any(kw in lower_msg for kw in ("expand", "expansion", "hire", "hiring", "recommend")) and db is not None:
        try:
            predictions = await AIPredictionService.get_all()
            performance = await __import__('backend.app.services.workforce_services', fromlist=['']).PerformanceService.get_all()

            # Build empId -> department mapping for predictions and performance
            emp_ids = [p.get('empId') for p in predictions if p.get('empId')]
            emp_lookup = {}
            if emp_ids:
                cursor = db.employees.find({"EmpID": {"$in": emp_ids}}, {"_id": 0, "EmpID": 1, "Department": 1})
                docs = await cursor.to_list(length=1000)
                for d in docs:
                    emp_lookup[d.get('EmpID')] = d.get('Department') or 'Unknown'

            # Aggregate per-department signals
            dept_signal = {}
            for p in predictions:
                emp = p.get('empId')
                dept = emp_lookup.get(emp, 'Unknown')
                s = dept_signal.setdefault(dept, { 'attrition_count': 0, 'skill_gap_total': 0.0, 'skill_gap_count': 0 })
                if float(p.get('attritionRisk', 0) or 0) > 0.7:
                    s['attrition_count'] += 1
                if p.get('skillGapScore') is not None:
                    try:
                        s['skill_gap_total'] += float(p.get('skillGapScore', 0) or 0)
                        s['skill_gap_count'] += 1
                    except Exception:
                        pass

            # Enrich with performance signals per department
            perf_emp_ids = [pf.get('empId') for pf in performance if pf.get('empId')]
            perf_lookup = {}
            if perf_emp_ids:
                cursor = db.employees.find({"EmpID": {"$in": perf_emp_ids}}, {"_id": 0, "EmpID": 1, "Department": 1})
                docs = await cursor.to_list(length=1000)
                for d in docs:
                    perf_lookup[d.get('EmpID')] = d.get('Department') or 'Unknown'

            dept_perf = {}
            for pf in performance:
                emp = pf.get('empId')
                dept = perf_lookup.get(emp, 'Unknown')
                entry = dept_perf.setdefault(dept, { 'perf_total': 0.0, 'perf_count': 0 })
                # Use performanceScore if present, otherwise performanceRating
                val = pf.get('performanceScore') if pf.get('performanceScore') is not None else pf.get('performanceRating')
                try:
                    entry['perf_total'] += float(val or 0)
                    entry['perf_count'] += 1
                except Exception:
                    pass

            # Build recommendations
            recommendations = []
            for dept, signals in dept_signal.items():
                rec_lines = []
                attr = signals.get('attrition_count', 0)
                skill_count = signals.get('skill_gap_count', 0)
                avg_skill_gap = (signals.get('skill_gap_total', 0) / skill_count) if skill_count else None
                perf = dept_perf.get(dept, {})
                avg_perf = (perf.get('perf_total', 0) / perf.get('perf_count')) if perf.get('perf_count') else None

                evidence_parts = []
                if attr:
                    evidence_parts.append(f"{attr} predicted high-attrition employee(s)")
                if avg_skill_gap is not None:
                    evidence_parts.append(f"average skill-gap score {avg_skill_gap:.2f} ({skill_count} sample)")
                if avg_perf is not None:
                    evidence_parts.append(f"average performance metric {avg_perf:.2f} ({perf.get('perf_count')} sample)")

                if not evidence_parts:
                    continue

                # Recommendation heuristics
                recommendation = None
                if attr and (avg_skill_gap is None or avg_skill_gap < 0.5):
                    recommendation = "Focus on retention measures and hiring cautiously; consider targeted retention incentives."
                elif avg_skill_gap and avg_skill_gap >= 0.5:
                    recommendation = "Consider targeted hiring for missing skills and immediate upskilling programs."
                elif avg_perf and avg_perf < 50:
                    recommendation = "Investigate performance improvement or role redesign before expansion."
                else:
                    recommendation = "Monitor signals and prioritize hiring where attrition and skill-gap signals coincide."

                recommendations.append({
                    'department': dept,
                    'evidence': '; '.join(evidence_parts),
                    'recommendation': recommendation
                })

            if not recommendations:
                reply_text = "The current workforce data does not provide enough evidence to recommend expansion for a specific department."
                return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")

            # Build reply
            reply_lines = ["Workforce Expansion Recommendations", ""]
            for idx, r in enumerate(recommendations, 1):
                reply_lines.append(f"{idx}. Department: {r['department']}")
                reply_lines.append(f"   Evidence: {r['evidence']}")
                reply_lines.append(f"   Recommendation: {r['recommendation']}")
                reply_lines.append("")

            reply_text = "\n".join(reply_lines)
            data_widget = {"type": "expansion_recommendations", "recommendations": recommendations}
            return AIChatResponse(reply=reply_text, text=reply_text, dataWidget=data_widget, model="live-mongodb-ai-summary")

        except Exception as e:
            logger.exception(f"Workforce recommendation generation failed: {e}")
            reply_text = "An error occurred while generating workforce recommendations."
            return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")

    # -----------------------------
    # Preserve existing attrition/attendance/payroll behavior for remaining queries
    # -----------------------------
    predictions = await _get_real_ai_summary()
    attendance_records, _ = await AttendanceService.get_all(page=1, size=10000)
    payroll_records = await PayrollService.get_all()

    if "attrition" in lower_msg or "risk" in lower_msg or "turnover" in lower_msg:
        if not predictions:
            reply_text = "No active AI prediction records are available right now."
        else:
            top = sorted(predictions, key=lambda item: float(item.get("attritionRisk", 0) or 0), reverse=True)[:3]
            summary_lines = [
                f"{idx + 1}. EmpID {item.get('empId', 'unknown')}: attrition risk {float(item.get('attritionRisk', 0) or 0):.2f}"
                for idx, item in enumerate(top)
            ]
            reply_text = "Recent attrition-risk records:\n\n" + "\n".join(summary_lines)
            data_widget = {"type": "attrition_widget", "records": len(predictions)}
        return AIChatResponse(reply=reply_text, text=reply_text, dataWidget=data_widget, model="live-mongodb-ai-summary")

    if "attendance" in lower_msg or "absent" in lower_msg or "trend" in lower_msg:
        if not attendance_records:
            reply_text = "No attendance records are available right now."
        else:
            present_count = sum(1 for record in attendance_records if str(record.get("status", "")).lower() == "present")
            total = len(attendance_records)
            rate = (present_count / total * 100) if total else 0
            reply_text = f"Attendance summary: {present_count} present out of {total} records ({rate:.1f}% present)."
            data_widget = {"type": "attendance_widget", "rate": f"{rate:.1f}%"}
        return AIChatResponse(reply=reply_text, text=reply_text, dataWidget=data_widget, model="live-mongodb-ai-summary")

    if "payroll" in lower_msg or "salary" in lower_msg or "cost" in lower_msg:
        if not payroll_records:
            reply_text = "No payroll records are available right now."
        else:
            total_payroll = sum(float(record.get("netPay", 0) or 0) for record in payroll_records)
            reply_text = f"Current payroll records total {format_currency(total_payroll)} across {len(payroll_records)} records."
            data_widget = {"type": "payroll_widget", "total": total_payroll}
        return AIChatResponse(reply=reply_text, text=reply_text, dataWidget=data_widget, model="live-mongodb-ai-summary")

    # Final polite fallback (user-facing, not revealing internal details)
    reply_text = "I can analyze workforce headcount, attendance, payroll, performance, and workforce predictions using the current HR data. Try asking about headcount by department, attendance anomalies, payroll projections, or workforce expansion."
    return AIChatResponse(reply=reply_text, text=reply_text, model="live-mongodb-ai-summary")


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
