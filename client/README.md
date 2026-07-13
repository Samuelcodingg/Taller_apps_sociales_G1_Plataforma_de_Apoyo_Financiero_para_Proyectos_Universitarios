# Client — arquitectura de microfrontends

El frontend es un monorepo de npm workspaces. Cada microfrontend (MFE) se
construye y despliega por separado, y el **shell** los compone en runtime con
**Module Federation** (`@originjs/vite-plugin-federation`).

| Paquete | Puerto | Rol | Rutas / dominio |
| --- | --- | --- | --- |
| `packages/mf-shell` | 8080 | Host: layout, providers y composición de rutas | `/`, `*` (404) |
| `packages/mf-shared` | 5001 | Design system + **estado compartido** (remote `./state`) | — |
| `packages/mf-auth` | 5002 | identity-profile-service | `/auth`, `/auth/validation`, `/profile` |
| `packages/mf-campaigns` | 5003 | campaign-core-service | `/explorar`, `/tendencias`, `/campana/:id`, `/crear`, `/dashboard`, `/guardados` |
| `packages/mf-donations` | 5004 | funding-payment-service | `/donations` |
| `packages/mf-admin` | 5005 | Panel de administración | `/admin` |

## Cómo encaja

Cada MFE de negocio **expone `./routes`**: un array de `RouteObject` de React
Router con sus propias rutas ya protegidas (usa los guards `RequireAuth` /
`RequireRole` de `mf-shared`). El shell los carga con `import("mf_auth/routes")`
y los monta con `useRoutes`. Si un remote está caído, el shell registra el error
y sigue funcionando sin esas rutas, en vez de romper toda la app.

`mf-shared` cumple dos papeles distintos:

1. **Librería de código fuente** (componentes shadcn/ui, helpers, tipos). Cada
   MFE la importa por alias `@/components/...` y la empaqueta en su bundle. No
   tiene estado, así que duplicarla es inofensivo.
2. **Remote de estado**: expone `./state` con el store de Redux, el `apiSlice`
   de RTK Query y el `authSlice`. Al venir de un único remote existe **una sola
   instancia** en runtime; el `<Provider>` del shell alimenta a todos los MFEs.
   Por eso `react`, `react-dom`, `react-redux`, `@reduxjs/toolkit` y
   `react-router-dom` están declarados como `singleton` en `mf.config.ts`.

Las páginas no cambiaron sus imports: los alias de `mf.config.ts` redirigen
`@/store/store`, `@/slices/*` y `@/services/baseQuery` al shim `src/state-remote.ts`
de cada MFE, que re-exporta lo que llega del remote `mf_shared/state`.

## Comandos

```bash
npm install          # una vez, en client/ (workspaces)
npm run dev          # levanta los 5 MFEs + el shell en http://localhost:8080
npm run build        # construye todos los paquetes
npm run preview      # sirve los builds (misma topología que dev)
npm test             # vitest (mf-shared)
```

Module Federation necesita que los **remotes estén construidos** para servir su
`remoteEntry.js`; por eso `npm run dev` corre cada MFE en `vite build --watch` +
`vite preview`, y solo el shell usa el dev server de Vite. Un MFE también corre
solo (`npm -w mf-auth run dev` y abrir su puerto): `src/standalone.tsx` monta sus
rutas con su propio Provider y router.

## Despliegue

**Un bucket S3 por microfrontend, una sola distribución CloudFront** que los
compone ([infra/cloudfront-s3.yml](infra/cloudfront-s3.yml)):

```
https://<tu-dominio>/                -> bucket del shell
https://<tu-dominio>/mf/campaigns/*  -> bucket de mf-campaigns
https://<tu-dominio>/mf/auth/*       -> bucket de mf-auth   (etc.)
```

Cada bucket es privado y solo CloudFront lo lee (OAC). Como CloudFront reenvía
la URI completa al origen, **cada bucket guarda sus objetos bajo la misma clave
que la ruta pública** (`mf/<nombre>/...`); no intentes subirlos a la raíz del
bucket o el behavior no los encontrará.

`.github/workflows/frontend.yml` tiene **un job de deploy por microfrontend**
(matriz calculada con `dorny/paths-filter`): un push que solo toca
`client/packages/mf-auth/**` construye y sube únicamente ese MFE. Dos
excepciones deliberadas, porque su código sí acaba dentro de los demás bundles:
un cambio en `mf-shared` o en la raíz del monorepo (`mf.config.ts`,
`package.json`, la infra) **redespliega todos**.

Los `remoteEntry.js` no llevan hash en el nombre (son el manifiesto de cada MFE),
así que se suben con `no-cache` y se invalida `/mf/<nombre>/*`: el shell toma la
versión nueva en el siguiente request, sin reconstruirse.

### Dominio propio

La plantilla acepta dos parámetros opcionales, que el workflow pasa desde las
*Variables* del repo/entorno en GitHub:

| Variable de GitHub | Ejemplo |
| --- | --- |
| `CF_DOMAIN_NAMES` | `creayni.com,www.creayni.com` |
| `ACM_CERTIFICATE_ARN` | `arn:aws:acm:us-east-1:...:certificate/...` |
| `CF_PRICE_CLASS` (opcional) | `PriceClass_All` (por defecto) |

El certificado **debe estar emitido en `us-east-1`** (CloudFront solo acepta esa
región, aunque el resto del stack viva en `us-east-2`). Con ambas definidas, la
distribución declara esos dominios como *alternate domain names* y sirve HTTPS
sobre ellos; tu DNS solo necesita un CNAME (o ALIAS en el apex) hacia el
`DistributionDomainName` que imprime el job de infra.

> **Cuidado:** estas variables son la única fuente de verdad del dominio. Si las
> dejas vacías, el siguiente deploy **quita los alternate domain names** de la
> distribución y tu dominio deja de resolver. No edites el dominio a mano en la
> consola de AWS: cámbialo aquí.
