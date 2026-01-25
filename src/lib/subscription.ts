import fs from 'fs';
import path from 'path';

const SUBSCRIBERS_FILE = path.join(process.cwd(), 'src', 'data', 'subscribers.json');

export interface Subscriber {
    email: string;
    subscribedAt: string;
    active: boolean;
}

function readSubscribers(): Subscriber[] {
    if (!fs.existsSync(SUBSCRIBERS_FILE)) {
        return [];
    }
    try {
        const content = fs.readFileSync(SUBSCRIBERS_FILE, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Failed to read subscribers file:', error);
        return [];
    }
}

function writeSubscribers(subscribers: Subscriber[]): void {
    const dir = path.dirname(SUBSCRIBERS_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SUBSCRIBERS_FILE, JSON.stringify(subscribers, null, 2));
}

export function addSubscriber(email: string): { success: boolean; message: string; isDuplicate?: boolean } {
    const subscribers = readSubscribers();
    const existing = subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());

    if (existing) {
        if (!existing.active) {
            existing.active = true;
            existing.subscribedAt = new Date().toISOString();
            writeSubscribers(subscribers);
            return { success: true, message: 'Welcome back! Subscription reactivated.', isDuplicate: true };
        }
        return { success: true, message: 'You are already subscribed.', isDuplicate: true };
    }

    subscribers.push({
        email: email.trim(),
        subscribedAt: new Date().toISOString(),
        active: true,
    });

    writeSubscribers(subscribers);
    return { success: true, message: 'Successfully subscribed.' };
}

export function getActiveSubscribers(): string[] {
    return readSubscribers()
        .filter(s => s.active)
        .map(s => s.email);
}
