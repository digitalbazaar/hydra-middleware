/*

  Simple light switch example

  Check the status of the light switch:

    curl -H "Accept: application/ld+json" http://localhost:8080/status

  Turn the light on:

    curl -H "Accept: application/ld+json" -H "Content-Type: application/ld+json" -X PUT --data '{"@id":"http://localhost:8080/status","http://example.org/power":{"@id":"http://example.org/on"}}' http://localhost:8080/status

  Turn the light off:

    curl -H "Accept: application/ld+json" -H "Content-Type: application/ld+json" -X PUT --data '{"@id":"http://localhost:8080/status","http://example.org/power":{"@id":"http://example.org/off"}}' http://localhost:8080/status

 */

var apiHeader = require('../api-header')
var formats = require('rdf-formats-common')()
var object = require('../object')
var express = require('express')
var morgan = require('morgan')
var serve = require('rdf-serve-static')
var url = require('url')
var Simple = require('simplerdf')

/*
  light switch SimpleRDF context
*/

var context = {
  LightSwitch: 'http://example.org/LightSwitch',
  Status: 'http://example.org/Status',
  label: 'http://www.w3.org/2000/01/rdf-schema#label',
  on: 'http://example.org/on',
  off: 'http://example.org/off',
  power: {
    '@id': 'http://example.org/power',
    '@type': '@id'
  },
  status: {
    '@id': 'http://example.org/status',
    '@type': '@id'
  },
  type: {
    '@id': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
    '@type': '@id'
  }
}

/*
  light switch class
*/

var lightSwitch = new Simple(context)

function initLightSwitch (iri) {
  // set the public IRI
  lightSwitch.iri(iri)

  // add properties
  lightSwitch.type = context.LightSwitch
  lightSwitch.label = 'living room light switch'

  // and methods
  lightSwitch.get = function () {
    return this
  }

  // create status object
  var status = new Simple(context, url.resolve(lightSwitch.iri().toString(), 'status'))

  // with properties
  status.type = context.Status
  status.power = context.off

  // and methods
  status.get = function () {
    return this
  }

  status.put = function (status) {
    this.power = status.power
  }

  // assign status object to light switch
  lightSwitch.status = status
}

/*
  express app
*/

var app = express()

// log a request to the console
app.use(morgan('combined'))

// add api Link header
app.use(apiHeader('/light-switch-vocab'))

// user rdf-serve-static to publich the API vocab
app.use(serve(__dirname, formats))

// use the object middleware to handle request to the light switch
app.use('/', object(lightSwitch, context))

var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port

  // init light switch with the final absolute IRI
  initLightSwitch('http://localhost:' + port + '/')

  console.log('listening on http://%s:%s', host, port)
})
