// Test that a user can log in
var assert = require('assert');
var Browser = require('zombie');

var auth_couch_url = 'http://test:test@localhost:5984';
var couch_url = 'http://localhost:5984';
var nano = require('nano')(auth_couch_url);

var dbname = 'testdb' + process.pid;
var main_page_url = couch_url + '/' + dbname + '/_design/manager/index.html';
var db;

describe('Load design doc', function() {

    it('creates database', function(done) {
        nano.db.create(dbname, function(err, body) {
            assert.ok(!err, 'no errors creating db '+dbname);
            db = nano.db.use(dbname);
            done();
        });
    });

    it('pushes design doc', function(done) {
        this.timeout(5000);   // give the DB time to wake up
        var couchapp_dir = __dirname + '/..',
            db_url = auth_couch_url + '/' + dbname,
            cmdline = 'couchapp push '+couchapp_dir+' '+db_url,
            exec = require('child_process').exec;

        exec(cmdline, function(err,stdout,stderr) {
            assert.ok(!err, 'no errors pushing app to db '+db_url);
            done();
        });
    });
});

describe('visit main page and log in', function() {
    var browser = new Browser.Browser();

    it('visits main page', function(done) {
        browser.visit(main_page_url, function(err, b) {
            done(err);

            assert.equal(browser.queryAll('#order-menu').display, 'none', 'order menu is hidden');
            assert.equal(browser.queryAll('#report-menu').display, 'none', 'report menu is hidden');
            assert.equal(browser.queryAll('#data-menu').display, 'none', 'data menu is hidden');
            assert.equal(browser.queryAll('#inventory-menu').display, 'none', 'inventory menu is hidden');
        });
    });

    it('has an account button', function() {
        assert.equal(browser.queryAll('#accountButton').length, 1, 'login button exists');
    });

    it('clicks the account button', function(done) {
        browser.clickLink('#accountButton', function(err) {
            done(err);
        });
    });

    // Zombie.js doesn't seem to work with css transisitions like Bootstrap uses
    //it('clicks the login link', function(done) {
    //    assert.equal(browser.queryAll('#loginLink').length, 1, 'login link exists');
    //    browser.clickLink('#loginLink', function(err) {
    //        done(err);
    //    });
    //});
    // so we'll just make it run the login route instead
    it('brings up the login form', function(done) {
        browser.visit('#/login', function(err) {
            done(err);
        });
    });

    it('fills in the login form', function() {
        assert.equal(browser.queryAll('input#name').length, 1, 'Name input exists');
        assert.equal(browser.queryAll('input#password').length, 1, 'Password input exists');
        assert.equal(browser.queryAll('button#submit').length, 1, 'submit button exists');
        assert.equal(browser.queryAll('button#cancel').length, 1, 'cancel button exists');

        browser.fill('name', 'test').fill('password','test');
    });

    it('submits the login form', function(done) {
        browser.pressButton('#submit', function(err) {
            done(err);
        });
    });

    it('verifies login was successful', function() {
        assert.ok(/test/.test(browser.queryAll('#accountButton')[0].innerHTML),
                    'test',
                    'Login name matches');

        // These also use Bootstrap css tricks :(
        //assert.notEqual(browser.queryAll('#order-menu')[0].display,
        //                'none',
        //                'order menu is not hidden');
        //assert.notEqual(browser.queryAll('#report-menu')[0].display,
        //                'none',
        //                'report menu is not hidden');
        //assert.notEqual(browser.queryAll('#data-menu')[0].display,
        //                'none',
        //                'data menu is not hidden');
        //assert.notEqual(browser.queryAll('#inventory-menu')[0].display,
        //                'none',
        //                'inventory menu is not hidden');
    });

    it('removes the test db', function(done) {
        nano.db.destroy(dbname, function(err) {
            done(err);
        });
    });
});
