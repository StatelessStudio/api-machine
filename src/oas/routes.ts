import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

import { RestServer } from '../server';
import { OasRestServerConverter } from './oas-rest-server-converter';

export async function oasRoutes({
	router,
	server,
	oasPath,
	swaggerPath,
}: {
	router: Express;
	server: RestServer;
	oasPath?: string;
	swaggerPath?: string;
}) {
	oasPath = oasPath || '/openapi.json';
	swaggerPath = swaggerPath || '/docs';
	const converter = new OasRestServerConverter();
	const spec = await converter.getOpenApiSpec(server);

	// Expose OpenAPI spec
	router.get(oasPath, async (req, res) => {
		res.json(spec);
	});

	// Serve Swagger UI static assets
	router.use(swaggerPath, swaggerUi.serve);

	// Serve Swagger UI HTML
	router.get(swaggerPath, async (req, res, next) => {
		return swaggerUi.setup(spec)(req, res, next);
	});
}
