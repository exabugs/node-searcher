args = commandArgs(trailingOnly=T)
infile  = args[1]
outfile = args[2]

data = read.table(infile, header=T, sep="\t", row.names=1)

data.cmd = cmdscale(dist(data))

write(t(data.cmd), outfile, ncolumn=2)
