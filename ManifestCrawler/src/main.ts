import { argv } from 'process'
import setupCluster from './setupCluster.js'

setupCluster('./input', Number(argv[2]))