var datmerge = (function () {
    "use strict";

    var fs = require('fs'),
        readopt = {encoding:'utf8'},
        writeopt = {encoding:'utf8'},
        gvarn = "mavis";


    function readFeatures (dat) {
        var features = [];
        dat.features.forEach(function (feature) {
            var ft = {};
            Object.keys(feature.properties).forEach(function (key) {
                switch(key) {
                case "DIST_NUM": ft.dn = feature.properties[key]; break;
                case "DISTRICT": ft.district = feature.properties[key]; break;
                case "REP": 
                    ft.name = feature.properties[key]; ft.cs = "H"; break;
                case "SENATOR": 
                    ft.name = feature.properties[key]; ft.cs = "S"; break;
                case "URL": ft.url = feature.properties[key]; break; } });
            features.push(ft); });
        return features;
    }


    function cleanString (str) {
        var idx = str.indexOf("\r\n");
        if(idx > 0) {
            str = str.slice(0, idx); }
        return str;
    }


    function writeDataFile (paths, features) {
        var jst = "var " + gvarn + " = [";
        paths.forEach(function (path, idx) {
            features[idx].id = gvarn + "block" + idx;
            features[idx].path = path; });
        features.forEach(function (ft, idx) {
            if(idx) {
                jst += ",\n "; }
            jst += "{";
            Object.keys(ft).forEach(function (key, idx) {
                var val = ft[key];
                if(typeof val === "string") {
                    val = "\"" + cleanString(val) + "\""; }
                if(idx) {
                    jst += ", "; }
                jst += key + ":" + val; });
            jst += "}"; });
        jst += "];\n"
        fs.writeFileSync("docroot/js/" + gvarn + ".js", jst, writeopt);
    }


    function fixPath (path) {
        path = path.split(" ");
        if(!path[3].startsWith("L")) {
            path[3] = "L " + path[3]; }
        return path.join(" ");
    }


    function mergeFiles (svg, dat) {
        var text, paths = [], features;
        text = fs.readFileSync(svg, readopt);
        text.split("\n").forEach(function (line) {
            var pre = "<path d=\"";
            if(line.startsWith(pre)) {
                paths.push(fixPath(line.slice(pre.length, -3))); } });
        console.log(svg + " paths: " + paths.length);
        text = fs.readFileSync(dat, readopt);
        text = JSON.parse(text);
        features = readFeatures(text);
        console.log(dat + " features: " + features.length);
        gvarn += svg.slice(0, -4);
        writeDataFile(paths, features);
    }

    return {
        run: function (svg, dat) { mergeFiles(svg, dat); }
    };
}());

datmerge.run(process.argv[2], process.argv[3]);

