"""
analytics.py
Enhanced analytics API with date-range filtering, subject/grade filters,
trend data (line chart), and per-question breakdown.

Security: every query is scoped to the requesting teacher's _id so a user
can NEVER see another user's data, regardless of what parameters they send.
"""

from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timezone
from app.auth import get_current_user
from app.database import get_db

router = APIRouter()


# ── helpers ──────────────────────────────────────────────────────────────────

def _build_match(teacher_id, subject: Optional[str], grade: Optional[str],
                 date_from: Optional[str], date_to: Optional[str]) -> dict:
    """
    Build a MongoDB $match stage.
    teacher_id is ALWAYS included — it cannot be overridden by the caller.
    """
    match: dict = {"teacher_id": teacher_id}

    if subject:
        match["subject_name"] = {"$regex": subject.strip(), "$options": "i"}

    if grade:
        match["grade"] = grade.upper().strip()

    # date range — ISO 8601 strings like "2024-01-01"
    if date_from or date_to:
        dt_filter: dict = {}
        if date_from:
            try:
                dt_filter["$gte"] = datetime.fromisoformat(date_from).replace(
                    tzinfo=timezone.utc)
            except ValueError:
                pass
        if date_to:
            try:
                # Push to the very end of the day so records timestamped
                # any time on date_to (not just exactly midnight) are
                # included — otherwise $lte only matches 00:00:00.
                end_of_day = datetime.fromisoformat(date_to).replace(
                    hour=23, minute=59, second=59, microsecond=999999,
                    tzinfo=timezone.utc)
                dt_filter["$lte"] = end_of_day
            except ValueError:
                pass
        if dt_filter:
            match["evaluated_at"] = dt_filter

    return match


# ── GET /api/analytics/summary ───────────────────────────────────────────────

@router.get("/summary", summary="Aggregate summary stats with optional filters")
async def analytics_summary(
    subject:   Optional[str] = Query(None, description="Filter by subject name (partial match)"),
    grade:     Optional[str] = Query(None, description="Filter by grade (A+, A, B+, B, C, D, F)"),
    date_from: Optional[str] = Query(None, description="Start date ISO-8601, e.g. 2024-01-01"),
    date_to:   Optional[str] = Query(None, description="End date ISO-8601, e.g. 2024-12-31"),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns aggregated stats scoped strictly to the authenticated teacher.
    Supports optional filters: subject, grade, date range.
    """
    db = get_db()
    teacher_id = current_user["_id"]
    match = _build_match(teacher_id, subject, grade, date_from, date_to)

    # ── total count ──────────────────────────────────────────────────────────
    total = await db.evaluations.count_documents(match)

    # ── core aggregates ──────────────────────────────────────────────────────
    agg_pipeline = [
        {"$match": match},
        {"$group": {
            "_id": None,
            "avg_percentage": {"$avg": "$percentage"},
            "highest":        {"$max": "$percentage"},
            "lowest":         {"$min": "$percentage"},
            "total_marks_sum": {"$sum": "$total_marks"},
            "max_marks_sum":   {"$sum": "$max_marks"},
        }},
    ]
    agg = await db.evaluations.aggregate(agg_pipeline).to_list(1)
    core = agg[0] if agg else {
        "avg_percentage": 0, "highest": 0, "lowest": 0,
        "total_marks_sum": 0, "max_marks_sum": 0,
    }
    core.pop("_id", None)

    # ── grade distribution ────────────────────────────────────────────────────
    grade_pipeline = [
        {"$match": match},
        {"$group": {"_id": "$grade", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
    ]
    grades = await db.evaluations.aggregate(grade_pipeline).to_list(20)
    grade_dist = {g["_id"]: g["count"] for g in grades if g["_id"]}

    # ── subject breakdown ─────────────────────────────────────────────────────
    subject_pipeline = [
        {"$match": match},
        {"$group": {
            "_id":     "$subject_name",
            "count":   {"$sum": 1},
            "avg_pct": {"$avg": "$percentage"},
            "highest": {"$max": "$percentage"},
            "lowest":  {"$min": "$percentage"},
        }},
        {"$sort": {"count": -1}},
    ]
    subjects = await db.evaluations.aggregate(subject_pipeline).to_list(20)
    # Clean up ObjectId serialisation
    for s in subjects:
        s["subject"] = s.pop("_id", "Unknown")

    # ── pass / fail counts ────────────────────────────────────────────────────
    pass_pipeline = [
        {"$match": {**match, "percentage": {"$gte": 60}}},
        {"$count": "pass_count"},
    ]
    pass_res = await db.evaluations.aggregate(pass_pipeline).to_list(1)
    pass_count = pass_res[0]["pass_count"] if pass_res else 0
    fail_count = total - pass_count

    return {
        "total_evaluations": total,
        "pass_count":  pass_count,
        "fail_count":  fail_count,
        "pass_rate":   round((pass_count / total * 100), 1) if total > 0 else 0,
        **{k: round(v, 2) if isinstance(v, float) else v for k, v in core.items()},
        "grade_distribution": grade_dist,
        "subjects": subjects,
        # echo filters so the frontend can display them
        "filters": {
            "subject":   subject,
            "grade":     grade,
            "date_from": date_from,
            "date_to":   date_to,
        },
    }


# ── GET /api/analytics/trend ─────────────────────────────────────────────────

@router.get("/trend", summary="Daily/monthly average score trend for line chart")
async def analytics_trend(
    subject:   Optional[str] = Query(None),
    grade:     Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
    group_by:  str = Query("day", description="'day' or 'month'"),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns time-series data for line chart rendering.
    Scoped strictly to the authenticated teacher.
    """
    db = get_db()
    teacher_id = current_user["_id"]
    match = _build_match(teacher_id, subject, grade, date_from, date_to)

    if group_by == "month":
        date_format = "%Y-%m"
    else:
        date_format = "%Y-%m-%d"

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": {
                "$dateToString": {
                    "format": date_format,
                    "date":   "$evaluated_at",
                },
            },
            "avg_score":  {"$avg": "$percentage"},
            "count":      {"$sum": 1},
            "highest":    {"$max": "$percentage"},
        }},
        {"$sort": {"_id": 1}},
        {"$limit": 90},   # safety cap
    ]
    raw = await db.evaluations.aggregate(pipeline).to_list(90)

    trend = [
        {
            "date":      r["_id"],
            "avg_score": round(r["avg_score"], 1),
            "count":     r["count"],
            "highest":   round(r["highest"], 1),
        }
        for r in raw if r["_id"]
    ]
    return {"trend": trend, "group_by": group_by}


# ── GET /api/analytics/students ──────────────────────────────────────────────

@router.get("/students", summary="Per-student scores, filterable and sortable")
async def analytics_students(
    subject:   Optional[str] = Query(None),
    grade:     Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to:   Optional[str] = Query(None),
    sort_by:   str = Query("percentage", description="Field to sort by"),
    order:     str = Query("desc", description="'asc' or 'desc'"),
    limit:     int = Query(50, ge=1, le=200),
    skip:      int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """
    Returns a paginated list of student evaluation records.
    Every record belongs to the authenticated teacher — enforced at query level.
    Sensitive fields (teacher_id, internal keys) are stripped before returning.
    """
    db = get_db()
    teacher_id = current_user["_id"]
    match = _build_match(teacher_id, subject, grade, date_from, date_to)

    sort_dir = -1 if order == "desc" else 1
    allowed_sort = {"percentage", "total_marks", "evaluated_at", "student_name", "grade"}
    if sort_by not in allowed_sort:
        sort_by = "percentage"

    projection = {
        "student_name":    1,
        "student_roll_no": 1,
        "subject_name":    1,
        "total_marks":     1,
        "max_marks":       1,
        "percentage":      1,
        "grade":           1,
        "evaluated_at":    1,
        # explicitly EXCLUDE sensitive / internal fields

    }

    cursor = (
        db.evaluations
        .find(match, projection)
        .sort(sort_by, sort_dir)
        .skip(skip)
        .limit(limit)
    )

    results = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        results.append(doc)

    total = await db.evaluations.count_documents(match)

    return {
        "students": results,
        "total":    total,
        "skip":     skip,
        "limit":    limit,
    }


# ── GET /api/analytics/subjects ──────────────────────────────────────────────

@router.get("/subjects", summary="List distinct subject names for the filter dropdown")
async def analytics_subjects(
    current_user: dict = Depends(get_current_user),
):
    """Returns the list of unique subject names the authenticated teacher has evaluated."""
    db = get_db()
    teacher_id = current_user["_id"]

    subjects = await db.evaluations.distinct("subject_name", {"teacher_id": teacher_id})
    return {"subjects": sorted([s for s in subjects if s])}
