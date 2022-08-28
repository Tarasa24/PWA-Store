#! /usr/bin/bash
ulimit -n 97816 # increase open file limit to avoid errors when running multiple instances (default is 1024)
for cc in `ls input/`; do
  ./ManifestFilter input/$cc output/$cc 500
done
