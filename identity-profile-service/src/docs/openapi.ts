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
		{ url: 'https://ywf61bjrme.execute-api.us-east-2.amazonaws.com', description: 'AWS (API Gateway)' },
		{ url: '/', description: 'Servidor actual' },
	],
	tags: [
		{ name: 'Health', description: 'Estado del servicio' },
		{ name: 'Auth', description: 'Autenticacion y registro de usuarios' },
		{ name: 'Profile', description: 'Gestion del perfil del usuario' },
		{ name: 'Verification', description: 'Verificacion de identidad (KYC)' },
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
		'/api/profile/me': {
			get: {
				tags: ['Profile'],
				summary: 'Obtiene el perfil del usuario autenticado',
				security: [{ bearerAuth: [] }],
				responses: {
					'200': {
						description: 'Perfil del usuario',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Profile' },
							},
						},
					},
					'401': { $ref: '#/components/responses/UnauthorizedError' },
					'404': { $ref: '#/components/responses/NotFoundError' },
					'500': { $ref: '#/components/responses/ServerError' },
				},
			},
			put: {
				tags: ['Profile'],
				summary: 'Actualiza el perfil del usuario autenticado',
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/UpdateProfileInput' },
						},
					},
				},
				responses: {
					'200': {
						description: 'Perfil actualizado',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Profile' },
							},
						},
					},
					'400': { $ref: '#/components/responses/ValidationError' },
					'401': { $ref: '#/components/responses/UnauthorizedError' },
					'404': { $ref: '#/components/responses/NotFoundError' },
					'500': { $ref: '#/components/responses/ServerError' },
				},
			},
		},
		'/api/verification/upload': {
			post: {
				tags: ['Verification'],
				summary: 'Envia la URL del documento KYC y crea una verificacion PENDING',
				security: [{ bearerAuth: [] }],
				requestBody: {
					required: true,
					content: {
						'application/json': {
							schema: { $ref: '#/components/schemas/UploadVerificationInput' },
						},
					},
				},
				responses: {
					'201': {
						description: 'Verificacion creada en estado PENDING',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/Verification' },
							},
						},
					},
					'400': { $ref: '#/components/responses/ValidationError' },
					'401': { $ref: '#/components/responses/UnauthorizedError' },
					'500': { $ref: '#/components/responses/ServerError' },
				},
			},
		},
		'/api/verification/status': {
			get: {
				tags: ['Verification'],
				summary: 'Devuelve el estado de verificacion del usuario autenticado',
				security: [{ bearerAuth: [] }],
				responses: {
					'200': {
						description: 'Estado de verificacion',
						content: {
							'application/json': {
								schema: { $ref: '#/components/schemas/VerificationStatus' },
							},
						},
					},
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
			SocialNetwork: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					platform: { type: 'string', example: 'LINKEDIN' },
					link: { type: 'string', example: 'https://linkedin.com/in/usuario' },
				},
			},
			Profile: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					accountId: { type: 'string' },
					names: { type: 'string', example: 'Diego' },
					surnames: { type: 'string', example: 'Linares' },
					birthDate: { type: 'string', format: 'date', nullable: true, example: '1999-05-20' },
					biography: { type: 'string', nullable: true },
					photoUrl: { type: 'string', nullable: true },
					country: {
						type: 'object',
						nullable: true,
						properties: { id: { type: 'string' }, name: { type: 'string', nullable: true } },
					},
					institution: {
						type: 'object',
						nullable: true,
						properties: { id: { type: 'string' }, name: { type: 'string' } },
					},
					socialNetworks: {
						type: 'array',
						items: { $ref: '#/components/schemas/SocialNetwork' },
					},
					updatedAt: { type: 'string', format: 'date-time' },
				},
			},
			UpdateProfileInput: {
				type: 'object',
				properties: {
					names: { type: 'string', example: 'Diego' },
					surnames: { type: 'string', example: 'Linares' },
					biography: { type: 'string', nullable: true },
					birthDate: { type: 'string', format: 'date', nullable: true, example: '1999-05-20' },
					photoUrl: { type: 'string', nullable: true },
					countryId: { type: 'string', nullable: true },
					institutionId: { type: 'string', nullable: true },
					socialNetworks: {
						type: 'array',
						description: 'Si se envia, reemplaza por completo las redes sociales del perfil.',
						items: {
							type: 'object',
							required: ['platform', 'link'],
							properties: {
								platform: { type: 'string', example: 'LINKEDIN' },
								link: { type: 'string', example: 'https://linkedin.com/in/usuario' },
							},
						},
					},
				},
			},
			UploadVerificationInput: {
				type: 'object',
				required: ['documentUrl'],
				properties: {
					documentUrl: {
						type: 'string',
						example: 'https://bucket.s3.amazonaws.com/docs/dni-123.pdf',
					},
					type: { type: 'string', example: 'KYC', default: 'KYC' },
				},
			},
			Verification: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					type: { type: 'string', example: 'KYC' },
					status: { type: 'string', example: 'PENDING' },
					documentUrl: { type: 'string' },
					rejectionReason: { type: 'string', nullable: true },
					reviewedAt: { type: 'string', format: 'date-time', nullable: true },
					createdAt: { type: 'string', format: 'date-time' },
				},
			},
			VerificationStatus: {
				type: 'object',
				properties: {
					status: {
						type: 'string',
						enum: ['NOT_SUBMITTED', 'PENDING', 'APPROVED', 'REJECTED'],
						example: 'PENDING',
					},
					type: { type: 'string', nullable: true, example: 'KYC' },
					rejectionReason: { type: 'string', nullable: true },
					reviewedAt: { type: 'string', format: 'date-time', nullable: true },
					createdAt: { type: 'string', format: 'date-time', nullable: true },
				},
			},
		},
		securitySchemes: {
			bearerAuth: {
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
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
			NotFoundError: {
				description: 'El recurso no existe',
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/ErrorResponse' },
						example: { message: 'El perfil del usuario no existe.' },
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
