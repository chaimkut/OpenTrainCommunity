!function(){var t=angular.module("RouteExplorer",["ngRoute","ui.bootstrap","ui.bootstrap.buttons"]);t.constant("env",{baseDir:"/static/ui/RouteExplorer"}),t.config(["$routeProvider","env",function(t,e){var r=function(t){return e.baseDir+"/tpls/"+t+".html"};t.when("/",{pageId:"welcome",templateUrl:r("SelectStops"),controller:"SelectStopsController",resolve:{Layout:"Layout"}}).when("/about",{pageId:"about",templateUrl:r("About")}).when("/:period/select-route/:origin/:destination",{pageId:"routes",templateUrl:r("SelectRoute"),controller:"SelectRouteController",resolve:{Layout:"Layout"}}).when("/:period/routes/:routeId",{pageId:"route",templateUrl:r("RouteDetails"),controller:"RouteDetailsController",resolve:{Layout:"Layout"},reloadOnSearch:!1}).otherwise({redirectTo:"/"})}])}(),String.prototype.repeat||(String.prototype.repeat=function(t){"use strict";if(null===this)throw new TypeError("can't convert "+this+" to object");var e=""+this;if(t=+t,t!=t&&(t=0),0>t)throw new RangeError("repeat count must be non-negative");if(t==1/0)throw new RangeError("repeat count must be less than infinity");if(t=Math.floor(t),0===e.length||0===t)return"";if(e.length*t>=1<<28)throw new RangeError("repeat count must not overflow maximum string size");for(var r="";1==(1&t)&&(r+=e),t>>>=1,0!==t;)e+=e;return r}),angular.module("RouteExplorer").controller("AppController",["$scope","$location",function(t,e){t.share=function(t){var r=t+encodeURIComponent("http://otrain.org/#"+e.url());window.open(r,"sharePopup","width=600,height=550,top=100,left=100,location=no,scrollbar=no,status=no,menubar=no")},t.$on("$routeChangeSuccess",function(e,r){t.bodyClass=r.pageId?"rex-page-"+r.pageId:null})}]),angular.module("RouteExplorer").controller("RouteDetailsController",["$scope","$route","$http","$location","LocationBinder","Layout","Locale","TimeParser",function(t,e,r,o,n,i,a,u){function l(t,e){return t=t||"all",e=e||"all",D[t]&&D[t][e]?D[t][e]:null}function s(){var e=l(t.selectedDay,t.selectedTime);return e?e.stops:[]}function c(e){t.times=[];var r={};for(var o in e){var n=e[o],i="all"==n.info.hours?"all":n.info.hours[0]+"-"+n.info.hours[1],a=n.info.week_day;if(D[a]||(D[a]={}),D[a][i]=n,"all"!=i&&!r[i]){var u={id:i,from:d(n.info.hours[0]),to:d(n.info.hours[1])};r[i]=u,t.times.push(u)}}}function d(t){return("0"+t%24).slice(-2)+":00"}function f(t){return a.months[t.getMonth()].name+" "+t.getFullYear()}function p(t,e){var r=new Date(t);return r.setMonth(r.getMonth()+e),r}function m(t,e){return size=12*(t.to.getFullYear()-t.from.getFullYear())+t.to.getMonth()-t.from.getMonth()+1,{from:p(t.from,size*e),to:p(t.to,size*e),end:p(t.end,size*e)}}var g=e.current.params,h=u.parsePeriod(g.period),v=h.from,b=h.end,R=g.routeId,y=i.findRoute(R).stops,D={};t.loaded=!1,t.stopIds=y,t.origin=y[0],t.destination=y[y.length-1],t.selectedPeriod=f(h.from),h.to>h.from&&(t.selectedPeriod+=" — "+f(h.to)),t.selectedDay=null,t.days=a.days,t.selectedTime=null,t.times=[],t.selectRouteUrl="#/"+g.period+"/select-route/"+t.origin+"/"+t.destination;var w=m(h,-1),x=m(h,1),P=i.getRoutesDateRange();t.previousPeriodUrl=P.min<w.from?"#/"+u.formatPeriod(w)+"/routes/"+R:null,t.nextPeriodUrl=P.max>x.to?"#/"+u.formatPeriod(x)+"/routes/"+R:null,r.get("/api/route-info-full",{params:{route_id:R,from_date:v.getTime(),to_date:b.getTime()}}).success(function(e){c(e),t.loaded=!0}),n.bind(t,"selectedDay","day",function(t){return t?Number(t):null}),n.bind(t,"selectedTime","time"),t.stopStats=function(t){var e=s();for(var r in e)if(e[r].stop_id==t)return e[r];return null},t.stopName=function(t){var e=i.findStop(t);return e?e.name:null},t.isDayEmpty=function(t){var e=t.id,r=D[e];if(!r)return!0;for(var o in r)if(r[o].info.num_trips>0)return!1;return!0},t.isTimeEmpty=function(e){var r=t.selectedDay||"all",o=e.id,n=D[r]&&D[r][o];return n&&n.info.num_trips>0?!1:!0},t.tripCount=function(t,e){var r=l(t,e);return r?r.info.num_trips:0}}]),angular.module("RouteExplorer").controller("SelectRouteController",["$scope","$http","$location","$route","Layout","TimeParser",function(t,e,r,o,n,i){function a(t){return("0"+t%24).slice(-2)+":00"}function u(e){t.times=[];var r={};for(var o in e){var n=e[o],i="all"==n.info.hours?"all":n.info.hours[0]+"-"+n.info.hours[1],u=n.info.week_day;if(p[u]||(p[u]={}),p[u][i]=n,"all"!=i&&!r[i]){var l={id:i,from:a(n.info.hours[0]),to:a(n.info.hours[1])};r[i]=l,t.times.push(l)}}}function l(t){var e=n.findStop(t);return e?e.name:null}function s(t){function e(t){var e={};for(var r in t){var o=t[r];for(var n in o.stops){var i=o.stops[n];e[i]||(e[i]=0),e[i]++}}return e}function r(t,e){var r={};for(var o in t)t[o]==e&&(r[o]=!0);return r}function o(t,e){var r,o=[];for(var n in t){var i=t[n];n>0&&n<t.length-1&&e[i]?(r||(r=[],o.push(r)),r.push(i)):(r=null,o.push(i))}return o}var n=r(e(t),t.length);delete n[d.id],delete n[f.id];for(var i in t)t[i].stops=o(t[i].stops,n)}t.stops=n.getStops();var c=i.parsePeriod(o.current.params.period),d=n.findStop(o.current.params.origin),f=n.findStop(o.current.params.destination);e.get("/api/path-info-full",{params:{origin:d.id,destination:f.id,from_date:c.from.getTime(),to_date:c.end.getTime()}}).success(function(e){u(e),t.loaded=!0});var p={};n.findRoutesByPeriod(d.id,f.id,c.from,c.end).then(function(e){e.length>1&&s(e),t.routes=e}),t.isCollapsed=function(t){return angular.isArray(t)},t.isOrigin=function(t){return t==d.id},t.isDestination=function(t){return t==f.id},t.stopText=function(e){return t.isCollapsed(e)?"•".repeat(e.length):l(e)},t.stopTooltip=function(e){return t.isCollapsed(e)?e.map(l).join(", "):null},t.barWidth=function(e){var r=100*e.count/t.routes[0].count;return 1>r?"1px":r+"%"},t.routeUrl=function(t){return"/#/"+o.current.params.period+"/routes/"+t.id}}]),angular.module("RouteExplorer").controller("SelectStopsController",["$scope","$rootScope","$location","Layout","Locale","TimeParser",function(t,e,r,o,n,i){function a(t,e){t.getFullYear()<2013&&(t=new Date(2013,0,1));for(var r=[],o=new Date(t.getFullYear(),t.getMonth(),1);e>o;){end=new Date(o.getFullYear(),o.getMonth()+1,o.getDate());var i={from:o,to:o,end:end,name:n.months[o.getMonth()].name+" "+o.getFullYear()};i.toName=n.until+i.name,r.push(i),o=end}return r.reverse(),r}t.stops=o.getStops(),t.origin=null,t.destination=null,t.months=n.months;var u=o.getRoutesDateRange();t.periods=a(u.min,u.max),t.startPeriod=t.periods[0],t.endPeriod=t.periods[0],t.formValid=function(){return!!t.origin&&!!t.destination&&t.origin!=t.destination&&t.startPeriod.from<=t.endPeriod.to},t.stopName=function(t){var e=o.findStop(t);return e?e.name:null},t.goToRoutes=function(){t.noRoutes=!1,t.loading=!0;var e={from:t.startPeriod.from,to:t.endPeriod.to,end:t.endPeriod.end},n=e.from,a=e.end,u=i.formatPeriod(e);o.findRoutesByPeriod(t.origin.id,t.destination.id,n,a).then(function(e){0===e.length?t.noRoutes=!0:1==e.length?r.path("/"+u+"/routes/"+e[0].id):r.path("/"+u+"/select-route/"+t.origin.id+"/"+t.destination.id)})["finally"](function(){t.loading=!1})},t.dismissError=function(){t.noRoutes=!1}}]),angular.module("RouteExplorer").controller("TimesDetailsController",["$scope","Locale",function(t,e){t.days=e.days,t.hours=e.hours}]),angular.module("RouteExplorer").directive("rexPercentBar",["env",function(t){return{restrict:"E",scope:{value:"=value",type:"=type"},templateUrl:t.baseDir+"/tpls/PercentBar.html"}}]),angular.module("RouteExplorer").directive("timesDetails",["env","Locale",function(t){return{restrict:"E",scope:{},controller:"TimesDetailsController",templateUrl:t.baseDir+"/tpls/TimesDetails.html"}}]),angular.module("RouteExplorer").filter("duration",function(){return function(t){var e=!1;t=Math.trunc(t),0>t&&(e=!0,t=-t);var r=Math.trunc(t/60);t-=60*r;var o=Math.trunc(r/60);r-=60*o,10>t&&(t="0"+t),10>r&&0!==o&&(r="0"+r);var n=r+":"+t;return 0!==o&&(n=o+":"+n),e&&(n="-"+n),n}}),angular.module("RouteExplorer").factory("Layout",["$http","$q",function(t,e){var r=[],o={},n=[],i={},a=e.all([t.get("/api/stops").then(function(t){r=t.data.map(function(t){return{id:t.stop_id,name:t.heb_stop_names[0],names:t.heb_stop_names}}),r.forEach(function(t){o[t.id]=t})}),t.get("/api/all-routes").then(function(t){n=t.data.map(function(t){return{id:t.id,stops:t.stop_ids,count:t.count,minDate:new Date(t.min_date),maxDate:new Date(t.max_date)}}),i=n.reduce(function(t,e){return t[e.id]=e,t},{})})]),u=function(t){return o[t]||null},l=function(t,e,r){var o={};return t.forEach(function(t){var n=t.stops.indexOf(e),i=t.stops.indexOf(r);if(!(0>n||0>i||n>i)){var a=t.stops,u=t.id;u in o?o[u].count+=t.count:o[u]={id:u,stops:a,count:t.count}}}),o=Object.keys(o).map(function(t){return o[t]}),o.sort(function(t,e){return e.count-t.count}),o},s=function(r,o,i,a){var u=e.defer(),s=l(n,r,o);if(0===s.length)u.resolve([]);else{var c=i,d=a;t.get("/api/all-routes-by-date",{params:{from_date:c.getTime(),to_date:d.getTime()}}).then(function(t){var e=t.data.map(function(t){return{id:t.id,stops:t.stop_ids,count:t.count}});u.resolve(l(e,r,o))},function(t){u.reject({msg:"Error fetching routes",response:t})})}return u.promise},c=function(t){return i[t]||null},d=function(){var t=new Date(1900,0,1),e=new Date(2100,0,1);for(var r in n)route=n[r],0!==route.count&&(route.minDate&&route.minDate<e&&(e=route.minDate),route.maxDate&&route.maxDate>t&&(t=route.maxDate));return{min:e,max:t}};return service={getStops:function(){return r},getRoutes:function(){return n},findRoute:c,findStop:u,findRoutes:function(t,e){return l(n,t,e)},findRoutesByPeriod:s,getRoutesDateRange:d},a.then(function(){return service})}]),angular.module("RouteExplorer").constant("Locale",{months:["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"].map(function(t,e){return{id:e+1,name:t}}),days:[{abbr:"א",name:"ראשון",id:1},{abbr:"ב",name:"שני",id:2},{abbr:"ג",name:"שלישי",id:3},{abbr:"ד",name:"רביעי",id:4},{abbr:"ה",name:"חמישי",id:5},{abbr:"ו",name:"שישי",id:6},{abbr:"ש",name:"שבת",id:7}],until:"עד ל"}),angular.module("RouteExplorer").factory("LocationBinder",["$location",function(t){return{bind:function(e,r,o,n,i){e[r]=t.search()[o]||null,e.$watch(r,function(e){i&&(e=i(e)),t.search(o,e)}),e.$watch(function(){return t.search()[o]||null},function(t){n&&(t=n(t)),e[r]=t})}}}]),angular.module("RouteExplorer").factory("TimeParser",[function(){function t(t){var e=Number(t.substr(0,4)),r=Number(t.substr(5,2));return new Date(e,r-1,1)}function e(e){var r=e.split("-",2),o=t(r[0]),n=r.length>1?t(r[1]):o,i=new Date(n.getFullYear(),n.getMonth()+1,1);return{from:o,to:n,end:i}}function r(t){return t.getFullYear()+("0"+(t.getMonth()+1)).slice(-2)}function o(t){var e=r(t.from);return t.from<t.to&&(e+="-"+r(t.to)),e}return{parseMonth:t,parsePeriod:e,formatMonth:r,formatPeriod:o}}]);
//# sourceMappingURL=app.js.map
