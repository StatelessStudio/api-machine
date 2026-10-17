import {
	AuthenticatedPrincipal,
} from '../authentication/authenticated-request';

export interface Session {
	id: string;
	principal?: AuthenticatedPrincipal;
}
