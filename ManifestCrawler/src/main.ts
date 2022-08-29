import { argv } from 'process'
import setupCluster from './setupCluster.js'

setupCluster('./input', './output', Number(argv[2]))