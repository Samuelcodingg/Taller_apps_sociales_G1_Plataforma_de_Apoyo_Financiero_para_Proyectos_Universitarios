# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexto

`identity-profile-service` es el microservicio de identidad y autenticación del monorepo (una plataforma de apoyo financiero / crowdfunding para proyectos universitarios). La raíz del repo git está un nivel arriba (`../`) y también contiene `client/`. Todos los comandos asumen que estás dentro de `identity-profile-service/`.

El servicio es una API en TypeScript + Express 5 que corre tanto como servidor Node como función AWS Lambda (vía `serverless-http`). Persistencia en MySQL/MariaDB (RDS) a través de Prisma con el **driver adapter de MariaDB** (no el engine por defecto).

## Comandos

```bash
npm run dev              # servidor local con recarga en caliente (ts-node-dev) — src/server.ts
npm run build            # compila TypeScript a dist/ (tsc)
npm start                # ejecuta el build (node dist/server.js)
npm test                 # jest (pasa aunque no haya tests: --passWithNoTests)
npm run test:watch       # jest en modo watch
npm run offline          # corre el handler Lambda localmente (serverless-offline)
npm run prisma:generate  # regenera el cliente Prisma tras cambios en el schema
npm run prisma:migrate   # crea/aplica una migración de desarrollo
```

Ejecutar un solo test: `npx jest ruta/al/archivo.test.ts` o `npx jest -t "nombre del test"`.

Los tests viven en la carpeta `test/` en la raíz (espejo de `src/`, p. ej. `test/feature/Profile/...`) e importan el código bajo prueba con rutas relativas a `src/`. `jest.config.js` fija `roots: ["<rootDir>/test"]`. Son **unitarios sobre los casos de uso** (capa `application/`) usando repositorios falsos que implementan los puertos del dominio — no tocan la BD. `tsconfig.json` declara `types: ["node","jest"]` para los globals de Jest; `test/` queda fuera del `include` del build, así que no se emite a `dist/`.

`DATABASE_URL` debe estar en `.env` (se lee vía `dotenv`). Otras variables: `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL_SECONDS`, `JWT_REFRESH_TTL_SECONDS`, `PORT`. Todas tienen defaults inseguros para desarrollo local en `src/shared/config/index.ts` — los secretos JWT **deben** definirse en despliegues reales.

## Arquitectura

### Tres puntos de entrada, una sola app
- `src/app.ts` — construye la `app` de Express (CORS, JSON, `/api/health`, Swagger en `/api/docs` y `/api/docs.json`, monta los routers de feature bajo `/api/...`). Única fuente de verdad del enrutamiento.
- `src/server.ts` — arranca `app` como servidor HTTP (usado por `dev`/`start`).
- `src/lambda.ts` — envuelve `app` con `serverless-http` y exporta `handler`. El `httpApi: '*'` desplegado enruta todo a esta función.

Al agregar una feature, conecta su router en `src/app.ts`; los tres entrypoints lo recogen.

### Estructura hexagonal por features (puertos y adaptadores)
Cada feature vive en `src/feature/<Nombre>/` (actualmente solo `IdentityProfile`) con estas capas:
- `domain/` — entidades, value objects (`Email`, `Password`, `Role`) y **puertos**: `IAuthRepository`, `ITokenService`, `IOAuthProvider`. Sin imports de framework ni de BD.
- `application/` — casos de uso (uno por clase: `LoginUser`, `RegisterCreator`, `RegisterDonor`, `RefreshToken`). Cada uno con `execute(input)`, depende solo de puertos (inyección por constructor) y traduce errores a los tipados de `src/shared/errors` (`ValidationError`→400, `ConflictError`→409, `UnauthorizedError`→401).
- `infrastructure/` — **adaptadores** que implementan los puertos: `AuthRepository` (Prisma), `BcryptService`, `JwtService`, `GoogleOAuth`/`LinkedInOAuth`.
- `entrypoints/HttpController.ts` — adaptador primario; mapea `req`/`res` a casos de uso y centraliza el mapeo de errores HTTP en `handleError`.
- `index.ts` — **raíz de composición**: instancia adaptadores, los inyecta en casos de uso, inyecta casos de uso en el controlador y define las rutas Express. No hay contenedor de DI.

Sigue este patrón para nuevas features: puertos en `domain/`, casos de uso contra los puertos en `application/`, adaptadores concretos en `infrastructure/`, controlador en `entrypoints/`, y ensamblado en `index.ts`.

Features actuales (todas montadas en `src/app.ts`):
- `IdentityProfile` → `/api/auth` — registro (donor/creator), login, refresh token. **Rutas públicas.**
- `Profile` → `/api/profile` — `GET/PUT /me` del perfil del usuario autenticado (incluye país, institución y redes sociales). **Rutas protegidas.**
- `Verification` → `/api/verification` — `POST /upload` (crea verificación KYC en estado `PENDING`) y `GET /status`. **Rutas protegidas.** Tras guardar en BD, `UploadVerification` dispara de forma asíncrona un evento a **AWS SQS** (`SqsVerificationEventPublisher`, puerto `IVerificationEventPublisher`) con `{ verificationId, accountId, documentUrl }` para el futuro servicio de IA. El publicador es **opcional** y los fallos de envío se capturan y loguean: el endpoint devuelve `201` igual porque el documento ya quedó persistido. Requiere `VERIFICATION_QUEUE_URL` (la cola se crea en `serverless.deploy.yml` → `resources`, y el permiso `sqs:SendMessage` está en `provider.iam`).

`src/shared/` es el kernel compartido:
- `config/` — lectura centralizada de `process.env` + `assertDatabaseUrl`.
- `errors/` — errores de aplicación tipados (`ValidationError`→400, `ConflictError`→409, `UnauthorizedError`→401, `NotFoundError`→404). El mapeo HTTP vive en el `handleError` de cada `HttpController` (no hay middleware de errores central).
- `http/authMiddleware.ts` — `createAuthMiddleware(verifier)`: valida el access token Bearer y expone `req.auth` (`userId`/`email`/`role`). Las features protegidas lo cablean en su `index.ts` pasando un `JwtService`. El tipo `Request.auth` se aumenta en `http/express.d.ts`.

**Autenticación en rutas protegidas:** el caso de uso recibe el `accountId` que el controlador extrae de `req.auth.userId` (puesto por el middleware). Nunca confíes en un id del body para identificar al usuario.

**Registro crea el perfil:** `AuthRepository.createAccountWithRole` inserta, en la misma transacción que `account` + `account_roles`, un registro inicial básico en `profile` (con `names`/`surnames` vacíos y UUID propio). No dupliques esa creación en otra capa.

### Base de datos — la BD manda, el schema se introspecta
El schema (`prisma/schema.prisma`) se genera por **introspección** (`prisma db pull`) desde la BD real; **no hay directorio `prisma/migrations`** y la BD es la fuente de verdad. Si cambias el modelo, hazlo primero en la BD y vuelve a correr `prisma db pull` + `prisma generate` — no asumas que puedes migrar desde el schema. La configuración de Prisma (ruta del schema, URL del datasource) está en `prisma.config.ts`.

**Gotchas importantes del modelo real (no obvios desde el código de dominio):**
- `account.id` es **UUID `Char(36)`**, no autoincremental. Hay que generar el id (`randomUUID()`) al crear cuentas.
- **No existe columna `role` en `account`.** El rol vive en la tabla puente `account_roles` → `roles` (relación N–N). `AuthRepository` carga la cuenta con `include: { account_roles: { include: { roles: true } } }` y mapea el nombre del rol al dominio; al registrar, crea la fila en `account_roles` dentro de una transacción.
- La tabla `roles` solo contiene `CREATOR` y `DONOR`. El enum `Role` del dominio incluye además `COMPANY`/`ADMIN`, pero registrar con esos roles fallará porque no existen en la BD.
- Las PK son UUID `Char(36)` **sin default ni autoincrement** en toda la BD. Al insertar (`profile`, `social_network`, `verification`, etc.) hay que generar el id con `randomUUID()`. Varias columnas `*_at` (`updated_at`, `created_at`) son `NOT NULL` sin default → asígnalas explícitamente.
- `Profile` tiene relación N–1 con `Account` en el schema (la FK no es única), por eso el repositorio usa `findFirst({ where: { accountId } })`. La feature `Profile` carga `country`, `institution` y `social_network`; al actualizar redes sociales usa **reemplazo total** (`deleteMany` + `createMany`) dentro de una transacción.

`AuthRepository` construye `new PrismaClient({ adapter })` con `PrismaMariaDb(DATABASE_URL)`, pero acepta un `PrismaClient` inyectado opcional (úsalo en tests).

### Despliegue
- `serverless.yml` es para uso local (`serverless-offline`); `serverless.deploy.yml` es la config de CI/despliegue (descarta binarios del engine de Prisma salvo el query engine `rhel-openssl-3.0.x` para reducir el tamaño del paquete Lambda). El `binaryTargets` del schema incluye `rhel-openssl-3.0.x` por esto. Despliegues: `nodejs20.x`, región `us-east-2`.
- `serverless.deploy.yml` **no define `timeout`**, por lo que usa el default de 6 s — súbelo si la BD tarda en responder en cold start.
- El `Dockerfile` ofrece despliegue alternativo en contenedor (`node:20-alpine`).

## Documentación de la API
La spec OpenAPI 3.0 está en `src/docs/openapi.ts` (mantenida a mano) y se sirve con `swagger-ui-express` en `GET /api/docs` (UI) y `GET /api/docs.json` (JSON crudo). Al agregar/cambiar endpoints, actualiza ese archivo.
