/*global window jtminjsDecorateWithUtilities mavissen mavisrep */
/*jslint browser, multivar, white, fudge, for */

var mavisapp = {}; //Global container for app level funcs and values
var jt = {};       //Global access to general utility methods

mavisapp = (function () {
    "use strict";

    var dat = null, 
        dpdict = null,
        colors = {pstroke:"#999", pfill:"#fff", phfill:"#ffff00",
                  labh:"#f0e4b3", 
                  republican:{map:"#ff3333", txt:"#f4d0d0"}, 
                  democrat:{  map:"#3333ff", txt:"#dbdbff"}},
        dims = null,
        stat = {zoomed:false, nuto:null};
    

    function pathLabelPoint (path, xp, yp) {
        var lp = {minx:10000, miny:10000, maxx:0, maxy:0}, 
            idx = 0, commands = ["M", "L", "Z"];
        path = path.split(" ");
        while(idx < path.length) {
            if(commands.indexOf(path[idx]) >= 0) {
                idx += 1; }
            else {
                lp.cx = +path[idx];
                lp.cy = +path[idx + 1];
                lp.minx = Math.min(lp.minx, lp.cx);
                lp.miny = Math.min(lp.miny, lp.cy);
                lp.maxx = Math.max(lp.maxx, lp.cx);
                lp.maxy = Math.max(lp.maxy, lp.cy);
                idx += 2; } }
        lp.x = lp.minx + (xp * (lp.maxx - lp.minx));
        lp.y = lp.miny + (yp * (lp.maxy - lp.miny));
        return lp;
    }


    function teamColor (dp) {
        var clo = {map:colors.pfill, txt:colors.pfill};
        switch(dp.name.trim().slice(-3)) {
        case "(D)": clo = colors.democrat; break;
        case "(R)": clo = colors.republican; break; }
        return clo;
    }


    function pathColor (dp) {
        return teamColor(dp).map;
    }


    function textbg (dp) {
        return teamColor(dp).txt;
    }


    function svgFromDat (size) {
        var idp = size? "z" : "", html = [];
        size = size || {w:dims.svgw, h:dims.svgh};
        dat.forEach(function (dp) {
            html.push(
                ["path", {id:idp + dp.id + "path", cla:"mavispath",
                          style:"stroke:" + colors.pstroke + ";" +
                          "fill:" + pathColor(dp) + ";",
                          onmouseover:jt.fs("mavisapp.hover('" + dp.id + "')"),
                          onmouseout:jt.fs("mavisapp.hover()"),
                          d:dp.path}]); });
        dat.forEach(function (dp) {
            var lp = pathLabelPoint(dp.path, 0.3, 0.46);
            html.push(
                ["text", {id:idp + dp.id + "label", cla:"mavislabel",
                          onmouseover:jt.fs("mavisapp.hover('" + dp.id + "')"),
                          onmouseout:jt.fs("mavisapp.hover()"),
                          x:lp.x, y:lp.y},
                 dp.district.split(" ")[0]]); });
        html = ["svg", {baseProfile:"tiny", width:size.w, height:size.h,
                        viewBox:"0 0 800 492", "stroke-linecap":"round", 
                        "stroke-linejoin":"round", id:"mavissvg"},
                ["g", {id:"mavisg"}, html]];
        return jt.tac2html(html);
    }


    function pathInRect (dp, filt) {
        var inter, pad = 2;
        if(!filt || !dp || !dp.boundr) {  //if filtering badly defined, skip it
            return true; }
        //pad the filter all around to avoid including things where only the
        //edge is barely touching
        filt = {minx:filt.minx + pad,
                miny:filt.miny + pad,
                maxx:filt.maxx - pad,
                maxy:filt.maxy - pad};
        //compute the intersecting rect by taking the maximum of the minimum
        //points and the minimum of the maximum points
        inter = {maxofmin: {x:Math.max(dp.boundr.minx, filt.minx),
                            y:Math.max(dp.boundr.miny, filt.miny)},
                 minofmax: {x:Math.min(dp.boundr.maxx, filt.maxx),
                            y:Math.min(dp.boundr.maxy, filt.maxy)}};
        if(inter.maxofmin.x < inter.minofmax.x && 
           inter.maxofmin.y < inter.minofmax.y) {
            return true; }
        return false;
    }


    function namesFromDat (filt) {
        var html = [];
        dat.forEach(function (dp) {
            var fsty = "";
            if(dp.cs === "S") {
                fsty = "font-style:italic;"; }
            if(!filt || pathInRect(dp, filt)) {
                html.push(
                    ["div", 
                     {id:dp.id + "name", cla:"mavisnamediv",
                      style:"background:" + textbg(dp) + ";" + fsty,
                      onmouseover:jt.fs("mavisapp.hover('" + dp.id + "')"),
                      onmouseout:jt.fs("mavisapp.hover()")},
                     ["a", {href:dp.url,
                            onclick:jt.fs("mavisapp.select('" + dp.id + "')")},
                      dp.name.slice(0, -4)]]); } });
        return jt.tac2html(html);
    }


    function initData (datarray) {
        dat = datarray;
        dpdict = {};
        dat.forEach(function (dp) {
            dp.district = dp.district || "";
            dpdict[dp.id] = dp; });
    }


    function initDims () {
        dims = {svgw:0, svgh:0, pad:20,  //10px each side, see css
                divw:jt.byId("maviscontentdiv").offsetWidth,
                h:window.innerHeight};
        dat.forEach(function (dp) {
            dp.boundr = pathLabelPoint(dp.path, 1.0, 1.0);
            dims.svgw = Math.max(dims.svgw, dp.boundr.x);
            dims.svgh = Math.max(dims.svgh, dp.boundr.y); });
        dims.mult = dims.divw / dims.svgw;
        dims.svbw = dims.svgw;
        dims.svbh = dims.svgh;
        dims.svgw = Math.round(dims.svgw * dims.mult);
        dims.svgh = Math.round(dims.svgh * dims.mult);
        dims.w = dims.svgw;
        dims.mab = Math.round(0.54 * dims.svgh);
        dims.nmw = Math.round(0.57 * (dims.svgw - dims.pad));
        dims.nmh = dims.h - dims.mab - dims.pad;
        dims.nmh = Math.min(dims.nmh, dims.svgh);  //adjust for visual balance
        //zoom rect (display area for magnified svg)
        dims.zrw = dims.nmw;
        dims.zrh = dims.mab;
        //zoomed svg display (scrolling magnified svg)
        dims.zf = 5;  //zoom factor
        dims.zsw = Math.round(dims.svbw * dims.zf);
        dims.zsh = Math.round(dims.svbh * dims.zf);
        //zoom indicator rect (green box)
        dims.ziw = Math.round((dims.zrw / dims.zsw) * dims.svgw);
        dims.zih = Math.round((dims.zrh / dims.zsh) * dims.svgh);
        dims.ziw50 = Math.round(0.5 * dims.ziw);
        dims.zih50 = Math.round(0.5 * dims.zih);
        dims.zib = 2;  //border width for indicator rect
    }


    function zoomdisp (display) {
        if(display) {
            stat.zoomed = true;
            display = "block"; }
        else {
            stat.zoomed = false;
            display = "none"; }
        jt.byId("maviszoomdiv").style.display = display;
        jt.byId("maviszxdiv").style.display = display;
    }


    function updateNamesList () {
        if(stat.nuto) {  //already waiting to update names
            return; }
        stat.nuto = setTimeout(function () {
            jt.out("mavisnamesdiv", namesFromDat(
                {minx:Math.round(dims.zil / dims.mult),
                 miny:Math.round(dims.zit / dims.mult),
                 maxx:Math.round((dims.zil + dims.ziw) / dims.mult),
                 maxy:Math.round((dims.zit + dims.zih) / dims.mult)}));
            stat.nuto = null; }, 100);
    }


    // function debugShowCoordinates () {
    //     var zdiv = jt.byId("maviszoomdiv"),
    //         zrdiv = jt.byId("maviszrdiv");
    //     // zrdiv.innerHTML = dims.zsl + "," + dims.zst + 
    //     //     "<br/>" + zdiv.scrollLeftMax + "," + zdiv.scrollTopMax;
    //     // zrdiv.innerHTML = dims.zil + "," + dims.zit + 
    //     //     "<br/>" + (dims.svgw - dims.ziw) + "," + (dims.svgh - dims.zih);
    //     zrdiv.innerHTML = "x " + dims.zsl + "/" + dims.zsw + " = " + 
    //         "<br/>" + (dims.zsl / dims.zsw) + 
    //         "<br/>" + dims.zil + "/" + dims.svgw + 
    //         "<br/>" + (dims.zil / dims.svgw);
    // }


    function mapmm (event) {
        var zrdiv, cp = dims.zib + Math.round(0.5 * dims.pad);
        if(stat.zoomed || event.clientY > dims.svgh) {
            return; }
        dims.zil = event.clientX - cp - dims.ziw50;
        dims.zit = event.clientY - cp - dims.zih50;
        zrdiv = jt.byId("maviszrdiv");
        zrdiv.style.display = "block";
        zrdiv.style.left = dims.zil + "px";
        zrdiv.style.top = dims.zit + "px";
        dims.zsl = Math.round((dims.zil) / dims.mult) * dims.zf;
        dims.zst = Math.round((dims.zit) / dims.mult) * dims.zf;
        //debugShowCoordinates();
        updateNamesList();
    }


    function clickzoom (event) {
        var zdiv = jt.byId("maviszoomdiv");
        mapmm(event);
        zoomdisp(true);
        zdiv.scrollLeft = dims.zsl;
        zdiv.scrollTop = dims.zst;
    }


    function zwscroll () {
        var zdiv = jt.byId("maviszoomdiv"),
            zrdiv = jt.byId("maviszrdiv");
        //note scroll coordinates
        dims.zsl = zdiv.scrollLeft;
        dims.zst = zdiv.scrollTop;
        //translate into main display dimensions
        dims.zil = Math.round((dims.zsl / dims.zsw) * dims.svgw);
        dims.zit = Math.round((dims.zst / dims.zsh) * dims.svgh);
        //debugShowCoordinates();
        zrdiv.style.left = dims.zil + "px";
        zrdiv.style.top = dims.zit + "px";
        updateNamesList();
    }


    function init () {
        var zdiv, ndiv;
        jtminjsDecorateWithUtilities(jt);
        initData(mavissen.concat(mavisrep));
        initDims();
        jt.out("mavismapdiv", svgFromDat());
        jt.on("mavismapdiv", "mousemove", mapmm);
        jt.on("maviszrdiv", "mousemove", mapmm);
        jt.on("mavismapdiv", "click", clickzoom);
        jt.on("maviszrdiv", "click", clickzoom);
        //initialize the zoomed area display
        zdiv = jt.byId("maviszoomdiv");
        zdiv.style.left = "10px";  //pad to match name area
        zdiv.style.width = dims.zrw + "px";
        zdiv.style.height = dims.zrh + "px";
        zoomdisp(false);
        jt.out("maviszoomdiv", svgFromDat({w:dims.zsw, h:dims.zsh}));
        jt.out("maviszxdiv", jt.tac2html(
            ["a", {href:"#zoomdisp", onclick:jt.fs("mavisapp.zoomdisp()")},
             "x"]));
        jt.byId("maviszxdiv").style.left = (dims.zrw - 10) + "px";
        jt.on("maviszoomdiv", "scroll", zwscroll);
        //adjust the zoom indicator rect size
        zdiv = jt.byId("maviszrdiv");
        zdiv.style.width = dims.ziw + "px";
        zdiv.style.height = dims.zih + "px";
        //adjust the name listing area size and display
        ndiv = jt.byId("mavisnamesdiv");
        ndiv.style.top = dims.mab + "px";
        ndiv.style.height = dims.nmh + "px";
        ndiv.style.width = dims.nmw + "px";
        jt.out("mavisnamesdiv", namesFromDat());
    }


    function hover (dpid) {
        var namediv;
        colors.currid = "none";
        if(dpid) {
            colors.currid = dpid;
            namediv = jt.byId(dpid + "name");
            if(namediv) {
                namediv.style.background = colors.labh; }
            jt.byId(dpid + "path").style.fill = colors.phfill;
            jt.byId("z" + dpid + "path").style.fill = colors.phfill; }
        setTimeout(function () {
            dat.forEach(function (dp) {
                if(dp.id !== colors.currid) {
                    jt.byId(dp.id + "path").style.fill = pathColor(dp);
                    jt.byId("z" + dp.id + "path").style.fill = pathColor(dp);
                    namediv = jt.byId(dp.id + "name");
                    if(namediv) {
                        namediv.style.background = textbg(dp); }
                    } }); }, 10);
    }


    function select (dpid) {
        jt.log("selected " + dpdict[dpid].name);
    }


return {
    init: function () { init(); },
    hover: function (dpid) { hover(dpid); },
    select: function (dpid) { select(dpid); },
    zoomdisp: function () { zoomdisp(); }
};
}());
