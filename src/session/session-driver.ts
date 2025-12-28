import { Session } from './session';

export interface SessionRequest {
	sessionId?: string;
}

export abstract class SessionDriver {
	public abstract createSession(session: Session): void;
	public abstract clear(): void;
	public abstract getSession(options: SessionRequest): Promise<Session>;
	public abstract checkSession(options: SessionRequest): Promise<void>;
}
