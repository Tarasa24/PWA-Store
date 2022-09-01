SELECT word
FROM ts_stat(concat('SELECT tsv_search FROM core."App" WHERE "appID" = ', $1))