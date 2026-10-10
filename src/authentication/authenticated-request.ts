import { Request } from 'express';

export interface AuthenticatedPrincipal {
	id: string;
}

export interface AuthenticatedRequest extends Request {
	authenticated?: boolean;
	principal?: AuthenticatedPrincipal;
	sessionId?: string;
}
