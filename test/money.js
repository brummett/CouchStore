// Test the money module
var money = require(__dirname + '/../views/lib/money');
var assert = require('assert');

describe('Money module', function() {
    it('converts to cents', function() {
        assert.equal(money.toCents(1.23), 123);
        assert.equal(money.toCents(123), 12300);
        assert.equal(money.toCents(0.12), 12);
        assert.equal(money.toCents(0), 0);
    });

    it('converts to dollars', function() {
        assert.equal(money.toDollars(123), 1.23);
        assert.equal(money.toDollars(12), 0.12);
        assert.equal(money.toDollars(0), 0);
    });

    it('matches dollars', function() {
        assert.ok(money.isDollarsAndCents('1.23'));
        assert.ok(money.isDollarsAndCents('1'));
        assert.ok(money.isDollarsAndCents('123'));
        assert.ok(money.isDollarsAndCents('0.23'));
        assert.ok(money.isDollarsAndCents('.23'));

        assert.ok(! money.isDollarsAndCents(''));
        assert.ok(! money.isDollarsAndCents('1.'));
        assert.ok(! money.isDollarsAndCents('1.234'));
        assert.ok(! money.isDollarsAndCents('a'));
        assert.ok(! money.isDollarsAndCents(' '));
        assert.ok(! money.isDollarsAndCents('.'));
        assert.ok(! money.isDollarsAndCents('.2'));
        assert.ok(! money.isDollarsAndCents('1.2'));
        assert.ok(! money.isDollarsAndCents('0.2'));
    });

    it('makes a string from cents', function() {
        assert.equal(money.toDollarsString(123), '1.23');
        assert.equal(money.toDollarsString('123'), '1.23');
        assert.equal(money.toDollarsString(0), '0.00');
        assert.equal(money.toDollarsString('0.00'), '0.00');
        assert.equal(money.toDollarsString('abc'), '0.00');
        assert.equal(money.toDollarsString(''), '0.00');
    });

});
