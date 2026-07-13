-- Añade la justificación que el LLM (ai-analytics-service) genera para cada
-- campaña recomendada, de modo que el frontend pueda mostrar el "por qué".
--
-- Este repo no usa `prisma migrate` (el schema se mantiene a mano y se
-- introspecta con `prisma db pull`), así que este SQL se ejecuta manualmente
-- contra la base de datos antes de desplegar los cambios.

ALTER TABLE `user_recommendation`
  ADD COLUMN `reason` TEXT NULL AFTER `score`;
