import serverless from 'serverless-http';
import type { Context } from 'aws-lambda';
import { app } from './app';

const serverlessHandler = serverless(app);

export const handler = (event: unknown, context: Context) => {
	// No esperar a que el event loop se vacie antes de devolver la respuesta.
	// El cliente SQS mantiene sockets keep-alive abiertos que, de lo contrario,
	// dejarian a la Lambda colgada hasta el timeout (API Gateway responde 503).
	context.callbackWaitsForEmptyEventLoop = false;
	return serverlessHandler(event, context);
};