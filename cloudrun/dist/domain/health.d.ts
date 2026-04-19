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
export declare function recommendationTargets(summary: HealthSummary): string[];
export declare function concernsFromTargets(targets: string[]): string[];
export interface HealthSummary {
    periodLabel: string;
    averageSleepScore: number;
    averageStress: number;
    averageHrv: number;
    averageReadiness: number;
    averageSpo2: number;
    averageSteps: number;
    highlights: Array<{
        label: string;
        value: string;
        tone: 'good' | 'warn' | 'normal';
    }>;
    targets: string[];
    concerns: string[];
    summaryText: string;
    records: HealthRecord[];
}
export declare function buildHealthSummary(records: HealthRecord[], days: number): HealthSummary;
