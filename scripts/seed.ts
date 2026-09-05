// Seeds demo Firebase Auth accounts (with role custom claims) and Firestore
// data for the NC-Track prototype. Safe to re-run — everything uses
// deterministic ids and upserts.
//
// Usage: npx tsx scripts/seed.ts
// Requires serviceAccountKey.json in the project root (gitignored).

import { readFileSync } from 'node:fs'
import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { computeNcPercent, computeStatus } from '../src/lib/scoring'
import type { Sector, ProjectStatus } from '../src/types'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf-8'))

initializeApp({ credential: cert(serviceAccount) })

const auth = getAuth()
const db = getFirestore()

const DEMO_PASSWORD = 'NcTrack2026!'

interface DemoOperatorSeed {
  uid: string
  email: string
  companyName: string
  rcNumber: string
  sector: Sector
}

const REVIEWER = { uid: 'demo-reviewer', email: 'reviewer@nctrack.demo' }

const OPERATORS: DemoOperatorSeed[] = [
  {
    uid: 'demo-operator-deepwater',
    email: 'operator.deepwater@nctrack.demo',
    companyName: 'Deepwater Energy Ltd',
    rcNumber: 'RC-118820',
    sector: 'upstream',
  },
  {
    uid: 'demo-operator-nigerdelta',
    email: 'operator.nigerdelta@nctrack.demo',
    companyName: 'Niger Delta Logistics',
    rcNumber: 'RC-224417',
    sector: 'midstream',
  },
  {
    uid: 'demo-operator-coastal',
    email: 'operator.coastal@nctrack.demo',
    companyName: 'Coastal Refining Co',
    rcNumber: 'RC-330951',
    sector: 'downstream',
  },
]

interface ProjectSeed {
  id: string
  operatorId: string
  projectName: string
  state: string
  ncThresholdPercent: number
  status: ProjectStatus
}

const PROJECTS: ProjectSeed[] = [
  {
    id: 'project-agbami-fpso',
    operatorId: 'demo-operator-deepwater',
    projectName: 'Agbami FPSO Life Extension',
    state: 'Rivers',
    ncThresholdPercent: 60,
    status: 'active',
  },
  {
    id: 'project-bonga-southwest',
    operatorId: 'demo-operator-deepwater',
    projectName: 'Bonga Southwest Tie-back',
    state: 'Bayelsa',
    ncThresholdPercent: 55,
    status: 'active',
  },
  {
    id: 'project-warri-pipeline',
    operatorId: 'demo-operator-nigerdelta',
    projectName: 'Warri-Kaduna Pipeline Upgrade',
    state: 'Delta',
    ncThresholdPercent: 50,
    status: 'active',
  },
  {
    id: 'project-qit-terminal',
    operatorId: 'demo-operator-nigerdelta',
    projectName: 'Qua Iboe Terminal Expansion',
    state: 'Akwa Ibom',
    ncThresholdPercent: 65,
    status: 'active',
  },
  {
    id: 'project-lagos-depot',
    operatorId: 'demo-operator-coastal',
    projectName: 'Lagos Retail Depot Modernization',
    state: 'Lagos',
    ncThresholdPercent: 70,
    status: 'active',
  },
]

interface SubmissionSeedInput {
  id: string
  projectId: string
  operatorId: string
  periodLabel: string
  nigerianPersonnelCount: number
  totalPersonnelCount: number
  nigerianSpendNaira: number
  totalSpendNaira: number
  trainingHoursLocal: number
  daysAgo: number
}

const SUBMISSION_INPUTS: SubmissionSeedInput[] = [
  { id: 'sub-01', projectId: 'project-agbami-fpso', operatorId: 'demo-operator-deepwater', periodLabel: 'Q1 2026', nigerianPersonnelCount: 180, totalPersonnelCount: 220, nigerianSpendNaira: 4_200_000_000, totalSpendNaira: 6_000_000_000, trainingHoursLocal: 90, daysAgo: 150 },
  { id: 'sub-02', projectId: 'project-agbami-fpso', operatorId: 'demo-operator-deepwater', periodLabel: 'Q2 2026', nigerianPersonnelCount: 150, totalPersonnelCount: 220, nigerianSpendNaira: 3_000_000_000, totalSpendNaira: 6_000_000_000, trainingHoursLocal: 60, daysAgo: 60 },
  { id: 'sub-03', projectId: 'project-agbami-fpso', operatorId: 'demo-operator-deepwater', periodLabel: 'Q3 2026', nigerianPersonnelCount: 90, totalPersonnelCount: 220, nigerianSpendNaira: 1_800_000_000, totalSpendNaira: 6_000_000_000, trainingHoursLocal: 20, daysAgo: 5 },
  { id: 'sub-04', projectId: 'project-bonga-southwest', operatorId: 'demo-operator-deepwater', periodLabel: 'Q1 2026', nigerianPersonnelCount: 140, totalPersonnelCount: 200, nigerianSpendNaira: 2_800_000_000, totalSpendNaira: 4_500_000_000, trainingHoursLocal: 75, daysAgo: 140 },
  { id: 'sub-05', projectId: 'project-bonga-southwest', operatorId: 'demo-operator-deepwater', periodLabel: 'Q2 2026', nigerianPersonnelCount: 110, totalPersonnelCount: 200, nigerianSpendNaira: 2_200_000_000, totalSpendNaira: 4_500_000_000, trainingHoursLocal: 50, daysAgo: 45 },
  { id: 'sub-06', projectId: 'project-bonga-southwest', operatorId: 'demo-operator-deepwater', periodLabel: 'Q3 2026', nigerianPersonnelCount: 128, totalPersonnelCount: 200, nigerianSpendNaira: 2_600_000_000, totalSpendNaira: 4_500_000_000, trainingHoursLocal: 65, daysAgo: 3 },
  { id: 'sub-07', projectId: 'project-warri-pipeline', operatorId: 'demo-operator-nigerdelta', periodLabel: 'Q1 2026', nigerianPersonnelCount: 95, totalPersonnelCount: 120, nigerianSpendNaira: 1_100_000_000, totalSpendNaira: 1_600_000_000, trainingHoursLocal: 100, daysAgo: 130 },
  { id: 'sub-08', projectId: 'project-warri-pipeline', operatorId: 'demo-operator-nigerdelta', periodLabel: 'Q2 2026', nigerianPersonnelCount: 80, totalPersonnelCount: 120, nigerianSpendNaira: 900_000_000, totalSpendNaira: 1_600_000_000, trainingHoursLocal: 80, daysAgo: 40 },
  { id: 'sub-09', projectId: 'project-warri-pipeline', operatorId: 'demo-operator-nigerdelta', periodLabel: 'Q3 2026', nigerianPersonnelCount: 100, totalPersonnelCount: 120, nigerianSpendNaira: 1_250_000_000, totalSpendNaira: 1_600_000_000, trainingHoursLocal: 100, daysAgo: 2 },
  { id: 'sub-10', projectId: 'project-qit-terminal', operatorId: 'demo-operator-nigerdelta', periodLabel: 'Q1 2026', nigerianPersonnelCount: 70, totalPersonnelCount: 150, nigerianSpendNaira: 1_400_000_000, totalSpendNaira: 3_200_000_000, trainingHoursLocal: 30, daysAgo: 120 },
  { id: 'sub-11', projectId: 'project-qit-terminal', operatorId: 'demo-operator-nigerdelta', periodLabel: 'Q2 2026', nigerianPersonnelCount: 60, totalPersonnelCount: 150, nigerianSpendNaira: 1_100_000_000, totalSpendNaira: 3_200_000_000, trainingHoursLocal: 15, daysAgo: 35 },
  { id: 'sub-12', projectId: 'project-lagos-depot', operatorId: 'demo-operator-coastal', periodLabel: 'Q1 2026', nigerianPersonnelCount: 200, totalPersonnelCount: 230, nigerianSpendNaira: 3_600_000_000, totalSpendNaira: 4_000_000_000, trainingHoursLocal: 100, daysAgo: 110 },
  { id: 'sub-13', projectId: 'project-lagos-depot', operatorId: 'demo-operator-coastal', periodLabel: 'Q2 2026', nigerianPersonnelCount: 190, totalPersonnelCount: 230, nigerianSpendNaira: 3_400_000_000, totalSpendNaira: 4_000_000_000, trainingHoursLocal: 95, daysAgo: 30 },
  { id: 'sub-14', projectId: 'project-lagos-depot', operatorId: 'demo-operator-coastal', periodLabel: 'Q3 2026', nigerianPersonnelCount: 175, totalPersonnelCount: 230, nigerianSpendNaira: 3_100_000_000, totalSpendNaira: 4_000_000_000, trainingHoursLocal: 85, daysAgo: 1 },
  { id: 'sub-15', projectId: 'project-lagos-depot', operatorId: 'demo-operator-coastal', periodLabel: 'Q4 2025', nigerianPersonnelCount: 160, totalPersonnelCount: 230, nigerianSpendNaira: 2_900_000_000, totalSpendNaira: 4_000_000_000, trainingHoursLocal: 70, daysAgo: 200 },
]

async function upsertUser(uid: string, email: string, role: 'operator' | 'reviewer') {
  try {
    await auth.getUser(uid)
    await auth.updateUser(uid, { email, password: DEMO_PASSWORD })
  } catch {
    await auth.createUser({ uid, email, password: DEMO_PASSWORD, emailVerified: true })
  }
  await auth.setCustomUserClaims(uid, { role })
}

async function main() {
  console.log('Seeding demo accounts...')
  await upsertUser(REVIEWER.uid, REVIEWER.email, 'reviewer')
  for (const op of OPERATORS) {
    await upsertUser(op.uid, op.email, 'operator')
  }

  console.log('Seeding operators collection...')
  const operatorBatch = db.batch()
  for (const op of OPERATORS) {
    operatorBatch.set(db.collection('operators').doc(op.uid), {
      companyName: op.companyName,
      rcNumber: op.rcNumber,
      sector: op.sector,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 300,
    })
  }
  await operatorBatch.commit()

  console.log('Seeding projects collection...')
  const projectBatch = db.batch()
  for (const p of PROJECTS) {
    projectBatch.set(db.collection('projects').doc(p.id), {
      operatorId: p.operatorId,
      projectName: p.projectName,
      state: p.state,
      ncThresholdPercent: p.ncThresholdPercent,
      status: p.status,
    })
  }
  await projectBatch.commit()

  console.log('Seeding submissions + alerts...')
  const projectById = new Map(PROJECTS.map((p) => [p.id, p]))
  const submissionBatch = db.batch()
  const alertsToCreate: { submissionId: string; operatorId: string; message: string }[] = []

  for (const s of SUBMISSION_INPUTS) {
    const project = projectById.get(s.projectId)!
    const computedNcPercent = computeNcPercent(s)
    const status = computeStatus(computedNcPercent, project.ncThresholdPercent)
    const submittedAt = Date.now() - 1000 * 60 * 60 * 24 * s.daysAgo

    submissionBatch.set(db.collection('submissions').doc(s.id), {
      projectId: s.projectId,
      operatorId: s.operatorId,
      periodLabel: s.periodLabel,
      nigerianPersonnelCount: s.nigerianPersonnelCount,
      totalPersonnelCount: s.totalPersonnelCount,
      nigerianSpendNaira: s.nigerianSpendNaira,
      totalSpendNaira: s.totalSpendNaira,
      trainingHoursLocal: s.trainingHoursLocal,
      evidenceFileUrls: [],
      computedNcPercent,
      status,
      submittedAt,
      reviewedAt: null,
      reviewerNote: null,
    })

    if (status === 'flagged') {
      alertsToCreate.push({
        submissionId: s.id,
        operatorId: s.operatorId,
        message: `${project.projectName} (${s.periodLabel}) came in at ${computedNcPercent}%, below the ${project.ncThresholdPercent}% threshold.`,
      })
    }
  }
  await submissionBatch.commit()

  if (alertsToCreate.length > 0) {
    const alertBatch = db.batch()
    for (const a of alertsToCreate) {
      alertBatch.set(db.collection('alerts').doc(`alert-${a.submissionId}`), {
        submissionId: a.submissionId,
        operatorId: a.operatorId,
        message: a.message,
        createdAt: Date.now(),
        acknowledged: false,
      })
    }
    await alertBatch.commit()
  }

  console.log(`Done. ${SUBMISSION_INPUTS.length} submissions, ${alertsToCreate.length} alerts.`)
  console.log('\nDemo logins (password: ' + DEMO_PASSWORD + '):')
  console.log('  Reviewer: ' + REVIEWER.email)
  for (const op of OPERATORS) console.log(`  Operator: ${op.email} (${op.companyName})`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
