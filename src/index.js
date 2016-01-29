import Rx from 'rx';
const Rxo = Rx.Obserable;
import fs from 'fs';
import _ from 'lodash';
import http from 'http';
import rxfetch from 'rx-fetch';
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

const programs = global.JuttleRxPrograms || global.JuttleRxPrograms = {}; // cache programs

// Returns a stream of each Jut result
export function run(name, args) {
  args = args || {};
  // uppercase args
  args = _.reduce(args, (acc, v, k) => {
    acc[k.toUpperCase()] = v; return acc; },
  {});

  if(!programs[name]) thow new Error('program does not exist');
  const {juttle, params} = programs[name];
  if( _.difference(params, Object.keys(args)).length > 0 ) throw new Error('Missing args', _.difference(params, args));

  // santize the args
  args = _.reduce(args, (acc, v, k) => {
    if(typeof v === 'string') acc[k] = JSON.stringify(v);
    else if(typeof v === 'number') acc[k] = v;
    else if(v && typeof v.toString === 'function') acc[k] = JSON.stringify(v.toString());
    else throw new Error('Invalid type on key ' + k)
  }, {});

  const juttleFilled = _.reduce(args, (acc, v, k) => acc.replace('$' + k, v) , juttle);
  console.log('Executing:', juttleFilled);

  return Rx.just(''); // returns raw stream
}

// Converts each point element from Jut into a stream obj
export function fromPoints() {

}

// Converts all juttle protocol tokens into a stream obj
export function fromProtocol() {

}

// returns true if loaded
export function load(url, name) {
  if(programs[name]) return true; // already cached
  const juttle = fs.readFileSync(url)
                      .replace(/^\/\/.*$/gm, ''); // remove comments
  const rawparams = juttle.match(/(\$[A-Z0-9_-]+)/g); // get params: $TAG
  const params = _.map(rawparams,
    x => x.replace('$', '') // remove $ from prefix
  );

  program[name] = {juttle, params};
}
