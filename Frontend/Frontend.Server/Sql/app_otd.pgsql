SELECT
  CURRENT_DATE,
  "appID",
  name,
  description,
  "pageURL",
  "iconURL",
  trim("colorBg"),
  trim("colorTheme")
FROM core."App"
LIMIT 1
OFFSET MOD(
  ABS(hashtextextended(CAST(CURRENT_DATE AS TEXT), 0)),
  CAST((SELECT reltuples AS estimate FROM pg_class WHERE relname = 'App') AS BIGINT)
)