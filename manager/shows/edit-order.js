function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = {},
        templateName = '',
        i = 0,
        itemKey = '',
        shipServiceLevels = [ {id: 'standard'} ,{id:  'expedited'}, {id: 'overnight'}],
        orderSources = [ {id: 'web'}, {id: 'amazon'},{id: 'phone'},{id: 'ebay'},{id: 'buy.com'}];

    if (doc) {
        if ( doc.type != 'order' ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an order' }
            };
        }

        data.orderType = doc['order-type'];
        templateName = data.orderType+ '-order';

        data.action = '#/order/' + doc['order-type'] + '/';
        data.title = 'Edit ' +  doc['order-type'] + ' order';
        data.date = doc.date;
        data.orderNumber = doc._id.substr(6);  // order docs start with the text 'order-'
        data.customerName = doc['customer-name'];
        data.customerId = doc['customer-id'];
        data._rev = doc._rev;

        // Set the right ship service level
        for (i = 0; i < shipServiceLevels.length; i++) {
            if (shipServiceLevels[i]['id'] == doc['shipping-service-level']) {
                shipServiceLevels[i]['selected'] = 'selected';
                break;
            }
        }
        // set the right order source
        for (i = 0; i < orderSources; i++) {
            if (orderSources[i]['id'] == doc['order-source']) {
                orderSources[i]['selected'] = 'selected';
                break;
            }
        }

        if (doc['order-type'] == 'receive') {
            itemKey = 'items';
        } else if (doc['order-type'] == 'sale') {
            itemKey = 'unfilled-items';
        } else {
            itemKey = 'items';
        }
        data.items = [];
        for (i in doc[itemKey]) {
            data.items.push({ barcode: i, quantity: Math.abs(doc[itemKey][i]), cost: ((doc['item-costs'][i]/100).toFixed(2)) });
        }
        
    } else {
        if (! req.query.type) {
            return {
                code: 403,
                json: { reason: 'Must supply an order type for a new order' },
            };
        }

        data.orderType = req.query.type;
        templateName = data.orderType + '-order';

        data.action = '#/order/' + req.query.type + '/';
        data.title = 'New ' +req.query.type + ' order';
        data.date = '';
        data.orderNumber = '';
        data.customer = '';
        data.customerId = '';
        data.items = [];
        data.costs = [];
    }

    data.allowDelete = true;
    data.shipServiceLevels = shipServiceLevels;
    data.orderSources = orderSources;

    return Mustache.to_html(ddoc.templates[templateName], data, ddoc.templates.partials['edit-order']);
}
