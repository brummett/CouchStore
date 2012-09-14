// Generate a delete modal window for all the different data types:
//    item, customer, warehouse, order
function(doc, req) {
    var ddoc = this;
    var Mustache = require('vendor/couchapp/lib/mustache');

    var data = {};
    if(doc) {
        data.type = doc.type;
        data.id = doc._id;
        if (doc.type == 'customer') {
            data.name = doc.lastname ? (doc.firstname + ' ' + doc.lastname) : doc.firstname;
        } else if (doc.type == 'order') {
            data.name = doc._id.substr(6);  // Order IDs start with 'order-'
        } else {
            data.name = doc.name;
        }
        return Mustache.to_html(ddoc.templates['modal-delete-thing'], data);
    } else {
        return {
            code: 403,
            json: { reason: 'Document ID is required for deletion' }
        };
    }
}
