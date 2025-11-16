import { LogInterface } from '../log';
import { AuthenticationScheme } from '../authentication/authentication-scheme';

export interface SecurityHeadersOptions {
	/**
	 * Disable the X-Powered-By header to prevent server fingerprinting
	 * @default true
	 */
	disableXPoweredBy: boolean;

	/**
	 * Set X-Content-Type-Options: nosniff to prevent MIME type sniffing
	 * @default true
	 */
	noSniff: boolean;

	/**
	 * Set X-Frame-Options header to prevent clickjacking
	 * Options: 'DENY', 'SAMEORIGIN', or false to disable
	 * @default 'DENY'
	 */
	frameOptions: 'DENY' | 'SAMEORIGIN' | false;

	/**
	 * Set X-XSS-Protection header for legacy browser protection
	 * @default true
	 */
	xssProtection: boolean;

	/**
	 * Set Strict-Transport-Security header (only use with HTTPS)
	 * Provide max-age value or false to disable
	 * @default false
	 */
	hsts: number | false;
}

export interface RestServerOptions {
	port: number;
	maxPayloadSizeMB: number;
	maxUrlEncodedSizeMB: number;
	log: LogInterface;
	securityHeaders: SecurityHeadersOptions;
	swaggerEnabled?: boolean;

	/**
	 * Server-level authentication scheme
	 * This will be applied to all routers and endpoints unless overridden
	 */
	authentication?: AuthenticationScheme;
}

export const defaultSecurityHeadersOptions: SecurityHeadersOptions = {
	disableXPoweredBy: true,
	noSniff: true,
	frameOptions: 'DENY',
	xssProtection: true,
	hsts: false, // Disabled by default, enable when using HTTPS
};

export const defaultRestServerOptions: RestServerOptions = {
	port: 5000,
	maxPayloadSizeMB: 10,
	maxUrlEncodedSizeMB: 1,
	log: {
		...console,
		// eslint-disable-next-line no-console
		fatal: console.error,
		// eslint-disable-next-line no-console
		info: console.log,
	},
	securityHeaders: defaultSecurityHeadersOptions,
};
