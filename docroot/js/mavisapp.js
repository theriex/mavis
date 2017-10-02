var mavisapp = {}, //Global container for app level funcs and values
    jt = {};       //Global access to general utility methods

mavisapp = (function () {
    "use strict";

    var dat = null, 
        dpdict = null,
        colors = {pstroke:"#999", pfill:"#f8e6a0", phfill:"#ddc45f",
                 labh:"#f0e4b3"};
    

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


    function svgFromDat () {
        var html = [];
        dat.forEach(function (dp) {
            html.push(
                ["path", {id:dp.id + "path", cla:"mavispath",
                          style:"stroke:" + colors.pstroke + ";" +
                          "fill:" + colors.pfill + ";",
                          onmouseover:jt.fs("mavisapp.hover('" + dp.id + "')"),
                          onmouseout:jt.fs("mavisapp.hover()"),
                          d:dp.path}]); });
        dat.forEach(function (dp) {
            var lp = pathLabelPoint(dp.path, 0.3, 0.46);
            html.push(
                ["text", {id:dp.id + "label", cla:"mavislabel",
                          onmouseover:jt.fs("mavisapp.hover('" + dp.id + "')"),
                          onmouseout:jt.fs("mavisapp.hover()"),
                          x:lp.x, y:lp.y},
                 dp.district.split(" ")[0]]); });
        html = ["svg", {baseProfile:"tiny", width:"800", height:"492",
                        viewBox:"0 0 800 492", "stroke-linecap":"round", 
                        "stroke-linejoin":"round", id:"mavissvg"},
                ["g", {id:"mavisg"}, html]];
        return jt.tac2html(html);
    }


    function namesFromDat () {
        var html = []
        dat.forEach(function (dp) {
            html.push(
                ["div", {id:dp.id + "name", cla:"mavisnamediv",
                         onmouseover:jt.fs("mavisapp.hover('" + dp.id + "')"),
                         onmouseout:jt.fs("mavisapp.hover()")},
                 ["a", {href:dp.url,
                        onclick:jt.fs("mavisapp.select('" + dp.id + "')")},
                  dp.name.slice(0, -4)]]); });
        return jt.tac2html(html);
    }


    function initData (datarray) {
        dat = datarray;
        dpdict = {};
        dat.forEach(function (dp) {
            dpdict[dp.id] = dp; });
    }


    function init () {
        jtminjsDecorateWithUtilities(jt);
        initData(maviscon);
        jt.out("mavismapdiv", svgFromDat());
        jt.out("mavisnamesdiv", namesFromDat());
    }


    function hover (dpid) {
        dat.forEach(function (dp) {
            jt.byId(dp.id + "path").style.fill = colors.pfill;
            jt.out(dp.id + "label", dp.district.split(" ")[0]);
            jt.byId(dp.id + "name").style.background = "transparent"; });
        if(dpid) {
            jt.byId(dpid + "name").style.background = colors.labh;
            jt.out(dpid + "label", dpdict[dpid].district);
            jt.byId(dpid + "path").style.fill = colors.phfill; }
    }


    function select (dpid) {
        jt.log("selected " + dpdict[dpid].name);
    }


return {
    init: function () { init(); },
    hover: function (dpid) { hover(dpid); },
    select: function (dpid) { select(dpid); }
};
}());
