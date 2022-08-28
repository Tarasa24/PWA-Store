SELECT 
	app."appID",
	app.name,
	app.description,
	app."iconURL",
	review.average AS "reviewAverage"
FROM core."App" app
LEFT JOIN (SELECT "appID", avg(rating) AS average FROM core."Review" GROUP BY "appID") review ON app."appID" = review."appID"
ORDER BY "reviewAverage" DESC NULLS LAST
LIMIT 15