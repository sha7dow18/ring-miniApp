export interface HealthRecord {
  _id?: string;
  _openid?: string;
  date?: string;
  sleep_score?: number;
  sleep_duration?: number;
  hr_resting?: number;
  hrv?: number;
  stress?: number;
  readiness_score?: number;
  spo2?: number;
  steps?: number;
}

function avg (list: HealthRecord[], key: keyof HealthRecord): number {
  if (!list.length) return 0
  const total = list.reduce((sum, item) => sum + (Number(item[key]) || 0), 0)
  return Math.round(total / list.length)
}

export function recommendationTargets (summary: HealthSummary): string[] {
  const targets: string[] = []
  if ((summary.averageSleepScore || 0) < 75) targets.push('sleep')
  if ((summary.averageStress || 0) > 55) targets.push('tea')
  if ((summary.averageHrv || 0) < 45) targets.push('herb')
  if (!targets.length) targets.push('tea', 'herb')
  return targets
}

export function concernsFromTargets (targets: string[]): string[] {
  const map: Record<string, string[]> = {
    sleep: ['助眠', '安睡', '睡眠', '放松'],
    tea: ['舒缓', '茶饮', '轻养', '放松'],
    herb: ['滋补', '元气', '恢复', '气血']
  }
  const seen = new Set<string>()
  return (targets || []).flatMap((target) => map[target] || []).filter((word) => {
    if (seen.has(word)) return false
    seen.add(word)
    return true
  })
}

export interface HealthSummary {
  periodLabel: string;
  averageSleepScore: number;
  averageStress: number;
  averageHrv: number;
  averageReadiness: number;
  averageSpo2: number;
  averageSteps: number;
  highlights: Array<{ label: string; value: string; tone: 'good' | 'warn' | 'normal' }>;
  targets: string[];
  concerns: string[];
  summaryText: string;
  records: HealthRecord[];
}

export function buildHealthSummary (records: HealthRecord[], days: number): HealthSummary {
  const list = records || []
  const summary: HealthSummary = {
    periodLabel: `最近${list.length || days || 7}天`,
    averageSleepScore: avg(list, 'sleep_score'),
    averageStress: avg(list, 'stress'),
    averageHrv: avg(list, 'hrv'),
    averageReadiness: avg(list, 'readiness_score'),
    averageSpo2: avg(list, 'spo2'),
    averageSteps: avg(list, 'steps'),
    highlights: [],
    targets: [],
    concerns: [],
    summaryText: '',
    records: list
  }
  summary.highlights = [
    {
      label: '睡眠评分',
      value: `${summary.averageSleepScore} / 100`,
      tone: summary.averageSleepScore < 75 ? 'warn' : 'good'
    },
    {
      label: '压力',
      value: `${summary.averageStress}`,
      tone: summary.averageStress > 55 ? 'warn' : 'good'
    },
    {
      label: 'HRV',
      value: `${summary.averageHrv} ms`,
      tone: summary.averageHrv < 45 ? 'warn' : 'good'
    }
  ]
  summary.targets = recommendationTargets(summary)
  summary.concerns = concernsFromTargets(summary.targets)
  summary.summaryText = summary.targets[0] === 'sleep'
    ? '近期重点关注睡眠与晚间放松。'
    : '当前整体平稳，可做温和调理。'
  return summary
}
