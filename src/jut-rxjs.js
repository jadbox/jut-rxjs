'use strict'
import Rx from 'rx';
const Rxo = Rx.Observable;
import fs from 'fs';
import _ from 'lodash';
import http from 'http';
import moment from 'moment';
const fetch = require('isomorphic-fetch');
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

const programs = global.JuttleRxPrograms || (global.JuttleRxPrograms = {}); // cache programs

function Client(path = 'http://localhost:8082', opt = { debug: false }) {
  this.debug = opt.debug;
  this.path = path;
  return this;
}

module.exports = {
  Client
}

Client.prototype._argsParse = function(args) {
  return  _.reduce(args, (acc, v, k) => {
    if(typeof v === 'string') acc[k] = v; // TODO: injections, JSON.stringify(v);
    else if( v instanceof moment ) acc[k] = v.utc().format();
    else if(typeof v === 'number') acc[k] = v;
    else if(v && typeof v.toString === 'function') acc[k] = v; //JSON.stringify(v.toString());
    else throw new Error('Invalid type on key ' + k)
    return acc;
  }, {});
}

// Returns a stream of each Jut result
Client.prototype.run = function(name = './hourlyTagReport_old.juttle', args) {
  args = args || {};

  const isStoredProc = !programs[name];

  // santize the args
  args = this._argsParse(args);
  //console.log('args', args)

  let response;
  if(isStoredProc) response = this._sendStoredProceedure(name, args);
  else response = this._sendProgram(name, args);

  return response; // returns raw stream
}

Client.prototype._sendProgram = function (programName, args) {
  throw new Error('wip');
  const {juttle = null, params = null} = programs[programName];
  // TODO
  if( _.difference(params, Object.keys(args)).length > 0 ) throw new Error('Missing args', _.difference(params, args));
  const juttleFilled = _.reduce(args, (acc, v, k) => acc.replace('$' + k, v) , juttle);
  console.log('Executing:', juttleFilled);
  return Rxo.just(null);
}

Client.prototype._sendStoredProceedure = function (programName, args) {
  const url = this.path + '/api/v0/jobs';
  const service = fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            path: programName,
            wait: true,
            inputs: args
        })
    })
    .then(function(result) {
        if (result.status !== 200) {
            return result.text()
            .then(function(text) {
                console.log(text)
                throw new Error('error running juttle: ' + text);
            })
        }
        return result.json();
    });

  let service$ = Rxo.fromPromise(service);
  service$ = this._rxResponse(service$, {url, args});
  return service$;
}

Client.prototype.end = function() {
  // no-op
}

Client.prototype._rxResponse = function (service$, {url, args}) {
  if(this.debug) console.log('Loading: ', url, args);

  service$.juttle = {url, juttleParams: args};
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
const viewx = /sink.*|view.*/g; // support old/new juttle schema
function toPoints() {
  //sink0: { options: [Object], type: 'table', data: [Object] }
  return this.map( x => {
    if(!x.output) throw new Error('No jut output', x);
    //console.log('x',x)
    const sinks = _.filter(_.keys(x.output),
      x => x.match(viewx).length !== 0 ); // view is new schema
    return _.reduce(sinks, (acc, k) => {
      const d = x.output[k];
      //const pts = _.filter(d.data, x => x.type === 'points');
      const concatPoints = x => _.reduce(x, 
          (points, x) => { 
            if (x.type === 'points') { points = points.concat(x.points)} 
            return points; }
        , []);

      acc[d.type] = concatPoints(d.data) || []; //_.flatten(_.map(pts, pt => pt.points));
      return acc;
    }, {});
  });
}

// Converts all juttle protocol tokens into a stream obj
function fromProtocol() {
 // no-op
}

// returns true if loaded
Client.prototype.load = function(url, name) {
  if(programs[name]) return true; // already cached
  const juttle = fs.readFileSync(url)
                      .replace(/^\/\/.*$/gm, ''); // remove comments
  const rawparams = juttle.match(/(\$[A-Z0-9_-]+)/g); // get params: $TAG
  const params = _.map(rawparams,
    x => x.replace('$', '') // remove $ from prefix
  );

  program[name] = {juttle, params};
}
