function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = {},
        i = 0,
        barcode = '';

    data.action = '#/inventory/'
    data.title = 'Count Inventory';
    data.allowDelete = true;

    if (doc) {
        if ( doc.type != 'inventory' ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an order' }
            };
        }

        data.section = doc.section;

        data.warehouseName = doc['warehouse-name'];
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

    }

    return Mustache.to_html(ddoc.templates['physical-inventory'], data, ddoc.templates.partials);
}
        
        
