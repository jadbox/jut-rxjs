(function(e, a) { for(var i in a) e[i] = a[i]; }(exports, /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _rx = __webpack_require__(1);
	
	var _rx2 = _interopRequireDefault(_rx);
	
	var _fs = __webpack_require__(2);
	
	var _fs2 = _interopRequireDefault(_fs);
	
	var _lodash = __webpack_require__(3);
	
	var _lodash2 = _interopRequireDefault(_lodash);
	
	var _http = __webpack_require__(4);
	
	var _http2 = _interopRequireDefault(_http);
	
	var _rxFetch = __webpack_require__(5);
	
	var _rxFetch2 = _interopRequireDefault(_rxFetch);
	
	var _moment = __webpack_require__(6);
	
	var _moment2 = _interopRequireDefault(_moment);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var Rxo = _rx2.default.Observable; // TODO: perhaps remove
	
	var fetch = __webpack_require__(7);
	//var jutClient = require("node-jut");
	/*
	var inputs = {
	    growth: parseInt(req.query.growth),
	    company: company
	};
	fetch('http://localhost:8080/api/v0/jobs', {
	        method: 'POST',
	        headers: {
	            'Content-Type': 'application/json'
	        },
	        body: JSON.stringify({
	            path: __dirname + '/revenue.juttle',
	            wait: true,
	            inputs: inputs
	        })
	    })
	*/
	
	var programs = global.JuttleRxPrograms || (global.JuttleRxPrograms = {}); // cache programs
	
	function Client() {
	  var path = arguments.length <= 0 || arguments[0] === undefined ? 'http://localhost:8082' : arguments[0];
	  var opt = arguments.length <= 1 || arguments[1] === undefined ? { debug: false } : arguments[1];
	
	  this.debug = opt.debug;
	  this.path = path;
	  return this;
	}
	
	module.exports = {
	  Client: Client
	};
	
	Client.prototype._argsParse = function (args) {
	  return _lodash2.default.reduce(args, function (acc, v, k) {
	    if (typeof v === 'string') acc[k] = v; // TODO: injections, JSON.stringify(v);
	    else if (v instanceof _moment2.default) acc[k] = v.utc().format();else if (typeof v === 'number') acc[k] = v;else if (v && typeof v.toString === 'function') acc[k] = v; //JSON.stringify(v.toString());
	      else throw new Error('Invalid type on key ' + k);
	    return acc;
	  }, {});
	};
	
	// Returns a stream of each Jut result
	Client.prototype.run = function () {
	  var name = arguments.length <= 0 || arguments[0] === undefined ? './hourlyTagReport_old.juttle' : arguments[0];
	  var args = arguments[1];
	
	  args = args || {};
	
	  var isStoredProc = !programs[name];
	
	  // santize the args
	  args = this._argsParse(args);
	  //console.log('args', args)
	
	  var response = void 0;
	  if (isStoredProc) response = this._sendStoredProceedure(name, args);else response = this._sendProgram(name, args);
	
	  return response; // returns raw stream
	};
	
	Client.prototype._sendProgram = function (programName, args) {
	  throw new Error('wip');
	  var _programs$programName = programs[programName];
	  var _programs$programName2 = _programs$programName.juttle;
	  var juttle = _programs$programName2 === undefined ? null : _programs$programName2;
	  var _programs$programName3 = _programs$programName.params;
	  var params = _programs$programName3 === undefined ? null : _programs$programName3;
	  // TODO
	
	  if (_lodash2.default.difference(params, Object.keys(args)).length > 0) throw new Error('Missing args', _lodash2.default.difference(params, args));
	  var juttleFilled = _lodash2.default.reduce(args, function (acc, v, k) {
	    return acc.replace('$' + k, v);
	  }, juttle);
	  console.log('Executing:', juttleFilled);
	  return Rxo.just(null);
	};
	
	Client.prototype._sendStoredProceedure = function (programName, args) {
	  var url = this.path + '/api/v0/jobs';
	  var service = fetch(url, {
	    method: 'POST',
	    headers: {
	      'Content-Type': 'application/json'
	    },
	    body: JSON.stringify({
	      path: programName,
	      wait: true,
	      inputs: args
	    })
	  }).then(function (result) {
	    if (result.status !== 200) {
	      return result.text().then(function (text) {
	        console.log(text);
	        throw new Error('error running juttle: ' + text);
	      });
	    }
	    return result.json();
	  });
	
	  var service$ = Rxo.fromPromise(service);
	  service$ = this._rxResponse(service$, { url: url, args: args });
	  return service$;
	};
	
	Client.prototype.end = function () {
	  // no-op
	};
	
	Client.prototype._rxResponse = function (service$, _ref) {
	  var url = _ref.url;
	  var args = _ref.args;
	
	  if (this.debug) console.log('Loading: ', url, args);
	
	  service$.juttle = { url: url, juttleParams: args };
	  service$.toPoints = toPoints;
	  Rxo.prototype.toPoints = toPoints;
	  return service$;
	};
	
	/*
	{ output:
	   { sink0: { options: [Object], type: 'table', data: [Object] },
	     sink1: { options: [Object], type: 'timechart', data: [] } },
	  errors: [ {} ],
	  warnings: [] } { _jut_time_bounds:
	   [ { 'from:date': '2015-12-01T21:57:44.000Z',
	       'to:date': '2016-02-01T21:57:44.000Z',
	       last: null } ] }
	*/
	
	// Converts each point element from Jut into a stream obj
	var viewx = /sink.*|view.*/g; // support old/new juttle schema
	function toPoints() {
	  //sink0: { options: [Object], type: 'table', data: [Object] }
	  return this.map(function (x) {
	    if (!x.output) throw new Error('No jut output', x);
	    //console.log('x',x)
	    var sinks = _lodash2.default.filter(_lodash2.default.keys(x.output), function (x) {
	      return x.match(viewx).length !== 0;
	    }); // view is new schema
	    return _lodash2.default.reduce(sinks, function (acc, k) {
	      var d = x.output[k];
	      //const pts = _.filter(d.data, x => x.type === 'points');
	      var concatPoints = function concatPoints(x) {
	        return _lodash2.default.reduce(x, function (points, x) {
	          if (x.type === 'points') {
	            points = points.concat(x.points);
	          }
	          return points;
	        }, []);
	      };
	
	      acc[d.type] = concatPoints(d.data) || []; //_.flatten(_.map(pts, pt => pt.points));
	      return acc;
	    }, {});
	  });
	}
	
	// Converts all juttle protocol tokens into a stream obj
	function fromProtocol() {}
	// no-op
	
	
	// returns true if loaded
	Client.prototype.load = function (url, name) {
	  if (programs[name]) return true; // already cached
	  var juttle = _fs2.default.readFileSync(url).replace(/^\/\/.*$/gm, ''); // remove comments
	  var rawparams = juttle.match(/(\$[A-Z0-9_-]+)/g); // get params: $TAG
	  var params = _lodash2.default.map(rawparams, function (x) {
	    return x.replace('$', '');
	  } // remove $ from prefix
	  );
	
	  program[name] = { juttle: juttle, params: params };
	};

/***/ },
/* 1 */
/***/ function(module, exports) {

	module.exports = require("rx");

/***/ },
/* 2 */
/***/ function(module, exports) {

	module.exports = require("fs");

/***/ },
/* 3 */
/***/ function(module, exports) {

	module.exports = require("lodash");

/***/ },
/* 4 */
/***/ function(module, exports) {

	module.exports = require("http");

/***/ },
/* 5 */
/***/ function(module, exports) {

	module.exports = require("rx-fetch");

/***/ },
/* 6 */
/***/ function(module, exports) {

	module.exports = require("moment");

/***/ },
/* 7 */
/***/ function(module, exports) {

	module.exports = require("isomorphic-fetch");

/***/ }
/******/ ])));
//# sourceMappingURL=jut-rxjs.js.map