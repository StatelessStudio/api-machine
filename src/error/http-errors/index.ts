/* eslint-disable max-len */

// Base HTTP Error
export { HTTPError } from './http-error';

// 4xx Client Errors (in order)
export { BadRequestError } from './400-bad-request-error';
export {
	UnauthorizedError,
	UnauthorizedErrorOptions,
} from './401-unauthorized-error';
export { PaymentRequiredError } from './402-payment-required-error';
export { ForbiddenError } from './403-forbidden-error';
export { NotFoundError } from './404-not-found-error';
export {
	MethodNotAllowedError,
	MethodNotAllowedErrorOptions,
} from './405-method-not-allowed-error';
export { NotAcceptableError } from './406-not-acceptable-error';
export {
	ProxyAuthenticationRequiredError,
	ProxyAuthenticationRequiredErrorOptions,
} from './407-proxy-authentication-required-error';
export { RequestTimeoutError } from './408-request-timeout-error';
export { ConflictError } from './409-conflict-error';
export { GoneError } from './410-gone-error';
export { LengthRequiredError } from './411-length-required-error';
export { PreconditionFailedError } from './412-precondition-failed-error';
export { PayloadTooLargeError } from './413-payload-too-large-error';
export { URITooLongError } from './414-uri-too-long-error';
export {
	UnsupportedMediaTypeError,
	UnsupportedMediaTypeErrorOptions,
} from './415-unsupported-media-type-error';
export {
	RangeNotSatisfiableError,
	RangeNotSatisfiableErrorOptions,
} from './416-range-not-satisfiable-error';
export { ExpectationFailedError } from './417-expectation-failed-error';
export { ImATeapotError } from './418-im-a-teapot-error';
export { MisdirectedRequestError } from './421-misdirected-request-error';
export { UnprocessableEntityError } from './422-unprocessable-entity-error';
export { LockedError } from './423-locked-error';
export { FailedDependencyError } from './424-failed-dependency-error';
export { TooEarlyError } from './425-too-early-error';
export {
	UpgradeRequiredError,
	UpgradeRequiredErrorOptions,
} from './426-upgrade-required-error';
export { PreconditionRequiredError } from './428-precondition-required-error';
export {
	TooManyRequestsError,
	TooManyRequestsErrorOptions,
} from './429-too-many-requests-error';
export { RequestHeaderFieldsTooLargeError } from './431-request-header-fields-too-large-error';
export { UnavailableForLegalReasonsError } from './451-unavailable-for-legal-reasons-error';
