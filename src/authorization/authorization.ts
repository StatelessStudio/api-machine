import { AuthenticatedPrincipal } from '../authentication/authenticated-request';

export interface AuthorizationRequirement {
	action: string;
	resource?: string | Record<string, unknown>;
	metadata?: Record<string, unknown>;
}

export interface AuthorizationContext extends AuthorizationRequirement {
	principal: AuthenticatedPrincipal;
}

export interface AuthorizationResult {
	allowed: boolean;
	reason?: string;
}

export interface ApiAuthorizationService {
	evaluate(context: AuthorizationContext): Promise<AuthorizationResult>;
}
