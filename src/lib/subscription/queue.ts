
import fs from 'fs';
import path from 'path';
import { SubscriptionEvent, EventStatus, EventPriority, QueueStatus } from './types';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(process.cwd(), 'src', 'data');
const QUEUE_FILE = path.join(DATA_DIR, 'subscription-events.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize queue file if not exists
if (!fs.existsSync(QUEUE_FILE)) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify([], null, 2));
}

class SubscriptionQueue {
    private getEvents(): SubscriptionEvent[] {
        try {
            const data = fs.readFileSync(QUEUE_FILE, 'utf-8');
            return JSON.parse(data) as SubscriptionEvent[];
        } catch (error) {
            console.error('Failed to read subscription queue:', error);
            return [];
        }
    }

    private saveEvents(events: SubscriptionEvent[]): void {
        try {
            // Atomic write pattern: write to tmp then rename
            const tempFile = `${QUEUE_FILE}.tmp`;
            fs.writeFileSync(tempFile, JSON.stringify(events, null, 2));
            fs.renameSync(tempFile, QUEUE_FILE);
        } catch (error) {
            console.error('Failed to save subscription queue:', error);
            // Don't throw, just log. This is critical but we don't want to crash the app if possible, 
            // though typically this should bubble up.
        }
    }

    /**
     * Enqueue a new publication event.
     * This is the ONLY entry point from the Publishing Layer.
     * It must be fast and never block.
     */
    public enqueue(
        data: Omit<SubscriptionEvent, 'id' | 'createdAt' | 'status' | 'attempts' | 'processedCount' | 'sentEmails'>
    ): SubscriptionEvent {
        const event: SubscriptionEvent = {
            id: uuidv4(),
            ...data,
            createdAt: new Date().toISOString(),
            status: 'pending',
            attempts: 0,
            processedCount: 0,
            sentEmails: [],
        };

        const events = this.getEvents();
        events.push(event);
        this.saveEvents(events);

        return event;
    }

    /**
     * Get the next pending event respecting priority.
     * Priority: breaking > important > normal
     */
    public getNextPending(): SubscriptionEvent | null {
        const events = this.getEvents();

        // Sort by priority and time
        const pending = events.filter(e => e.status === 'pending');

        if (pending.length === 0) return null;

        // Custom sort: breaking first, then important, then normal. Within that, older first (FIFO).
        pending.sort((a, b) => {
            const priorityScore = { breaking: 3, important: 2, normal: 1 };
            const scoreA = priorityScore[a.priority];
            const scoreB = priorityScore[b.priority];

            if (scoreA !== scoreB) return scoreB - scoreA; // High score first

            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); // Oldest first
        });

        return pending[0];
    }

    public updateEvent(id: string, updates: Partial<SubscriptionEvent>): void {
        const events = this.getEvents();
        const index = events.findIndex(e => e.id === id);

        if (index !== -1) {
            events[index] = { ...events[index], ...updates };
            this.saveEvents(events);
        }
    }

    public getStatus(): QueueStatus {
        const events = this.getEvents();
        return {
            length: events.length,
            pending: events.filter(e => e.status === 'pending').length,
            processing: events.filter(e => e.status === 'processing').length,
            failed: events.filter(e => e.status === 'failed').length,
            paused: events.some(e => e.status === 'paused'), // Global pause logic might need a separate flag
        };
    }

    public getEvent(id: string): SubscriptionEvent | undefined {
        return this.getEvents().find(e => e.id === id);
    }

    public pauseQueue(): void {
        // Implement global pause logic if needed, possibly a separate lock file or flag in the event?
        // For now, we can use a lock file.
        const lockFile = path.join(DATA_DIR, 'queue.lock');
        fs.writeFileSync(lockFile, 'PAUSED');
    }

    public resumeQueue(): void {
        const lockFile = path.join(DATA_DIR, 'queue.lock');
        if (fs.existsSync(lockFile)) {
            fs.unlinkSync(lockFile);
        }
    }

    public isPaused(): boolean {
        const lockFile = path.join(DATA_DIR, 'queue.lock');
        return fs.existsSync(lockFile);
    }
}

export const queueManager = new SubscriptionQueue();
