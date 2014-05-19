args = commandArgs(trailingOnly=T)
infile  = args[1]
outfile = args[2]

data = read.table(infile, header=T, sep="\t", row.names=1)

library(MASS)

data.cmd = sammon(dist(data))$points

write(t(data.cmd), outfile, ncolumn=2)
