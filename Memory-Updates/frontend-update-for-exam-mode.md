---
name: frontend-update-for-exam-mode
description: Added exam mode selection and roster file upload to frontend
metadata:
  type: project
---

Updated EvaluationPanel.jsx to include:
- Exam mode radio buttons (unit_test/end_sem) with state
- Conditional file input for roster Excel (shown when end_sem selected)
- Modified handleEvaluate to pass exam_mode and roster_file to API calls

Updated src/services/api.js:
- evaluateSubject now accepts examMode and rosterFile parameters, appends to FormData
- evaluateBatch now accepts examMode and rosterFile parameters, appends to FormData

These changes enable users to:
- Select exam mode (default unit_test)
- Upload roster Excel when end_sem mode is selected
- Process answer sheets with seat number lookup from roster
- Receive enhanced emails with detailed feedback and improvement tips

Related files: src/components/EvaluationPanel.jsx, src/services/api.js