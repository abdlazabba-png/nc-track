export type Role = 'operator' | 'reviewer'

export type Sector = 'upstream' | 'midstream' | 'downstream'

export interface Operator {
  id: string
  companyName: string
  rcNumber: string
  sector: Sector
  createdAt: number
}

export type ProjectStatus = 'active' | 'closed'

export interface Project {
  id: string
  operatorId: string
  projectName: string
  state: string
  ncThresholdPercent: number
  status: ProjectStatus
}

export type SubmissionStatus = 'pending' | 'compliant' | 'flagged'

export interface Submission {
  id: string
  projectId: string
  operatorId: string
  periodLabel: string
  nigerianPersonnelCount: number
  totalPersonnelCount: number
  nigerianSpendNaira: number
  totalSpendNaira: number
  trainingHoursLocal: number
  evidenceFileUrls: string[]
  computedNcPercent: number
  status: SubmissionStatus
  submittedAt: number
  reviewedAt: number | null
  reviewerNote: string | null
}

export interface Alert {
  id: string
  submissionId: string
  operatorId: string
  message: string
  createdAt: number
  acknowledged: boolean
}
