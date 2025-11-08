import { BaseApiEndpoint, EndpointMethod } from '../endpoint';

export abstract class PatchEndpoint extends BaseApiEndpoint {
	override method = EndpointMethod.PATCH;
	override statusCode = 200;
}
