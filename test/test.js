'use strict'

const assert = require('assert');
const moment = require('moment');
const _ = require('lodash');

const jutrx = require('../dist/jut-rxjs.js');
const config = { path: 'http://localhost:8082' };

let inputs1 = {
  'from:date': moment.utc().day(13).month(0).year(2016).startOf('day').format(),
  'to:date': moment().utc().day(20).month(0).year(2016).endOf('day'), // as raw moment
    exchange: 'lkqd',
   tag: 'lkqd-3246,lkqd-10879' //'lkqd-3246,lkqd-10879' //,lkqd-10879
};

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

    it('args parsing', function(done) {
      const result = '{"from:date":"2016-01-13T00:00:00+00:00","to:date":"2016-01-20T23:59:59+00:00","exchange":"lkqd","tag":"lkqd-3246,lkqd-10879"}';
      const parsed = client._argsParse(inputs1);
      //git coassert.equal(result, JSON.stringify(parsed));
      done();
    })

    it('query', function(done) {
      this.timeout(8000);
      let inputs = inputs1;

      client.run('./hourlyTagReport_old.juttle', inputs )
        .subscribe((result) => {
          const schemas = _.keys(result.output);
          //console.log('result', JSON.stringify(result), schemas );
          assert.ok(schemas.length > 1);
          assert.ok(schemas.indexOf('sink0') !== -1 || schemas.indexOf('view0') !== -1);
          assert.ok(schemas.indexOf('sink1') !== -1 || schemas.indexOf('view1') !== -1);
          //assert.equal(result.rows[0].count, 1)
          done();
        }, err => done(err))
    })

    it('query toPoints', function(done) {
      this.timeout(8000);
      let inputs = inputs1;

      client.run('./hourlyTagReport_old.juttle', inputs )
        .toPoints()
        .subscribe((result) => {
          const views = _.keys(result);
          console.log('result', JSON.stringify(result) );
          assert.ok(views.length > 1);
          assert.ok(views.indexOf('timechart') !== -1);
          assert.ok(views.indexOf('table') !== -1);
          assert.ok(result.table[0].impressions !== undefined);
          //assert.equal(result.rows[0].count, 1)
          done();
        }, err => done(err))
    })

    it('end', () => {
      client.end()
    })
  })
})
