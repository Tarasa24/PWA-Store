SELECT score, "appID", name, "iconURL"
FROM 
	(SELECT "appID", name, "iconURL", ts_rank_cd(a.tsv_search, to_tsquery($1)) AS score
	FROM core."App" a
	WHERE a."appID" != $2) app
WHERE app.score > 0
ORDER BY score DESC
LIMIT 15
