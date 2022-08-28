SELECT score, "appID", name, "iconURL"
FROM (
    SELECT *, ts_rank_cd("App".tsv_search, to_tsquery("App".keywords)) AS score
    FROM (
		select *, (select concat(string_agg(word, ':*|'), ':*') as keywords from ts_stat(concat('SELECT tsv_search FROM core."App" WHERE "appID" = ', $1))) from core."App"
	) as "App"
) "Score"
WHERE score > 0 and "appID" != $1
ORDER BY score DESC
LIMIT 15;