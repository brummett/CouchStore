#!/usr/bin/env mocha

// Test the shipping-priority module
var prio = require(__dirname + '/../views/lib/shipping-priority');
var assert = require('assert');

describe('Priority module', function() {
    it('has priorities', function() {
        assert.ok(prio.levels);
    });

    it('has level values', function() {
        assert.ok(prio.levelPriority);
    });

    it('has sources', function() {
        assert.ok(prio.sources);
    });

    it('has priority values', function() {
        assert.ok(prio.sourcePriority);
    });

    it('can calculate shipping priority', function() {
        var doc = { 'order-source': 'web', 'shipping-service-level': 'overnight'},
            overnight = prio.priority(doc),
            expedited, standard;
        assert.ok(overnight);

        doc['shipping-service-level'] = 'expedited';
        expedited = prio.priority(doc);
        assert.ok(expedited);

        // Overnight is higher priority (lower number) than expedited
        assert.ok(overnight < expedited);

        doc['shipping-service-level'] = 'standard';
        standard = prio.priority(doc);
        assert.ok(standard);

        // Overnight is higher priority (lower number) than normal
        assert.ok(overnight < standard);
        assert.ok(expedited < standard);
        
    });

});
