// Especificacion OpenAPI 3.0 del microservicio Identity & Profile.
// Se sirve via swagger-ui-express en /api/docs (ver src/app.ts).
import { OpenAPIV3 } from 'openapi-types';

export const openapiSpec: OpenAPIV3.Document = {
	openapi: '3.0.3',
	info: {
		title: 'Identity & Profile Service API',
		version: '1.0.0',
		description:
			'Microservicio de identidad y autenticacion de la plataforma de apoyo financiero ' +
			'para proyectos universitarios. Gestiona registro, login y refresco de tokens.',
	},
	servers: [
		{ url: '/', description: 'Servidor actual' },
	],
	tags: [
		{ name: 'Health', description: 'Estado del servicio' },
		{ name: 'Auth', description: 'Autenticacion y registro de usuarios' },
	],
	paths: {
		'/api/health': {
			get: {
				tags: ['Health'],
				summary: 'Verifica el estado del microservicio',
				responses: {
					'200': {
						description: 'El servicio esta funcionando',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/HealthResponse' },
							},
						},
					},
				},
			},
		},
		'/api/auth/login': {
			post: {
				tags: ['Auth'],
				summary: 'Inicia sesion con email y password',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/CredentialsInput' },
						},
					},
				},
				responses: {
					'200': {
						description: 'Autenticacion exitosa',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/AuthResult' },
							},
						},
					},
					'400': { $ref: '#/components/responses/ValidationError' },
					'401': { $ref: '#/components/responses/UnauthorizedError' },
					'500': { $ref: '#/components/responses/ServerError' },
				},
			},
		},
		'/api/auth/register/creator': {
			post: {
				tags: ['Auth'],
				summary: 'Registra un nuevo usuario con rol CREATOR',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/CredentialsInput' },
						},
					},
				},
				responses: {
					'201': {
						description: 'Usuario creado y autenticado',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/AuthResult' },
							},
						},
					},
					'400': { $ref: '#/components/responses/ValidationError' },
					'409': { $ref: '#/components/responses/ConflictError' },
					'500': { $ref: '#/components/responses/ServerError' },
				},
			},
		},
		'/api/auth/register/donor': {
			post: {
				tags: ['Auth'],
				summary: 'Registra un nuevo usuario con rol DONOR',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/CredentialsInput' },
						},
					},
				},
				responses: {
					'201': {
						description: 'Usuario creado y autenticado',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/AuthResult' },
							},
						},
					},
					'400': { $ref: '#/components/responses/ValidationError' },
					'409': { $ref: '#/components/responses/ConflictError' },
					'500': { $ref: '#/components/responses/ServerError' },
				},
			},
		},
		'/api/auth/refresh-token': {
			post: {
				tags: ['Auth'],
				summary: 'Genera nuevos tokens a partir de un refresh token valido',
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/RefreshTokenInput' },
						},
					},
				},
				responses: {
					'200': {
						description: 'Tokens renovados',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/AuthResult' },
							},
						},
					},
					'400': { $ref: '#/components/responses/ValidationError' },
					'401': { $ref: '#/components/responses/UnauthorizedError' },
					'500': { $ref: '#/components/responses/ServerError' },
				},
			},
		},
	},
	components: {
		schemas: {
			HealthResponse: {
				type: 'object',
				properties: {
					status: { type: 'string', example: 'OK' },
					message: { type: 'string', example: 'Microservicio Identity profile funcionando' },
				},
			},
			CredentialsInput: {
				type: 'object',
				required: ['email', 'password'],
				properties: {
					email: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
					password: { type: 'string', format: 'password', example: 'MiPassword123' },
				},
			},
			RefreshTokenInput: {
				type: 'object',
				required: ['refreshToken'],
				properties: {
					refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
				},
			},
			PublicUser: {
				type: 'object',
				properties: {
					id: { type: 'string', example: 'c1a2b3d4-e5f6-7890-abcd-ef1234567890' },
					email: { type: 'string', format: 'email', example: 'usuario@ejemplo.com' },
					role: { type: 'string', enum: ['DONOR', 'CREATOR', 'COMPANY', 'ADMIN'], example: 'DONOR' },
					provider: { type: 'string', enum: ['LOCAL', 'GOOGLE', 'LINKEDIN'], example: 'LOCAL' },
					createdAt: { type: 'string', format: 'date-time' },
				},
			},
			AuthResult: {
				type: 'object',
				properties: {
					accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
					refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
					user: { $ref: '#/components/schemas/PublicUser' },
				},
			},
			ErrorResponse: {
				type: 'object',
				properties: {
					message: { type: 'string' },
				},
			},
		},
		responses: {
			ValidationError: {
				description: 'Datos de entrada invalidos',
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ErrorResponse' },
						example: { message: 'Debes enviar email y password como texto.' },
					},
				},
			},
			UnauthorizedError: {
				description: 'Credenciales o token invalidos',
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ErrorResponse' },
						example: { message: 'Credenciales invalidas.' },
					},
				},
			},
			ConflictError: {
				description: 'El recurso ya existe',
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ErrorResponse' },
						example: { message: 'El email ya esta registrado.' },
					},
				},
			},
			ServerError: {
				description: 'Error interno del servidor',
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ErrorResponse' },
						example: { message: 'Error interno del servidor.' },
					},
				},
			},
		},
	},
};
