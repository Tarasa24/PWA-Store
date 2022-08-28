SELECT 
  app.score,
  app."appID",
  app.name,
  app.description,
  app."iconURL",
  review.average AS "reviewAverage"
FROM (
    SELECT *, ts_rank_cd(app.tsv_search, to_tsquery(replace($1, ' ', '|'))) AS score
    FROM core."App" app
) app
LEFT JOIN (SELECT "appID", avg(rating) AS average FROM core."Review" GROUP BY "appID") review ON app."appID" = review."appID"
WHERE score > 0
ORDER BY score DESC;