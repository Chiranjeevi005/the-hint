
export type EventStatus = 'pending' | 'processing' | 'sent' | 'paused' | 'failed';
export type EventPriority = 'normal' | 'important' | 'breaking';

export interface SubscriptionEvent {
    id: string; // UUID
    articleSlug: string;
    section: string;
    headline: string;
    summary: string;
    contentType: 'news' | 'opinion';
    priority: EventPriority;
    createdAt: string; // ISO string
    status: EventStatus;
    attempts: number;
    lastAttemptAt?: string;
    failureReason?: string;
    processedCount: number; // How many emails sent so far for this event
    totalSubscribers?: number; // Snapshot of total subscribers at time of event
    sentEmails: string[]; // Track who has received the email to avoid duplicates on retry
}

export interface QueueStatus {
    length: number;
    pending: number;
    processing: number;
    failed: number;
    paused: boolean;
}

export interface EmailWorkerConfig {
    maxEmailsPerMinute: number;
    maxRetries: number;
    circuitBreakerThreshold: number; // Consecutive failures before pausing
    batchSize: number; // Emails per batch
}
