function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = {},
        templateName = '',
        i = 0;

    if (doc) {
        if ( doc.type != 'order' ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an order' }
            };
        }

        templateName = doc['order-type'] + '-order';

        data.title = 'Edit ' +  doc['order-type'] + ' order';
        data.date = doc.date;
        data.orderNumber = doc._id.substr(6);  // order docs start with the text 'order-'
        data.customerName = doc['customer-name'];
        data.customerId = doc['customer-id'];
        data.warehouseName = doc['warehouse-name'];
        data.warehouseId = doc['warehouse-id'];
        data._rev = doc._rev;
        data.items = [];
        for (i in doc.items) {
            data.items.push({ barcode: i, quantity: doc.items[i], cost: ((doc['item-costs'][i]/100).toFixed(2)) });
        }
        
    } else {
        if (! req.query.type) {
            return {
                code: 403,
                json: { reason: 'Must supply an order type for a new order' },
            };
        }

        templateName = req.query.type + '-order';

        data.title = 'New ' +req.query.type + ' order';
        data.date = '';
        data.orderNumber = '';
        data.customer = '';
        data.customerId = '';
        data.warehouseName = '';
        data.warehouseId = '';
        data.items = [];
        data.costs = [];
    }

    data.action = '#/order/' + req.query.type + '/';
    data.allowDelete = true;

    return Mustache.to_html(ddoc.templates[templateName], data, ddoc.templates.partials['edit-order']);
}
        
        
