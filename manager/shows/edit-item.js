function(doc, req) {
    var ddoc = this;
    var Mustache = require('vendor/couchapp/lib/mustache');

    var data = {};
    if(doc) {
        data._id = doc._id;
        data._rev = doc._rev;
        data.name = doc.name;
        data.sku = doc.sku;
        data.barcode = doc.barcode;
        data.cost = doc['cost-cents'] ? (parseFloat(doc['cost-cents']) / 100).toFixed(2) : "0.00";
        data.price = doc['price-cents'] ? (parseFloat(doc['price-cents']) / 100).toFixed(2) : "0.00";
        data.description = doc.description;
        data['add-edit-title'] = "Edit";
    } else {
        data['add-edit-title'] = "Add";
    }

    return Mustache.to_html(ddoc.templates['edit-item'], data);
}
