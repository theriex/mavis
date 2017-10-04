# mavis
Massachusetts Visualization

You will need: 
  - node.js
  - shp2json command tool.  To install:
    ```
    sudo npm install -g shapefile
    ```

# State House Representatives

Download data from http://www.mass.gov/anf/research-and-tech/it-serv-and-support/application-serv/office-of-geographic-information-massgis/datalayers/house2012.html, unzip, import HOUSE2012_POLY.shp into http://mapshaper.org/, simplify to 1.9%, repair as prompted, export to svg -> rep.svg

In the unzip folder, so that shp2json can merge in useful data from the
associated .dbf file:
```
shp2json HOUSE2012_POLY.shp -o rep.json
```

Merge the svg and data to form maviscon.js combined source:
```
node datmerge.js rep.svg rep.json
```


# Other data

http://www.mass.gov/anf/research-and-tech/it-serv-and-support/application-serv/office-of-geographic-information-massgis/datalayers/cong113.html


