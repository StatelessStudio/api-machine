import { SessionDriver, SessionRequest } from '../session-driver';
import { Session } from '../session';

/**
 * In-memory session driver implementation for development and testing
 */
export class InMemorySessionDriver extends SessionDriver {
	protected sessions: Map<string, Session> = new Map();

	/**
	 * Register a session
	 */
	public createSession(session: Session): void {
		this.sessions.set(session.id, session);
	}

	/**
	 * Clear all sessions
	 */
	public clear(): void {
		this.sessions.clear();
	}

	/**
	 * Get the number of registered sessions
	 */
	public getSessionCount(): number {
		return this.sessions.size;
	}

	async getSession(request: SessionRequest): Promise<Session> {
		const sessionId = request.sessionId || 'default-session';
		const session = this.sessions.get(sessionId) || {
			id: sessionId,
		};

		return session;
	}

	async checkSession(request: SessionRequest): Promise<void> {
		const sessionId = request.sessionId;
		if (!sessionId) {
			throw new Error('No session ID provided');
		}

		if (!this.sessions.has(sessionId)) {
			throw new Error('Session not found');
		}
	}
}
