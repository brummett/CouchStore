// edit-item show
function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        Money = require('views/lib/money');

    var data = {};
    if(doc) {
        data._id = doc._id;
        data._rev = doc._rev;
        data.name = doc.name;
        data.sku = doc.sku;
        data.barcode = doc.barcode;
        data.cost = doc['cost-cents'] ? Money.toDollars(doc['cost-cents']) : "0.00";
        data.price = doc['price-cents'] ? Money.toDollars(doc['price-cents']) : "0.00";
        data.description = doc.description;
        data['add-edit-title'] = "Edit";
    } else {
        data['add-edit-title'] = "Add";
        data['barcode'] = req.id;
    }

    return Mustache.to_html(ddoc.templates['edit-item'], data);
}
