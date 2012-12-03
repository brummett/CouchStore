// confirm-shipment show
function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        Money = require('views/lib/money'),
        Order = require('views/lib/Order'),
        Shipping = require('views/lib/shipping-priority'),
        order = Order.newFromDoc(doc),
        data = {},
        thisShipment,
        orderNumber,
        barcode = '';

    if (doc) {
        if ( ! order ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an order' }
            };
        }
        if ('shipment' in req.query) {

            data['order-number'] = order.orderNumber();
            data['shipping-service-level'] = order.shippingServiceLevel();
            thisShipment = doc.shipments[ req.query.shipment ];

            if (thisShipment) {
                // Editing an existing shipment
                data['title'] = 'Confirm a shipment';
                data['box'] = thisShipment.box;
                data['size'] = thisShipment.size;
                data['weight'] = thisShipment.weight;
                data['tracking-number'] = thisShipment['tracking-number'];
                data['shipping-cost'] = thisShipment['shipping-cost'];

                data.action = '#/confirm-shipment/' + order.orderNumber() + '/' + req.query.shipment;
            } else {
                // confirming a non-existent shipment?!
                return {
                    code: 404,
                    json: { reason: 'Order ' + order.orderNumber() + ' has no shipment ' + shipment }
                };
            }
        }

        data['address'] = order.customerAddress();
        data['warehouse-name'] = order.warehouseName();
        data['customer-name'] = order.customerName();
        data._rev = doc._rev;
        data['shipping-service-level'] = order.shippingServiceLevel();

        data['shipping-charge'] = order.shippingCharge() ? Money.toDollars(order.shippingCharge()) : '0.00';

        data.carriers = [];
        Shipping.carriers.forEach(function(name) {
            data.carriers.push({name: name});
        });

    } else {
        if (! req.query.type) {
            return {
                code: 404,
                json: { reason: 'Unknown order number' }
            };
        }

        templateName = 'shipment-order-picker';

    }

    return Mustache.to_html(ddoc.templates['confirm-shipment'], data);
}
