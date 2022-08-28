SELECT 
	author.name,
	review.average AS "reviewAverage",
	coalesce(review.total, 0) AS "reviewTotal"
FROM core."Author" author
LEFT JOIN (
  SELECT
    "appID",
    avg(rating) AS average,
    count("appID") AS total
  FROM core."Review" GROUP BY "appID"
  ) review ON review."appID" IN (SELECT "appID" FROM core."App" WHERE "authorID" = $1)
WHERE author."authorID" = $1