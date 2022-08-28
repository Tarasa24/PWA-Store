SELECT
	ip,
	date,
	rating,
	body
FROM core."Review"
WHERE "appID" = $1
ORDER BY "date" DESC
LIMIT $2