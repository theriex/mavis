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
        stat = {zoomed:false, nuto:null, zwclickid:null};
    

    function pathToPoints (path) {
        var pts = [], commands = ["M", "L", "Z"], idx = 0;
        path = path.split(" ");
        while(idx < path.length) {
            if(commands.indexOf(path[idx]) >= 0) {
                idx += 1; }
            else {
                pts.push({x:+path[idx], y:+path[idx + 1]});
                idx += 2; } }
        return pts;
    }


    function boundingRectForPoints(pts) {
        var rect = {minx:10000, miny:10000, maxx:0, maxy:0};
        pts.forEach(function (pt) {
            rect.minx = Math.min(rect.minx, pt.x);
            rect.miny = Math.min(rect.miny, pt.y);
            rect.maxx = Math.max(rect.maxx, pt.x);
            rect.maxy = Math.max(rect.maxy, pt.y); });
        return rect;
    }


    function pathLabelPoint (dp, xp, yp) {
        var br, lp;
        dp.ppts = dp.ppts || pathToPoints(dp.path);
        dp.boundr = dp.boundr || boundingRectForPoints(dp.ppts); 
        br = dp.boundr;
        lp = {x:br.minx + (xp * (br.maxx - br.minx)),
              y:br.miny + (yp * (br.maxy - br.miny))};
        return lp;
    }


    function teamColor (dp) {
        var clo = {map:colors.pfill, txt:colors.pfill};
        switch(dp.name.trim().slice(-3)) {
        case "(D)": clo = colors.democrat; break;
        case "(R)": clo = colors.republican; break; }
        return clo;
    }


    function teamName (dp) {
        var tn = "Unknown";
        switch(dp.name.trim().slice(-3)) {
        case "(D)": tn = "Democrat"; break;
        case "(R)": tn = "Republican"; break; }
        return tn;
    }


    function legisType (dp) {
        var lt = "Unknown";
        switch(dp.cs) {
        case "H": lt = "Representative"; break;
        case "S": lt = "Senator"; break; }
        return lt;
    }


    function phoneLink (dp) {
        var html = "";
        if(dp.phone) {
            html = jt.tac2html(["a", {href:"tel:" + dp.phone}, dp.phone]); }
        return html;
    }


    function onlineContactLinks (dp) {
        var html = [], sms = {facebook:"socbwf.png",
                              twitter:"socbwt.png",
                              instagram:"socbwi.png"};
        if(dp.email) {
            html.push(["a", {href:"mailto:" + dp.email},
                       ["img", {src:"img/email.png", cla:"socmedi"}]]); }
        Object.keys(sms).forEach(function (key) {
            if(dp[key]) {
                html.push(["a", {href:dp[key], onclick:jt.fs("window.open('" + 
                                                             dp[key] + "')")},
                           ["img", {src:"img/" + sms[key], 
                                    cla:"socmedi"}]]); } });
        html = jt.tac2html(html);
        return html;
    }


    function titleCommittee (dp) {
        var txt = dp.positionTitle || "";
        if(dp.committeeName) {
            if(txt) {
                txt += " "; }
            if(dp.committeeType) {
                txt += dp.committeeType + " "; }
            txt += dp.committeeName; }
        return txt;
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
        //district labels seem like a good idea, but there is so little space
        //in the svg polygons that the labels clutter everything up.
        // dat.forEach(function (dp) {
        //     var lp = pathLabelPoint(dp, 0.3, 0.46);
        //     html.push(
        //         ["text", {id:idp + dp.id + "label", cla:"mavislabel",
        //                   onmouseover:jt.fs("mavisapp.hover('" + dp.id + "')"),
        //                   onmouseout:jt.fs("mavisapp.hover()"),
        //                   x:lp.x, y:lp.y},
        //          dp.district.split(" ")[0]]); });
        html = ["svg", {baseProfile:"tiny", width:size.w, height:size.h,
                        viewBox:"0 0 800 492", "stroke-linecap":"round", 
                        "stroke-linejoin":"round", id:idp + "mavissvg"},
                ["g", {id:idp + "mavisg"}, html]];
        return jt.tac2html(html);
    }


    function pathInRect (dp, filt) {
        var inter, pad = 2;
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


    function pointWithinPath (dp, point) {
        var inside = false, prevp = dp.ppts[dp.ppts.length - 1];
        if(dp.id === colors.currid) {
            //if hovering over this point, then include it.
            return true; }
        //Check if point is outside the bounding rectangle for the path.
        if(point.x < dp.boundr.minx || point.x > dp.boundr.maxx ||
           point.y < dp.boundr.miny || point.y > dp.boundr.maxy) {
            return false; }
        //Check how many times a ray emanating to the right from the point
        //would intersect the polygon.  An odd number of times means the
        //point lies inside the polygon.
        //https://www.codeproject.com/tips/84226/is-a-point-inside-a-polygon
        dp.ppts.forEach(function (pt) {
            var m, b, x;
            if((prevp.y > point.y) !== (pt.y > point.y)) { //have y cross.
                //Derive line equation (y = mx + b) and verify the ray
                //intersects it to the right by plugging in point.y and
                //comparing the result to point.x.
                m = (pt.y - prevp.y) / (pt.x - prevp.x);
                b = pt.y - (m * pt.x);
                x = (point.y - b) / m;
                if(point.x < x) {
                    inside = !inside; } } });
        return inside;
    }


    function filterTest (dp, filt) {
        if(!filt || !dp || !dp.boundr) {  //if filter data missing, let it go.
            return true; }
        if(filt.minx) {
            return pathInRect(dp, filt); }
        if(filt.x) {
            return pointWithinPath(dp, filt); }
        return false;
    }


    function namesFromDat (filt) {
        var html = [];
        dat.forEach(function (dp) {
            var fsty = "";
            if(dp.cs === "S") {
                fsty = "font-style:italic;"; }
            if(!filt || filterTest(dp, filt)) {
                html.push(
                    ["div", 
                     {id:dp.id + "name", cla:"mavisnamediv",
                      style:"background:" + textbg(dp) + ";" + fsty,
                      onmouseover:jt.fs("mavisapp.hover('" + dp.id + "')"),
                      onmouseout:jt.fs("mavisapp.hover()")},
                     ["a", {href:dp.url,
                            onclick:jt.fs("mavisapp.namesel('" + dp.id + "')")},
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
            pathLabelPoint(dp, 1.0, 1.0);  //verify dp.boundr set
            dims.svgw = Math.max(dims.svgw, dp.boundr.maxx);
            dims.svgh = Math.max(dims.svgh, dp.boundr.maxy); });
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
        dims.zf = 5;  //higher zoom does not increase point math accuracy
        dims.zsw = Math.round(dims.svbw * dims.zf);
        dims.zsh = Math.round(dims.svbh * dims.zf);
        //zoom indicator rect (green box)
        dims.ziw = Math.round((dims.zrw / dims.zsw) * dims.svgw);
        dims.zih = Math.round((dims.zrh / dims.zsh) * dims.svgh);
        dims.ziw50 = Math.round(0.5 * dims.ziw);
        dims.zih50 = Math.round(0.5 * dims.zih);
        dims.zib = 2;  //border width for indicator rect
        //profile display.  Look good on a phone, don't overtake big screen.
        dims.pdw = 310;
        dims.pdh = 240;
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


    function zwclick (event) {
        //Can't use SVGSVGElement.getIntersectionList() because there are
        //overlapping paths so not all are pointer event targets.
        var clickpt = {x:event.layerX / dims.zf,
                       y:event.layerY / dims.zf};
        // var circ = document.createElementNS("http://www.w3.org/2000/svg", 
        //                                     "circle");
        // circ.setAttribute("cx", clickpt.x);
        // circ.setAttribute("cy", clickpt.y);
        // circ.setAttribute("r", 2);
        // circ.setAttribute("style", "stroke:#000;fill:#000;");
        // jt.byId("zmavissvg").appendChild(circ);
        if(colors.currid && colors.currid === stat.zwclickid) {
            //same area clicked again, toggle filtering off and rebuild names
            stat.zwclickid = null;
            updateNamesList(); }
        else {
            stat.zwclickid = colors.currid;
            jt.out("mavisnamesdiv", namesFromDat(clickpt)); }
    }


    function init () {
        var zdiv, ndiv, pdiv;
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
        jt.on("maviszoomdiv", "click", zwclick);
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
        //set the profdisp size and display
        pdiv = jt.byId("mavisdetdiv");
        pdiv.style.width = dims.pdw + "px";
        pdiv.style.height = dims.pdh + "px";
        pdiv.style.display = "none";
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


    //The legislator url does not permit cross-origin framing, so any data
    //from there needs to be extracted and shown locally.
    function namesel (dpid) {
        var html, dp = dpdict[dpid];
        html = 
            ["div", {id:"profdispdiv"},
             [["div", {id:"profclosexdiv"},
               ["a", {href:"#close", onclick:jt.fs("mavisapp.closeprof()")},
                "x"]],
              ["div", {id:"profnamediv"},
               ["a", {href:dp.url, 
                      onclick:jt.fs("window.open('" + dp.url + "')")},
                dp.name.slice(0, -4)]],
              ["div", {id:"profbodydiv"},
               [["div", {id:"profpicdiv"},
                 ["img", {src:"img/profpic/" + dp.capic}]],
                ["div", {id:"profteamdiv"}, teamName(dp)],
                ["div", {id:"profposdiv"}, legisType(dp)],
                ["div", {id:"profdistdiv"}, dp.district || ""],
                ["div", {id:"profphonediv"}, phoneLink(dp)],
                ["div", {id:"profroomdiv"}, "Room " + (dp.room || "Unknown")],
                ["div", {id:"profolcont"}, onlineContactLinks(dp)],
                ["div", {id:"proftitlediv"}, titleCommittee(dp)]]]]];
        jt.out("mavisdetdiv", jt.tac2html(html));
        jt.byId("mavisdetdiv").style.display = "block";
    }


return {
    init: function () { init(); },
    hover: function (dpid) { hover(dpid); },
    namesel: function (dpid) { namesel(dpid); },
    zoomdisp: function () { zoomdisp(); },
    closeprof: function () { jt.byId("mavisdetdiv").style.display = "none"; }
};
}());
