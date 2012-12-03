function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = {},
        i = 0,
        barcode = '';

    data.action = '#/edit/inventory/';
    data.title = 'Count Inventory';
    data.allowDelete = true;

    if (doc) {
        if ( doc.type != 'inventory' ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an inventory' }
            };
        }

        data.section = doc.section;
        data.date = doc.date;
        data.warehouseName = doc['warehouse-name'];
        data._id = doc._id;
        data._rev = doc._rev;

        data.items = [];
        for (barcode in doc.items) {
            data.items.push( {  quantity: doc.items[barcode],
                                name:     doc['item-names'][barcode],
                                sku:      doc['item-skus'][barcode],
                                barcode:  barcode
                            });
        }

    } else {
        data.date = req.query.date;

    }

    return Mustache.to_html(ddoc.templates['physical-inventory'], data, ddoc.templates.partials);
}
        
        
