---
name: language-selection-ocr-update
description: Added language selection for OCR functionality - uses NVIDIA Nemotron OCR v2 when language selected, default model otherwise
metadata:
  type: project
---

## Summary of Changes

Implemented language selection for OCR functionality where:
- When a language is specified → uses "NVIDIA Nemotron OCR v2" model
- When no language is specified → uses default model (meta/llama-3.2-11b-vision-instruct)

## Files Modified

### Backend Changes
1. **backend/app/evaluation_engine.py**:
   - Added `language: Optional[str] = None` parameter to `PDFProcessor.__init__`
   - Made `NVIDIA_MODEL` dynamic based on language selection
   - Updated `MultiSubjectEvaluator.__init__` to pass language to `PDFProcessor`
   - Added necessary import for `Optional` typing

2. **backend/app/routes/ocr.py**:
   - Added `language: Optional[str] = Form(None)` parameter to both `/extract-text` and `/extract-text-batch` endpoints
   - Passed language parameter to `PDFProcessor` initialization

3. **backend/app/routes/evaluation.py**:
   - Added `language: Optional[str] = Form(None)` parameter to `/evaluate-subject` and `/evaluate-batch` endpoints
   - Updated `_get_evaluator()` helper to accept and pass language parameter
   - Updated calls to `_get_evaluator()` to include language parameter

### Frontend Changes
1. **src/services/api.js**:
   - Added `language = null` parameter to `evaluateSubject` and `evaluateBatch` functions
   - Added language to FormData when specified

2. **src/components/EvaluationPanel.jsx**:
   - Added `language` state variable
   - Added OCR language input text field in options section
   - Updated `handleEvaluate` to pass language parameter to API calls
   - Updated batch evaluation to pass language parameter

## Functionality
- Users can now specify a language (e.g., "hindi", "marathi", "tamil") in the OCR Language input field
- When language is specified, the system uses "NVIDIA Nemotron OCR v2" model
- When language is left blank, the system uses the default "meta/llama-3.2-11b-vision-instruct" model
- This works for both single subject and batch evaluation modes
- The language selection is independent of exam mode (unit_test/end_sem)

## Related Files
- backend/app/evaluation_engine.py
- backend/app/routes/ocr.py
- backend/app/routes/evaluation.py
- src/services/api.js
- src/components/EvaluationPanel.jsx