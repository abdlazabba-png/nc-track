# NC-Track — Build Spec for Claude Code

Scaled-down capstone prototype of the Nigerian Content Compliance & Utilization
Tracking Platform. This spec targets a demoable prototype, not the full
NCDMB-grade production system in the proposal doc — cut scope aggressively,
keep the compliance-scoring core sharp since that is the idea's whole point.

## 1. Goal

Let an "Operator" submit Nigerian Content utilization data for a project, have
the system auto-score it against a threshold, and let a "Reviewer" see a live
dashboard of all submissions and their compliance status. Two roles only for
the prototype (Operator, Reviewer) — Zonal Officer and Admin are stretch goals.

## 2. Stack

- React + Vite + TypeScript
- Firebase: Firestore (offline persistence enabled), Firebase Auth (email/password,
  custom claim `role: "operator" | "reviewer"`), Cloud Storage (evidence uploads),
  Cloud Functions (scoring logic + notifications)
- Tailwind CSS for styling
- Recharts for the reviewer analytics view
- Deploy target: Firebase Hosting

(This mirrors the AA Tafeeda team's existing React/Vite/Firebase pattern — no
new stack to learn. If AWS is preferred instead, swap Firestore→DynamoDB,
Cloud Functions→Lambda+API Gateway, Storage→S3, Auth→Cognito; the data model
and UI below don't change.)

## 3. Data Model (Firestore collections)

```
operators/{operatorId}
  companyName: string
  rcNumber: string
  sector: "upstream" | "midstream" | "downstream"
  createdAt: timestamp

projects/{projectId}
  operatorId: string
  projectName: string
  state: string                    // Nigerian state, for dashboard filtering
  ncThresholdPercent: number        // target NC % for this project
  status: "active" | "closed"

submissions/{submissionId}
  projectId: string
  operatorId: string
  periodLabel: string               // e.g. "Q3 2026"
  nigerianPersonnelCount: number
  totalPersonnelCount: number
  nigerianSpendNaira: number
  totalSpendNaira: number
  trainingHoursLocal: number
  evidenceFileUrls: string[]        // Storage download URLs
  computedNcPercent: number         // set by Cloud Function on write
  status: "pending" | "compliant" | "flagged"
  submittedAt: timestamp
  reviewedAt: timestamp | null
  reviewerNote: string | null

alerts/{alertId}
  submissionId: string
  operatorId: string
  message: string
  createdAt: timestamp
  acknowledged: boolean
```

## 4. Scoring Logic (Cloud Function, on `submissions` create/update)

```
computedNcPercent = weighted average of:
  - personnelRatio  = nigerianPersonnelCount / totalPersonnelCount   (weight 0.4)
  - spendRatio      = nigerianSpendNaira / totalSpendNaira           (weight 0.5)
  - trainingFactor  = min(trainingHoursLocal / 100, 1)               (weight 0.1)

status:
  computedNcPercent >= project.ncThresholdPercent        -> "compliant"
  computedNcPercent >= threshold - 10 (percentage points) -> "pending" (grace zone)
  otherwise                                               -> "flagged"

if status == "flagged": write a document to `alerts/` and send a notification
(FCM or just an in-app banner for the prototype — skip email/SMS integration
unless there's time).
```

Keep the weights as named constants in one file — this is the part a real
NCDMB reviewer will want to inspect and argue with, so it should not be
buried inline.

## 5. Screens

**Operator**
1. Login (email/password)
2. Project list (their own projects only — Firestore rule: `operatorId == request.auth.uid`)
3. Submission form: period, personnel counts, spend, training hours, file
   upload for evidence (max 3 files, PDF/JPG/PNG)
4. Submission history for a project, with computed % and status badge

**Reviewer**
1. Login
2. Dashboard: table of all submissions, filterable by state, sector, status
3. Summary cards: total operators, % compliant, % flagged, average NC score
4. Submission detail view: full data + evidence files + option to add a
   reviewer note and manually override status (with a required reason —
   this creates an audit record, don't allow silent overrides)
5. Simple bar chart: average NC % by state (Recharts)

## 6. Firestore Security Rules (starting point)

```
match /submissions/{id} {
  allow create: if request.auth.token.role == "operator"
                && request.resource.data.operatorId == request.auth.uid;
  allow read: if request.auth.token.role == "reviewer"
              || resource.data.operatorId == request.auth.uid;
  allow update: if request.auth.token.role == "reviewer";
}
match /projects/{id} {
  allow read: if request.auth.token.role == "reviewer"
              || resource.data.operatorId == request.auth.uid;
  allow write: if request.auth.token.role == "reviewer";
}
```

## 7. Explicit Non-Goals for the Prototype

Cut these even if the full proposal mentions them — they add risk without
adding to the demo:

- Zonal Officer role and offline sync (mention as "Phase 2" in the demo narration
  instead of building it — offline-first is real work, don't fake it)
- NOGIC JQS vendor registry integration (no public API to hit; mock it as a
  static lookup table of 5-10 fake vendors if you want to gesture at it)
- SMS notifications — FCM/in-app only
- Multi-tenant billing / subscription logic — not relevant to a compliance tool
- PDF export of reports — a screenshot of the dashboard is enough for a demo

## 8. Suggested Build Order (for the Claude Code session)

1. Scaffold Vite + React + TS + Tailwind, Firebase project + config
2. Auth: signup/login, custom claims for role (set via a Cloud Function or
   manually in Firebase console for demo accounts)
3. Firestore rules + seed script with 3 fake operators, 5 projects, 15
   submissions across a spread of compliant/flagged states
4. Operator: project list + submission form + history
5. Cloud Function: scoring logic on submission write
6. Reviewer: dashboard table + summary cards + filters
7. Reviewer: submission detail + override flow
8. Chart: average NC % by state
9. Polish pass: navy/gold theme consistent with AAT branding, empty states,
   loading states
10. Deploy to Firebase Hosting, record a 3-5 min demo walkthrough

## 9. Demo Script Notes

For the capstone/TIC presentation, walk through: an operator submitting a
project that comes in below threshold → the flag firing automatically → the
reviewer opening the flagged submission, seeing the evidence, and either
requesting more info or confirming non-compliance. That one flow demonstrates
the entire value proposition in under two minutes.
