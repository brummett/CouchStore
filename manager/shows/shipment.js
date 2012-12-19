// shipment show
function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        Money = require('views/lib/money'),
        Order = require('views/lib/Order'),
        order,
        data = {},
        unfilledItems = {},
        shipmentSeen = {},
        i = 0,
        thisShipmentId,
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

    var shipments = order.shipments(),
        thisShipmentId,
        thisShipment;

    if ('shipment' in req.query) {
        thisShipmentId = parseInt(req.query.shipment);
        thisShipment = shipments[thisShipmentId];
    }

    if ((thisShipmentId !== undefined) && (thisShipment === undefined)) {
        return {
            code: 404,
            json: { reason: 'Order ' + order.orderNumber() + ' has no shipment ' + shipment }
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
    data.date                   = req.query.date;

    data.shippingCharge = order.shippingCharge() ? Money.toDollars(order.shippingCharge()) : '0.00';

    // How many items we ultimately need to ship out
    unfilledItems = {};
    order.barcodes().forEach(function(barcode) {
        unfilledItems[barcode] = Math.abs(order.quantityForBarcode(barcode));
    });

    data.shippingItems = [];
    for (i = 0; i < shipments.length; i++) {
        for (barcode in shipments[i].items) {
            unfilledItems[barcode] -= shipments[i].items[barcode];
        }

        // Items that are part of this shipment
        if (i === thisShipmentId) {
            thisShipment = shipments[i];

            data.title      = 'Edit Shipment';
            data.date       = thisShipment.date;
            data.shipment   = thisShipmentId;
            data.size       = thisShipment.size;
            data.weight     = thisShipment.weight;
            data.box        = thisShipment.box;

            for (barcode in thisShipment.items) {
                if (thisShipment.items[barcode] != 0 ) {
                    shipmentSeen[barcode] = true;
                    data.shippingItems.push( {  barcode: barcode,
                                                sku: order.skuForBarcode(barcode),
                                                name: order.nameForBarcode(barcode),
                                                quantity: Math.abs(thisShipment.items[barcode])
                                            } );
                }
            }
        }
    }

    // Only include non-zero items to avoid cluttering up the interface
    data.unfilledItems = [];
    for (barcode in unfilledItems) {
        if (unfilledItems[barcode] != 0) {
            data.unfilledItems.push( {  barcode: barcode,
                                        sku: order.skuForBarcode(barcode),
                                        name: order.nameForBarcode(barcode),
                                        quantity: unfilledItems[barcode],
                                    });
            if (! shipmentSeen[barcode]) {
                data.shippingItems.push( {  barcode:    barcode,
                                            sku:        order.skuForBarcode(barcode),
                                            name:       order.nameForBarcode(barcode),
                                            quantity:   0,
                                            hidden:     true
                                        });
            } else {
                delete shippmentSeen[barcode];
            }
        }
    }

    // Anything left in shipmentSeen gets added to the unfilled items as hidden
    for (barcode in shipmentSeen) {
        data.unfilledItems.push( {  barcode:    barcode,
                                    sku:        order.skuForBarcode(barcode),
                                    name:       order.nameForBarcode(barcode),
                                    quantity:   0,
                                    hidden:     true
                                });
    }

    return Mustache.to_html(ddoc.templates['shipment'], data, ddoc.templates.partials);
}

