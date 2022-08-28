SELECT 
	app.name,
	app.description,
	app.lang,
	author."authorID",
	author.name AS "authorName",
	app."pageURL",
	app."byteSize",
	app."iconURL",
	array_to_string(app.screenshots, ',') AS "screenshots",
	trim(app."colorBg") AS "colorBg",
	trim(app."colorTheme") AS "colorTheme",
	review.average AS "reviewAverage",
	coalesce(review.total, 0) AS "reviewTotal"
FROM core."App" app
LEFT JOIN core."Author" author ON app."authorID" = author."authorID"
LEFT JOIN (SELECT "appID", avg(rating) AS average, count("appID") AS total FROM core."Review" GROUP BY "appID") review ON app."appID" = review."appID"
WHERE app."appID" = $1;