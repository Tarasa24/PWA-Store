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
ORDER BY "appID"
LIMIT 1
OFFSET MOD(
  ABS(hashtextextended(CAST(CURRENT_DATE AS TEXT), 0)),
  CAST((SELECT count("appID") FROM core."App") AS BIGINT)
)