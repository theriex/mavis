var tabledat = (function () {
    "use strict";

    var fs = require('fs'),
        readopt = {encoding:'utf8'},
        writeopt = {encoding:'utf8'},
        vm = require('vm'),
        srcpath = "",  //path of data file to be processed
        gvn = "",  //global variable name of data in file being processed
        dat = null,
        tschema = "unknown";


    function parseLinkContent (html) {
        var txt = "";
        if(html && html.indexOf("<a") >= 0) {
            txt = html;
            txt = txt.slice(txt.indexOf("<a") + 1);
            txt = txt.slice(txt.indexOf(">") + 1);
            txt = txt.slice(0, txt.indexOf("<")); }
        return txt;
    }


    function parseMailLinkAddress (html) {
        var txt = "", match = html.toLowerCase().match(/<a .*mailto:([^"]+)/);
        if(match) {
            txt = match[1]; }
        return txt;
    }


    function parseLinkAddress (html) {
        var url = "", match = html.match(/<a .*href="([^"]+)/);
        if(match) {
            url = match[1];
            match = url.match(/http.*google.com\/url.*q=([^&]+)/);
            if(match) {
                url = match[1]; } }
        return url;
    }


    function parseRowData (tr, idx) {
        var row = {};
        tr.split("<td").forEach(function (td, idx) {
            td = td.slice(td.indexOf(">") + 1);
            td = td.slice(0, td.indexOf("</td>"));
            if(tschema === "sen") {
                switch(idx) {
                case 2: row.name = parseLinkContent(td); break;
                case 7: row.email = parseMailLinkAddress(td); break;
                case 8: row.twitter = parseLinkAddress(td); break;
                case 9: row.facebook = parseLinkAddress(td); break;
                case 10: row.website = parseLinkAddress(td); break;
                case 13: row.firstElected = td; break; } }
            else if(tschema === "rep") {
                switch(idx) {
                case 2: if(td) { row.progcauc = true; } break;
                case 3: row.name = parseLinkContent(td); break;
                case 8: row.email = parseMailLinkAddress(td); break;
                case 9: row.twitter = parseLinkAddress(td); break;
                case 10: row.facebook = parseLinkAddress(td); break;
                case 11: row.instagram = parseLinkAddress(td); break;
                case 13: row.website = parseLinkAddress(td); break;
                case 17: row.firstElected = td; break;
                case 18: row.positionTitle = td; break;
                case 19: row.committeeType = td; break;
                case 20: row.committeeName = td; break; } } });
        return row;
    }


    function rowMatchesDataPoint (row, dp) {
        var match = false;
        if(dp.email && row.email && 
           dp.email.toLowerCase() === row.email.toLowerCase()) {
            return true; }
        match = row.name.split(",").every(function (name) {
            return (dp.name.indexOf(name.trim()) >= 0); });
        return match;
    }


    function updateDataFromRow (row, idx) {
        var updated = 0;
        if(row.name) {  //ignore blank rows
            dat.forEach(function (dp) {
                if(rowMatchesDataPoint(row, dp)) {
                    updated = 1;
                    // console.log("matched row " + idx + ": " + row.name + 
                    //             " " + row.email);
                    if(row.progcauc) { dp.progcauc = row.progcauc; }
                    if(row.twitter) { dp.twitter = row.twitter; }
                    if(row.facebook) { dp.facebook = row.facebook; }
                    if(row.instagram) { dp.instagram = row.instagram; }
                    if(row.website) { dp.website = row.website; }
                    if(row.firstElected) { 
                        dp.firstElected = row.firstElected; } 
                    if(row.positionTitle) {
                        dp.positionTitle = row.positionTitle; }
                    if(row.committeeType) {
                        dp.committeeType = row.committeeType; }
                    if(row.committeeName) {
                        dp.committeeName = row.committeeName; } } }); }
        return updated;
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


    function mergeTable (tpath) {
        var uc = 0, fc;
        if(tpath.startsWith("sen")) {
            tschema = "sen"; }
        else if(tpath.startsWith("rep")) {
            tschema = "rep"; }
        fc = fs.readFileSync(tpath, readopt);
        fc = fc.split("<tr");
        fc.forEach(function (tr, idx) {
            if(tr.indexOf("<td") >= 0) {
                tr = parseRowData(tr, idx);
                uc += updateDataFromRow(tr, idx); } });
        if(uc) {
            writeUpdatedDataFile(); }
        console.log("Updated " + uc + " data points");
    }


    function mergeData (tpath, datpath) {
        var fc;
        srcpath = datpath;
        gvn = srcpath.split("/");
        gvn = gvn[gvn.length - 1].slice(0, -3);
        fc = fs.readFileSync(srcpath, readopt);
        //append the global variable name to the source so it is returned
        //as the result and available for access
        dat = vm.runInThisContext(fc + gvn + ";");
        console.log(gvn + " length: " + dat.length);
        mergeTable(tpath);
    }


    return {
        //node tabledat.js sentable.html ../docroot/js/mavissen.js
        run: function (tpath, datpath) { mergeData(tpath, datpath); }
    };
}());

tabledat.run(process.argv[2], process.argv[3]);

