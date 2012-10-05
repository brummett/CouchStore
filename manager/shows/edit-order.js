// shows/edit-order
function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        shipping = require('views/lib/shipping-priority'),
        data = {},
        templateName = '',
        i = 0,
        shipServiceLevels,
        orderSources;

    // The template needs the lists transformed into lists of objects with the 'id' the printable item
    function makeId(s) {
        return { id: s };
    }
    function rcmp(a, b) {  // reverse sort
        if (a > b) return -1;
        if (a < b) return +1;
        return 0;
    }

    shipServiceLevels = shipping.levels.sort(rcmp).map(makeId);
    orderSources = shipping.sources.map(makeId);

    if (doc) {
        if ( doc.type != 'order' ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an order' }
            };
        }

        data.orderType = doc['order-type'];
        templateName = data.orderType+ '-order';

        data.action = '#/create-order/' + doc['order-type'] + '/';
        data.title = 'Edit ' +  doc['order-type'] + ' order';
        data.date = doc.date;
        data.orderNumber = doc._id.substr(6);  // order docs start with the text 'order-'
        data.customerName = doc['customer-name'];
        data.customerId = doc['customer-id'];
        data.isTaxable = doc['is-taxable'];
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

        data.items = [];
        for (i in doc.items) {
            data.items.push( {  barcode: i,
                                name: doc['item-names'][i],
                                sku: doc['item-skus'][i],
                                quantity: Math.abs(doc.items[i]),
                                cost: (doc['item-costs'][i]/100).toFixed(2)
                            });
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

        data.action = '#/create-order/' + req.query.type + '/';
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

    return Mustache.to_html(ddoc.templates[templateName], data, ddoc.templates.partials);
}
