function(doc, req) {
    var ddoc = this;
    var Mustache = require('vendor/couchapp/lib/mustache');

    if (doc) {
        return Mustache.to_html(ddoc.templates['listCustomerRow'], doc);
    }
}
