'use strict'

const assert = require('assert');
const moment = require('moment');
const _ = require('lodash');

const jutrx = require('../dist/jut-rxjs.js');
const config = { path: 'http://localhost:8082' };

describe('## jut-rxjs', () => {
  describe('# Query by saved proceedure', () => {
    let client;

    it('new client', (done) => {
      client = new jutrx.Client(config, {debug: false});
      done();
    })

/*
    it('invalid query', (done) => {
      query('invalid sql') // calling query without client context
        .subscribeOnError((err) => {
          assert.ok(err.message.startsWith('syntax error'))
          done()
        })
    })*/

    it('query', function(done) {
      this.timeout(8000);
      let inputs = {
        'from:date': moment.utc().subtract(2, 'month').format(),
        'to:date': moment(), // as raw moment
        tag: 'lkqd-3246,lkqd-10879' //,lkqd-10879
      };

      client.run('./hourlyTagReport_old.juttle', inputs )
        .subscribe((result) => {
          const schemas = _.keys(result.output);
          //console.log('result', JSON.stringify(result), schemas.length );
          assert.ok(schemas.length > 1);
          assert.ok(schemas.indexOf('sink0') !== -1);
          assert.ok(schemas.indexOf('sink1') !== -1);
          //assert.equal(result.rows[0].count, 1)
          done();
        }, err => done(err))
    })

    it('end', () => {
      client.end()
    })
  })
})
