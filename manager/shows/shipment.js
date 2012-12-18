// shipment show
function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        Money = require('views/lib/money'),
        Order = require('views/lib/Order'),
        order,
        data = {},
        unfilledItems = {},
        templateName = '',
        i = 0,
        thisShipment,
        barcode = '';

    if (! doc) {
        return {
            code: 404,
            json: { reason: 'Unknown order number' }
        };

    }

    order = Order.newFromDoc(doc);

    if ( ! order ) {
        return {
            code: 403,
            json: { reason: 'Document is a '+doc.type+', expected an order' }
        };
    }

    data.action = '#/shipment/'
    data.title = 'Create shipment';

    data._rev                   = doc._rev;
    data.orderType              = order.orderType();
    data.orderNumber            = order.orderNumber();
    data.warehouseName          = order.warehouseName();
    data.customerName           = order.customerName();
    data.shippingServiceLevel   = order.shippingServiceLevel();
    data.orderSource            = order.orderSource();

    data.shippingCharge = order.shippingCharge() ? Money.toDollars(order.shippingCharge()) : '0.00';

    // How many items we ultimately need to ship out
    unfilledItems = {};
    order.barcodes().forEach(function(barcode) {
        unfilledItems[barcode] = Math.abs(order.quantityForBarcode(barcode));
    });
    // Deduct items already shipped
    if ('shipments' in doc) {
        order.shipments().forEach(function(shipment) {
            var barcode;
            for (barcode in shipment.items) {
                unfilledItems[barcode] -= shipment.items[barcode];
            }
        });
    }
    // Only include non-zero items to avoid cluttering up the interface
    data.unfilledItems = [];
    for (barcode in unfilledItems) {
        if (unfilledItems[barcode] != 0) {
            data.unfilledItems.push( {  barcode: barcode,
                                        name: doc['item-names'][barcode],
                                        'show-available': true,
                                        quantity: unfilledItems[barcode],
                                        unfilled: true
                                    });
        }
    }

    // Items already part of this shipment
    data.shippingItems = [];
    var shippingSeen = {};
    if ('shipment' in req.query) {
        var shipment = req.query.shipment;
        if (doc.shipments[shipment]) {
            thisShipment = doc.shipments[shipment];
            // An already existing shipment
            data.title = 'Edit shipment';
            data.date = thisShipment.date;
            data.shipment = shipment;
            data.size = thisShipment.size;
            data.weight = thisShipment.weight;
            data.box = thisShipment.box;

            for (barcode in thisShipment.items) {
                if (thisShipment.items[barcode] != 0 ) {
                    shippingSeen[barcode] = true;
                    data.shippingItems.push( {  barcode: barcode,
                                                name: doc['item-names'][barcode],
                                                quantity: Math.abs(thisShipment.items[barcode])
                                            } );
                }
            }
        } else {
            return {
                code: 404,
                json: { reason: 'Order ' + orderNumber + ' has no shipment ' + shipment }
            };
        }
    } else {
        // Creating a new shipment
        data.date = req.query.date;
    }

    data.hiddenUnfilledItems = [];
    data.unfilledItems.forEach(function(item) {
        if (! shippingSeen[item.barcode]) {
            var copy = { name: item.name, barcode: item.barcode, quantity: 0, unfilled: true };
            shippingSeen[item.barcode] = true;
            data.hiddenUnfilledItems.push(copy);
        }
    });

    return Mustache.to_html(ddoc.templates['shipment'], data, ddoc.templates.partials);
}

