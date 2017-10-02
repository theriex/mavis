# mavis
Massachusetts Visualization

Download data from http://www.mass.gov/anf/research-and-tech/it-serv-and-support/application-serv/office-of-geographic-information-massgis/datalayers/cong113.html, unzip, import CONGRESSMA_POLY.shp into http://mapshaper.org/, simplify to 1.9%, fix as prompted, export to svg -> con.svg

If the shp2json command isn't recognized, install it:
```
sudo npm install -g shapefile
```

In the directory where all the files were unzipped (so that shp2json can
merge in useful data from CONGRESSMA_POLY.shp and such):
```
shp2json CONGRESSMA_POLY.shp -o con.json
```

node datmerge.js con.svg con.json

