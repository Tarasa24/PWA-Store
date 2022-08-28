cat output/processed.txt | sort > input/processed.txt
comm -23 input/potentional-pwas.txt input/processed.txt | sponge input/potentional-pwas.txt
rm input/processed.txt