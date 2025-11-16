import {
	HTTPError,
	BadRequestError,
	UnauthorizedError,
	PaymentRequiredError,
	ForbiddenError,
	NotFoundError,
	MethodNotAllowedError,
	NotAcceptableError,
	ProxyAuthenticationRequiredError,
	RequestTimeoutError,
	ConflictError,
	GoneError,
	LengthRequiredError,
	PreconditionFailedError,
	PayloadTooLargeError,
	URITooLongError,
	UnsupportedMediaTypeError,
	RangeNotSatisfiableError,
	ExpectationFailedError,
	ImATeapotError,
	MisdirectedRequestError,
	UnprocessableEntityError,
	LockedError,
	FailedDependencyError,
	TooEarlyError,
	UpgradeRequiredError,
	PreconditionRequiredError,
	TooManyRequestsError,
	RequestHeaderFieldsTooLargeError,
	UnavailableForLegalReasonsError,
} from '../../../src/error';

describe('HTTPError Classes', () => {
	describe('HTTPError base class', () => {
		class TestError extends HTTPError {
			public override getStatusCode(): number {
				return 499;
			}
		}

		it('should create error with message only', () => {
			const error = new TestError('Test error');

			expect(error.message).toBe('Test error');
			expect(error.getStatusCode()).toBe(499);
			expect(error.headers).toEqual({});
			expect(error.details).toBeUndefined();
		});

		it('should create error with message and options', () => {
			const error = new TestError('Test error', {
				headers: { 'X-Custom': 'header' },
				details: { foo: 'bar' },
			});

			expect(error.message).toBe('Test error');
			expect(error.getStatusCode()).toBe(499);
			expect(error.headers).toEqual({ 'X-Custom': 'header' });
			expect(error.details).toEqual({ foo: 'bar' });
		});

		it('should serialize to JSON correctly', () => {
			const error = new TestError('Test error', {
				details: { code: 'TEST_ERROR' },
			});

			const json = error.getResponseJson();
			expect(json.error).toBe('TestError');
			expect(json.message).toBe('Test error');
			expect(json.options.details).toEqual({ code: 'TEST_ERROR' });
			expect(json.timestamp).toBeDefined();
		});
	});

	describe('Simple error classes', () => {
		it('BadRequestError should have correct status code', () => {
			const error = new BadRequestError('Invalid input');
			expect(error.getStatusCode()).toBe(400);
			expect(error.message).toBe('Invalid input');
		});

		it('PaymentRequiredError should have correct status code', () => {
			const error = new PaymentRequiredError('Payment required');
			expect(error.getStatusCode()).toBe(402);
			expect(error.message).toBe('Payment required');
		});

		it('PaymentRequiredError should use default message', () => {
			const error = new PaymentRequiredError();
			expect(error.getStatusCode()).toBe(402);
			expect(error.message).toBe('Payment Required');
		});

		it('ForbiddenError should have correct status code', () => {
			const error = new ForbiddenError();
			expect(error.getStatusCode()).toBe(403);
			expect(error.message).toBe('Forbidden');
		});

		it('NotFoundError should have correct status code', () => {
			const error = new NotFoundError('Resource not found', {
				details: { resource: 'user', id: 123 },
			});
			expect(error.getStatusCode()).toBe(404);
			expect(error.message).toBe('Resource not found');
			expect(error.details).toEqual({ resource: 'user', id: 123 });
		});

		it('NotAcceptableError should have correct status code', () => {
			const error = new NotAcceptableError('Not acceptable');
			expect(error.getStatusCode()).toBe(406);
		});

		it('NotAcceptableError should use default message', () => {
			const error = new NotAcceptableError();
			expect(error.message).toBe('Not Acceptable');
		});

		it('RequestTimeoutError should have correct status code', () => {
			const error = new RequestTimeoutError();
			expect(error.getStatusCode()).toBe(408);
			expect(error.message).toBe('Request Timeout');
		});

		it('ConflictError should have correct status code', () => {
			const error = new ConflictError('Resource already exists');
			expect(error.getStatusCode()).toBe(409);
		});

		it('ConflictError should use default message', () => {
			const error = new ConflictError();
			expect(error.message).toBe('Conflict');
		});

		it('GoneError should have correct status code', () => {
			const error = new GoneError('Resource is gone');
			expect(error.getStatusCode()).toBe(410);
		});

		it('GoneError should use default message', () => {
			const error = new GoneError();
			expect(error.message).toBe('Gone');
		});

		it('LengthRequiredError should have correct status code', () => {
			const error = new LengthRequiredError();
			expect(error.getStatusCode()).toBe(411);
			expect(error.message).toBe('Length Required');
		});

		it('PreconditionFailedError should have correct status code', () => {
			const error = new PreconditionFailedError('Precondition failed');
			expect(error.getStatusCode()).toBe(412);
		});

		it('PreconditionFailedError should use default message', () => {
			const error = new PreconditionFailedError();
			expect(error.message).toBe('Precondition Failed');
		});

		it('PayloadTooLargeError should have correct status code', () => {
			const error = new PayloadTooLargeError();
			expect(error.getStatusCode()).toBe(413);
			expect(error.message).toBe('Payload Too Large');
		});

		it('URITooLongError should have correct status code', () => {
			const error = new URITooLongError('URI too long');
			expect(error.getStatusCode()).toBe(414);
		});

		it('URITooLongError should use default message', () => {
			const error = new URITooLongError();
			expect(error.message).toBe('URI Too Long');
		});

		it('ExpectationFailedError should have correct status code', () => {
			const error = new ExpectationFailedError();
			expect(error.getStatusCode()).toBe(417);
			expect(error.message).toBe('Expectation Failed');
		});

		it('ImATeapotError should have correct status code', () => {
			const error = new ImATeapotError();
			expect(error.getStatusCode()).toBe(418);
			expect(error.message).toBe('I\'m a teapot');
		});

		it('MisdirectedRequestError should have correct status code', () => {
			const error = new MisdirectedRequestError('Misdirected request');
			expect(error.getStatusCode()).toBe(421);
		});

		it('MisdirectedRequestError should use default message', () => {
			const error = new MisdirectedRequestError();
			expect(error.message).toBe('Misdirected Request');
		});

		it('UnprocessableEntityError should have correct status code', () => {
			const error = new UnprocessableEntityError('Validation failed', {
				details: { errors: ['field1', 'field2'] },
			});
			expect(error.getStatusCode()).toBe(422);
			expect(error.details).toEqual({ errors: ['field1', 'field2'] });
		});

		it('UnprocessableEntityError should use default message', () => {
			const error = new UnprocessableEntityError();
			expect(error.message).toBe('Unprocessable Entity');
		});

		it('LockedError should have correct status code', () => {
			const error = new LockedError();
			expect(error.getStatusCode()).toBe(423);
			expect(error.message).toBe('Locked');
		});

		it('FailedDependencyError should have correct status code', () => {
			const error = new FailedDependencyError('Dependency failed');
			expect(error.getStatusCode()).toBe(424);
		});

		it('FailedDependencyError should use default message', () => {
			const error = new FailedDependencyError();
			expect(error.message).toBe('Failed Dependency');
		});

		it('TooEarlyError should have correct status code', () => {
			const error = new TooEarlyError();
			expect(error.getStatusCode()).toBe(425);
			expect(error.message).toBe('Too Early');
		});

		it('PreconditionRequiredError should have correct status code', () => {
			const error = new PreconditionRequiredError(
				'Precondition required'
			);
			expect(error.getStatusCode()).toBe(428);
		});

		it('PreconditionRequiredError should use default message', () => {
			const error = new PreconditionRequiredError();
			expect(error.message).toBe('Precondition Required');
		});

		it('RequestHeaderFieldsTooLargeError has correct status code', () => {
			const error = new RequestHeaderFieldsTooLargeError();
			expect(error.getStatusCode()).toBe(431);
			expect(error.message).toBe('Request Header Fields Too Large');
		});

		it('UnavailableForLegalReasonsError has correct status code', () => {
			const error = new UnavailableForLegalReasonsError('Blocked by law');
			expect(error.getStatusCode()).toBe(451);
		});

		it('UnavailableForLegalReasonsError should use default message', () => {
			const error = new UnavailableForLegalReasonsError();
			expect(error.message).toBe('Unavailable For Legal Reasons');
		});
	});

	describe('UnauthorizedError', () => {
		it('should use default realm and scheme', () => {
			const error = new UnauthorizedError();
			expect(error.getStatusCode()).toBe(401);
			expect(error.headers['WWW-Authenticate']).toBe(
				'Bearer realm="Access to the resource"'
			);
		});

		it('should use custom realm', () => {
			const error = new UnauthorizedError('Invalid token', {
				realm: 'API',
			});
			expect(error.headers['WWW-Authenticate']).toBe(
				'Bearer realm="API"'
			);
		});

		it('should use custom scheme', () => {
			const error = new UnauthorizedError('Invalid credentials', {
				realm: 'Admin',
				scheme: 'Basic',
			});
			expect(error.headers['WWW-Authenticate']).toBe(
				'Basic realm="Admin"'
			);
		});

		it('should support additional details', () => {
			const error = new UnauthorizedError('Token expired', {
				realm: 'API',
				details: { expiredAt: '2024-01-01' },
			});
			expect(error.details).toEqual({ expiredAt: '2024-01-01' });
		});
	});

	describe('MethodNotAllowedError', () => {
		it('should create error without allowed methods', () => {
			const error = new MethodNotAllowedError();
			expect(error.getStatusCode()).toBe(405);
			expect(error.headers['Allow']).toBeUndefined();
		});

		it('should include Allow header with allowed methods', () => {
			const error = new MethodNotAllowedError('Method not supported', {
				allowedMethods: ['GET', 'POST', 'PUT'],
			});
			expect(error.getStatusCode()).toBe(405);
			expect(error.headers['Allow']).toBe('GET, POST, PUT');
		});

		it('should support additional details', () => {
			const error = new MethodNotAllowedError('DELETE not allowed', {
				allowedMethods: ['GET', 'POST'],
				details: { attemptedMethod: 'DELETE' },
			});
			expect(error.details).toEqual({ attemptedMethod: 'DELETE' });
		});
	});

	describe('TooManyRequestsError', () => {
		it('should create error without retry-after', () => {
			const error = new TooManyRequestsError();
			expect(error.getStatusCode()).toBe(429);
			expect(error.headers['Retry-After']).toBeUndefined();
		});

		it('should include Retry-After header', () => {
			const error = new TooManyRequestsError('Rate limit exceeded', {
				retryAfter: 60,
			});
			expect(error.getStatusCode()).toBe(429);
			expect(error.headers['Retry-After']).toBe('60');
		});

		it('should support additional details', () => {
			const error = new TooManyRequestsError('Too many requests', {
				retryAfter: 120,
				details: { limit: 100, current: 150 },
			});
			expect(error.details).toEqual({ limit: 100, current: 150 });
		});
	});

	describe('UnsupportedMediaTypeError', () => {
		it('should create error without accepted types', () => {
			const error = new UnsupportedMediaTypeError();
			expect(error.getStatusCode()).toBe(415);
			expect(error.headers['Accept']).toBeUndefined();
		});

		it('should include Accept header with accepted types', () => {
			const error = new UnsupportedMediaTypeError(
				'Invalid content type',
				{
					acceptedTypes: ['application/json', 'application/xml'],
				}
			);
			expect(error.getStatusCode()).toBe(415);
			expect(error.headers['Accept']).toBe(
				'application/json, application/xml'
			);
		});
	});

	describe('RangeNotSatisfiableError', () => {
		it('should create error without content range', () => {
			const error = new RangeNotSatisfiableError();
			expect(error.getStatusCode()).toBe(416);
			expect(error.headers['Content-Range']).toBeUndefined();
		});

		it('should include Content-Range header', () => {
			const error = new RangeNotSatisfiableError('Invalid range', {
				contentRange: 'bytes */1000',
			});
			expect(error.getStatusCode()).toBe(416);
			expect(error.headers['Content-Range']).toBe('bytes */1000');
		});
	});

	describe('ProxyAuthenticationRequiredError', () => {
		it('should use default realm', () => {
			const error = new ProxyAuthenticationRequiredError();
			expect(error.getStatusCode()).toBe(407);
			expect(error.headers['Proxy-Authenticate']).toBe(
				'Basic realm="Proxy"'
			);
		});

		it('should use custom realm', () => {
			const error = new ProxyAuthenticationRequiredError(
				'Proxy auth required',
				{ realm: 'Corporate Proxy' }
			);
			expect(error.headers['Proxy-Authenticate']).toBe(
				'Basic realm="Corporate Proxy"'
			);
		});
	});

	describe('UpgradeRequiredError', () => {
		it('should use default protocol', () => {
			const error = new UpgradeRequiredError();
			expect(error.getStatusCode()).toBe(426);
			expect(error.headers['Upgrade']).toBe('TLS/1.0');
		});

		it('should use custom protocol', () => {
			const error = new UpgradeRequiredError('Please upgrade', {
				upgradeProtocol: 'HTTP/2.0',
			});
			expect(error.headers['Upgrade']).toBe('HTTP/2.0');
		});
	});

	describe('Error inheritance and type checking', () => {
		it('all error classes should extend HTTPError', () => {
			const errors = [
				new BadRequestError(),
				new UnauthorizedError(),
				new ForbiddenError(),
				new NotFoundError(),
				new MethodNotAllowedError(),
			];

			errors.forEach((error) => {
				expect(error instanceof HTTPError).toBe(true);
				expect(error instanceof Error).toBe(true);
			});
		});

		it('should have proper error names', () => {
			expect(new BadRequestError().name).toBe('BadRequestError');
			expect(new UnauthorizedError().name).toBe('UnauthorizedError');
			expect(new NotFoundError().name).toBe('NotFoundError');
		});
	});

	describe('Custom headers and details combination', () => {
		it('should merge custom headers with error-specific headers', () => {
			const error = new UnauthorizedError('Token invalid', {
				realm: 'API',
				headers: {
					'X-Request-Id': '123',
					'X-Custom': 'value',
				},
				details: { reason: 'expired' },
			});

			expect(error.headers).toEqual({
				'WWW-Authenticate': 'Bearer realm="API"',
				'X-Request-Id': '123',
				'X-Custom': 'value',
			});
			expect(error.details).toEqual({ reason: 'expired' });
		});

		it('should allow user headers to override default headers', () => {
			const error = new UnauthorizedError('Custom auth', {
				realm: 'API',
				headers: {
					'WWW-Authenticate': 'Custom scheme',
				},
			});

			expect(error.headers['WWW-Authenticate']).toBe('Custom scheme');
		});

		it('should merge custom headers with MethodNotAllowedError', () => {
			const error = new MethodNotAllowedError('Not allowed', {
				allowedMethods: ['GET', 'POST'],
				headers: { 'X-API-Version': '1.0' },
			});

			expect(error.headers).toEqual({
				Allow: 'GET, POST',
				'X-API-Version': '1.0',
			});
		});

		it('should allow user to override Allow header', () => {
			const error = new MethodNotAllowedError('Not allowed', {
				allowedMethods: ['GET', 'POST'],
				headers: { Allow: 'GET, POST, PUT, DELETE' },
			});

			expect(error.headers['Allow']).toBe('GET, POST, PUT, DELETE');
		});

		it('should allow user to override Upgrade header', () => {
			const error = new UpgradeRequiredError('Upgrade needed', {
				upgradeProtocol: 'HTTP/2.0',
				headers: { Upgrade: 'HTTP/3.0' },
			});

			expect(error.headers['Upgrade']).toBe('HTTP/3.0');
		});

		it('should allow user to override Retry-After header', () => {
			const error = new TooManyRequestsError('Rate limited', {
				retryAfter: 60,
				headers: { 'Retry-After': '3600' },
			});

			expect(error.options.headers?.['Retry-After']).toBe('3600');
		});
	});
});
