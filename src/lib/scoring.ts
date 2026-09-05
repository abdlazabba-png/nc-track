// Nigerian Content compliance scoring weights.
// This is the part a real NCDMB reviewer will want to inspect and argue
// with — kept isolated here rather than buried inline. The Cloud Function
// that actually computes `computedNcPercent` on write mirrors this file;
// keep the two in sync if the weights change.

export const PERSONNEL_WEIGHT = 0.4
export const SPEND_WEIGHT = 0.5
export const TRAINING_WEIGHT = 0.1

// Training hours above this cap don't add further credit.
export const TRAINING_HOURS_CAP = 100

// Grace zone below the project's threshold that still counts as "pending"
// rather than immediately "flagged".
export const GRACE_ZONE_POINTS = 10

export interface ScoringInput {
  nigerianPersonnelCount: number
  totalPersonnelCount: number
  nigerianSpendNaira: number
  totalSpendNaira: number
  trainingHoursLocal: number
}

export function computeNcPercent(input: ScoringInput): number {
  const personnelRatio =
    input.totalPersonnelCount > 0
      ? input.nigerianPersonnelCount / input.totalPersonnelCount
      : 0
  const spendRatio =
    input.totalSpendNaira > 0
      ? input.nigerianSpendNaira / input.totalSpendNaira
      : 0
  const trainingFactor = Math.min(input.trainingHoursLocal / TRAINING_HOURS_CAP, 1)

  const weighted =
    personnelRatio * PERSONNEL_WEIGHT +
    spendRatio * SPEND_WEIGHT +
    trainingFactor * TRAINING_WEIGHT

  return Math.round(weighted * 1000) / 10 // one decimal place, as a percent
}

export function computeStatus(
  ncPercent: number,
  thresholdPercent: number,
): 'compliant' | 'pending' | 'flagged' {
  if (ncPercent >= thresholdPercent) return 'compliant'
  if (ncPercent >= thresholdPercent - GRACE_ZONE_POINTS) return 'pending'
  return 'flagged'
}
