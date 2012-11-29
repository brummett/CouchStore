// shows/edit-order
function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        shipping = require('views/lib/shipping-priority'),
        Money = require('views/lib/money'),
        Order = require('views/lib/Order'),
        order,
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
        if ( doc.type !== 'order' ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an order' }
            };
        }

        order = Order.newFromDoc(doc);

        data.orderType = order.orderType();
        templateName = order.orderType()+ '-order';

        data.action = '#/create-order/' + order.orderType() + '/';
        data.title = 'Edit ' +  order.orderType() + ' order';
        data.date           = order.date();
        data.orderNumber    = order.orderNumber();
        data.customerName   = order.customerName();
        data.customerId     = order.customerId();
        data.customerAddress = order.customerAddress();
        data.isTaxable      = order.isTaxable();
        data.shippingCharge = Money.toDollars(order.shippingCharge());
        data._rev = doc._rev;

        // Set the right ship service level
        for (i = 0; i < shipServiceLevels.length; i++) {
            if (shipServiceLevels[i]['id'] == order.shippingServiceLevel()) {
                shipServiceLevels[i]['selected'] = 'selected';
                break;
            }
        }
        // set the right order source
        for (i = 0; i < orderSources; i++) {
            if (orderSources[i]['id'] == order.orderSource()) {
                orderSources[i]['selected'] = 'selected';
                break;
            }
        }


        data.items = [];
        order.barcodes().forEach(function(barcode) {
            var cost = order.costForBarcode(barcode)
                        ? Money.toDollars(order.costForBarcode(barcode))
                        : '';
            data.items.push( {  barcode: barcode,
                                name: order.nameForBarcode(barcode),
                                sku: order.skuForBarcode(barcode),
                                quantity: Math.abs(order.quantityForBarcode(barcode)),
                                cost: cost
                            });
        });
        
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
        data.date = req.query.date;
        data.orderNumber = '';
        data.customer = '';
        data.customerId = '';
        data.address = '';
        data.items = [];
        data.costs = [];
    }

    data.allowDelete = true;
    data.shipServiceLevels = shipServiceLevels;
    data.orderSources = orderSources;

    return Mustache.to_html(ddoc.templates[templateName], data, ddoc.templates.partials);
}
