cat output/CC*/part-* |\
sed -E -e 's/^(https?:\/\/)?([^:\/\n?]+)/\1\L\2/gm' |\
sed -E -e 's/^(http?:\/\/)/https:\/\//gm' |\
sort |\
uniq >\
../ManifestCrawler/input/potentional-pwas.txt
