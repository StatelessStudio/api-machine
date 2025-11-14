import express from 'express';
import cors from 'cors';
import http from 'http';

import { defaultRestServerOptions, RestServerOptions } from './server-options';
import { ApiRouter } from '../router';
import { HTTPError, NotFoundError, ErrorResponse } from '../error';

import { LogInterface } from '../log';

export abstract class RestServer {
	public router: ApiRouter;
	public readonly port: number;
	public readonly maxPayloadSizeMB: number;
	public readonly maxUrlEncodedSizeMB: number;
	public readonly securityHeaders: RestServerOptions['securityHeaders'];

	protected app: express.Express;
	protected listener: http.Server;
	protected log: LogInterface;

	constructor(options: Partial<RestServerOptions>) {
		options = { ...defaultRestServerOptions, ...options };

		this.port = options.port!;
		this.maxPayloadSizeMB = options.maxPayloadSizeMB!;
		this.maxUrlEncodedSizeMB = options.maxUrlEncodedSizeMB!;
		this.log = options.log!;
		this.securityHeaders = {
			...defaultRestServerOptions.securityHeaders,
			...options.securityHeaders,
		};
	}

	public async start() {
		await this.setupExpress();
		await this.registerRoutes();
		await this.setup404Handler();
		await this.setupErrorHandler();
		await this.startListening();
	}

	public async stop(): Promise<void> {
		if (this.listener) {
			this.listener.close();
		}
	}

	protected async registerRoutes(): Promise<void> {
		const router = new this.router();
		await router.register(this.app, '');
	}

	protected async setupExpress(): Promise<void> {
		this.app = express();
		await this.setupSecurityHeaders();
		await this.setupExpressCors();
		await this.setupExpressJson();
		await this.setupExpressUrlEncoded();
	}

	protected async setupSecurityHeaders(): Promise<void> {
		// Disable X-Powered-By header to prevent server fingerprinting
		if (this.securityHeaders.disableXPoweredBy) {
			this.app.disable('x-powered-by');
		}

		// Add security headers middleware
		this.app.use(
			(
				request: express.Request,
				response: express.Response,
				next: express.NextFunction
			) => {
				// X-Content-Type-Options: nosniff
				if (this.securityHeaders.noSniff) {
					response.setHeader('X-Content-Type-Options', 'nosniff');
				}

				// X-Frame-Options
				if (this.securityHeaders.frameOptions) {
					response.setHeader(
						'X-Frame-Options',
						this.securityHeaders.frameOptions
					);
				}

				// X-XSS-Protection
				if (this.securityHeaders.xssProtection) {
					response.setHeader('X-XSS-Protection', '1; mode=block');
				}

				// Strict-Transport-Security (HSTS)
				if (this.securityHeaders.hsts) {
					const hstsValue =
						`max-age=${this.securityHeaders.hsts}; ` +
						'includeSubDomains';
					response.setHeader('Strict-Transport-Security', hstsValue);
				}

				next();
			}
		);
	}

	protected async setupExpressCors(): Promise<void> {
		this.app.use(cors());
	}

	protected async setupExpressJson(): Promise<void> {
		this.app.use(express.json({ limit: `${this.maxPayloadSizeMB}mb` }));
	}

	protected async setupExpressUrlEncoded(): Promise<void> {
		this.app.use(
			express.urlencoded({
				extended: true,
				limit: `${this.maxUrlEncodedSizeMB}mb`,
			})
		);
	}

	protected async setup404Handler(): Promise<void> {
		this.app.use(() => {
			throw new NotFoundError('The requested endpoint does not exist.');
		});
	}

	protected async setupErrorHandler(): Promise<void> {
		this.app.use(
			(
				error: string | Error,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				request: express.Request,
				response: express.Response,
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				next: express.NextFunction
			) => {
				// Handle HTTPError instances
				if (error instanceof HTTPError) {
					// Set custom headers if provided
					Object.entries(error.headers).forEach(([key, value]) => {
						response.setHeader(key, value);
					});

					return response
						.status(error.getStatusCode())
						.json(error.getResponseJson());
				}

				// Handle generic errors
				this.log?.error('Unhandled error:', error);

				return response.status(500).json(<ErrorResponse>{
					error: 'InternalServerError',
					message: 'Internal server error',
					timestamp: new Date().toISOString(),
					options: {},
				});
			}
		);
	}

	protected async startListening(): Promise<void> {
		await new Promise<void>((accept, reject) => {
			this.listener = this.app.listen(this.port, (error?: Error) => {
				if (error) {
					reject(error);
					return;
				}

				accept();
			});
		});
	}
}
