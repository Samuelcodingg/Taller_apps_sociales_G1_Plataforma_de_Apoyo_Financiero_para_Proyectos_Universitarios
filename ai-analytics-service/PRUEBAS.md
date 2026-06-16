# Guía de pruebas — Flujo KYC (identity-profile-service ➜ SQS ➜ ai-analytics-service)

Esta guía te lleva paso a paso para probar el flujo completo de verificación KYC:
un usuario sube un documento, Node lo guarda y publica un evento en SQS, y la
Lambda de Python lo analiza con Gemini y actualiza el estado en MariaDB.

> **Recuerda:** el `ai-analytics-service` (Python) **NO tiene endpoint HTTP**. Es un
> consumidor de SQS. Postman se usa contra el `identity-profile-service` (Node),
> que es el productor. El resultado de la IA se verifica en **CloudWatch** y **MariaDB**,
> no en la respuesta de Postman.

Stage actual de pruebas: **`dev`** (cola `sembramos-kyc-queue-dev`, región `us-east-2`).

---

## 0. Requisitos previos

- [ ] Postman instalado.
- [ ] URL base del `identity-profile-service-qas` desplegado (API Gateway), p. ej.
      `https://xxxxx.execute-api.us-east-2.amazonaws.com`. La encuentras en la salida
      del deploy de Serverless de ese servicio o en API Gateway en la consola AWS.
- [ ] Acceso a la consola AWS (CloudWatch, SQS) en la cuenta `676480496543`, región **Ohio (us-east-2)**.
- [ ] Una URL pública de un documento de prueba (PDF o imagen de un carnet) accesible por internet,
      porque la Lambda lo descarga desde `documentUrl`. Puede ser un enlace de Drive público,
      S3 público, o cualquier URL directa al archivo.

---

## Parte A — Prueba end-to-end (la importante)

### Paso 1 — Registrar / loguear un usuario y obtener el token

Las rutas de verificación están protegidas: necesitas un **access token** JWT.

**Opción registro (si no tienes usuario):**

```
POST  {{baseUrl}}/api/auth/register/donor
Content-Type: application/json

{
  "email": "test-kyc@correo.com",
  "password": "Password123!"
}
```

Respuesta `201` con un objeto que incluye el access token (y refresh token).

**Opción login (si ya tienes usuario):**

```
POST  {{baseUrl}}/api/auth/login
Content-Type: application/json

{
  "email": "test-kyc@correo.com",
  "password": "Password123!"
}
```

Respuesta `200`. **Copia el access token** del cuerpo de la respuesta (campo del tipo
`accessToken` / `token`). Lo usarás en el header `Authorization` del siguiente paso.

> Tip Postman: guarda `baseUrl` y `accessToken` como variables de entorno para reutilizarlos.

---

### Paso 2 — Subir el documento (dispara el flujo)

```
POST  {{baseUrl}}/api/verification/upload
Content-Type: application/json
Authorization: Bearer {{accessToken}}

{
  "documentUrl": "https://URL-PUBLICA-DE-TU-DOCUMENTO.pdf",
  "type": "KYC"
}
```

**Resultado esperado:** `201 Created` casi inmediato, con la verificación creada en estado
`PENDING`. **Anota el `id` (verificationId)** que devuelve: lo usarás para rastrear el resto del flujo.

Qué pasó por debajo:
1. Node guardó el registro en MariaDB con estado `PENDING`.
2. Node publicó en SQS `{ verificationId, accountId, documentUrl }`.
3. La cola despierta a la Lambda de Python.

> Si recibes `400`: falta `documentUrl`. Si recibes `401`: el token falta, está mal o expiró
> (repite el Paso 1).

---

### Paso 3 — Confirmar que el mensaje entró a la cola (opcional)

Consola AWS → **SQS** → `sembramos-kyc-queue-dev` → pestaña de monitoreo.

- "Mensajes recibidos" debería incrementarse tras el Paso 2.
- "Mensajes disponibles" debería volver a **0** en segundos (la Lambda lo consumió).
  Si se queda > 0 o crece, la Lambda no está consumiendo (ver Parte C).

---

### Paso 4 — Verificar el trabajo de la IA en CloudWatch

Consola AWS → **Lambda** → `ai-analytics-service-dev-processKyc` → **Monitor** → **View CloudWatch logs**
→ abre el log stream más reciente.

Deberías ver, en orden:
- `Recibidos 1 mensajes SQS`
- la descarga del documento,
- la llamada a Gemini y la extracción (nombre, apellidos, código de estudiante),
- la actualización del registro.

Si ves un **traceback / `Fallo procesando mensaje SQS`**, anótalo: ahí está la causa real
(ver la sección de problemas conocidos abajo).

---

### Paso 5 — Verificar el estado final

**Opción A — Endpoint de status (Node):**

```
GET  {{baseUrl}}/api/verification/status
Authorization: Bearer {{accessToken}}
```

El estado debe haber cambiado de `PENDING` a `APPROVED` o `REJECTED`.

**Opción B — MariaDB directo:** consulta la tabla `verification` por el `id` del Paso 2 y
revisa la columna `status` (y los datos estructurados que extrajo Gemini, si se guardan).

✅ **Prueba exitosa:** `PENDING` ➜ `APPROVED`/`REJECTED`, sin errores en CloudWatch, cola en 0.

---

## Parte B — Probar SOLO la Lambda (sin pasar por Node)

Útil para aislar el servicio de IA o si aún no tienes la URL del servicio de Node.

### B.1 — Enviar un mensaje a la cola desde la consola

Consola AWS → **SQS** → `sembramos-kyc-queue-dev` → **Enviar y recibir mensajes** →
en **Cuerpo del mensaje** pega exactamente el formato que produce Node:

```json
{
  "verificationId": "<id-de-una-verificacion-existente>",
  "accountId": "<account-id>",
  "documentUrl": "https://URL-PUBLICA-DE-TU-DOCUMENTO.pdf"
}
```

→ **Enviar mensaje**. Esto dispara la Lambda igual que en producción.

### B.2 — Alternativa por CloudShell / AWS CLI

```bash
aws sqs send-message \
  --queue-url https://sqs.us-east-2.amazonaws.com/676480496543/sembramos-kyc-queue-dev \
  --message-body '{"verificationId":"<id>","accountId":"<acc>","documentUrl":"https://...pdf"}' \
  --region us-east-2
```

Luego revisa CloudWatch (Paso 4) y MariaDB (Paso 5) igual que en la Parte A.

---

## Parte C — Problemas conocidos y qué revisar

### ⚠️ Posible incompatibilidad de tipos en el ID (revísalo en CloudWatch)

El `identity-profile-service` usa **UUID (`Char(36)`)** para los IDs de cuenta y verificación
(ver su `CLAUDE.md`). Pero el DTO de Python (`application/dtos.py`) hace:

```python
verification_id=int(verification_id)
account_id=int(account_id) ...
```

`int("una-uuid-con-guiones")` lanza `ValueError`, por lo que el mensaje fallaría y SQS lo
reintentaría hasta mandarlo a la DLQ. **Si en el Paso 4 ves un error tipo
`invalid literal for int()`**, esta es la causa: el productor manda UUIDs y el consumidor
espera enteros. Solución: ajustar `ProcessKycCommand` para tratar los IDs como `str`
(y el repositorio/consultas en consecuencia). No lo toques aún si no te aparece el error;
solo tenlo presente como primer sospechoso.

### Otros síntomas

| Síntoma | Dónde mirar | Causa probable |
|---|---|---|
| `401` en `/upload` | Postman | Token ausente/expirado → repite Paso 1 |
| `400` en `/upload` | Postman | Falta `documentUrl` en el body |
| Mensajes se acumulan en SQS | SQS monitor | La Lambda no consume / el EventSourceMapping está deshabilitado |
| `int()` ValueError | CloudWatch | UUID vs int (ver arriba) |
| Error descargando documento | CloudWatch | `documentUrl` no es pública / no es descarga directa |
| Error de Gemini / API key | CloudWatch | `GEMINI_API_KEY` mal configurada en el deploy |
| Timeout / mensaje reprocesado | CloudWatch | Procesamiento > visibility timeout de la cola |

---

## Checklist rápido

- [ ] Paso 1: obtuve access token (`200`/`201`).
- [ ] Paso 2: `POST /upload` devolvió `201` y anoté el `verificationId`.
- [ ] Paso 3: el mensaje entró y salió de la cola.
- [ ] Paso 4: CloudWatch muestra el procesamiento sin errores.
- [ ] Paso 5: el estado pasó a `APPROVED`/`REJECTED`.
