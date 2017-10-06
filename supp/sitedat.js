var sitedat = (function () {
    "use strict";

    var fs = require('fs'),
        readopt = {encoding:'utf8'},
        writeopt = {encoding:'utf8'},
        vm = require('vm'),
        execSync = require('child_process').execSync,
        srcpath = "",  //path of data file to be processed
        gvn = "",  //global variable name of data in file being processed
        groot = "https://malegislature.gov",
        politeness = 12000,  //don't pummel the site with requests
        delay = 0,
        iteridx = 0,
        dat = null;


    function fetchPageForPoint (dp) {
        var path = dp.id + ".html", url, 
            ind = path + " (" + dp.name + ")";
        if(!dp.url) {
            console.log("No url for " + dp.id + " (" + dp.name + ")");
            return; }
        //fix old style URL to get content rather than redirect
        url = dp.url.replace("http://www.malegislature.gov/", groot + "/");
        dp.url = url;
        ind += " " + dp.url;
        if(!fs.existsSync(path)) {
            console.log("Fetching " + ind);
            delay = politeness;
            execSync("curl " + url + " > " + path); }
        else {
            console.log("Have " + ind); }
        return path;
    }


    function fetchImageForPoint (dp, hf) {
        var pd = "../docroot/img/profpic", html, idx, pu, pf;
        if(!fs.existsSync(pd)) {
            execSync("mkdir " + pd); }
        html = fs.readFileSync(hf, readopt);
        idx = html.indexOf(".jpg");
        if(idx > 0) {
            pu = html.slice(0, idx + 4);
            idx = pu.lastIndexOf("\"");
            pu = pu.slice(idx + 1);
            pu = groot + "/" + pu;
            dp.picurl = pu; }
        pf = pd + "/" + dp.id + ".jpg";
        if(!fs.existsSync(pf)) {
            console.log("Fetching " + dp.picurl);
            delay = politeness;
            execSync("curl " + dp.picurl + " > " + pf); }
        dp.capic = dp.id + ".jpg";
        return html;
    }


    function readDataForPoint (dp, html) {
        var txt, tag, idx;
        txt = html.match(/(\d\d\d-\d\d\d-\d\d\d\d)/);
        if(txt) {
            txt = txt[0];
            dp.phone = txt; }
        tag = "mailto:";
        idx = html.indexOf(tag);
        if(idx > 0) {
            txt = html.slice(idx + tag.length);
            txt = txt.slice(0, txt.indexOf("\""));
            dp.email = txt; }
        txt = html.match(/Room\s(\d+)/);
        if(txt) {
            txt = txt[1];
            dp.room = +txt; }
        txt = html.match(/class="subTitle">\S+\s+-\s+([^<]+)/);
        if(txt) {
            txt = txt[1];
            dp.district = txt; }
    }


    function writeUpdatedDataFile () {
        var jst = "var " + gvn + " = [";
        dat.forEach(function (dp, idx) {
            if(idx) {
                jst += ",\n"; }
            jst += "{";
            Object.keys(dp).forEach(function (key, idx) {
                var val = dp[key];
                if(typeof val === "string") {
                    val = "\"" + val + "\""; }
                if(idx) {
                    jst += ", "; }
                jst += key + ":" + val; });
            jst += "}"; });
        jst += "];\n";
        fs.writeFileSync(srcpath, jst, writeopt);
    }


    function mergeData () {
        var hf, dp, html;
        if(iteridx < dat.length) {
            dp = dat[iteridx];
            iteridx += 1;
            hf = fetchPageForPoint(dp);
            html = fetchImageForPoint(dp, hf);
            readDataForPoint(dp, html);
            setTimeout(mergeData, delay || 50); }
        else {
            writeUpdatedDataFile(); }
        delay = 0;
    }


    function mergeSiteData (datfilesrcpath) {
        var fc;
        srcpath = datfilesrcpath;
        gvn = srcpath.split("/");
        gvn = gvn[gvn.length - 1].slice(0, -3);
        fc = fs.readFileSync(srcpath, readopt);
        //append the global variable name to the source so it is returned
        //as the result and available for access
        dat = vm.runInThisContext(fc + gvn + ";");
        console.log(gvn + " length: " + dat.length);
        mergeData();
    }


    return {
        //example call: node sitedat.js ../docroot/js/mavissen.js
        run: function (datfilesrcpath) { mergeSiteData(datfilesrcpath); }
    };
}());

sitedat.run(process.argv[2]);

