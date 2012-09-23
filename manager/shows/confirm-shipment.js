function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = {},
        thisShipment,
        orderNumber,
        barcode = '';

    if (doc) {
        if ( doc.type != 'order' ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an order' }
            };
        }
        orderNumber = doc._id.substr(6);  // order IDs start with 'order-'

        if ('shipment' in req.query) {

            data['order-number'] = orderNumber;
            data['shipping-service-level'] = doc['shipping-service-level'];
            thisShipment = doc.shipments[ req.query.shipment ];

            if (thisShipment) {
                // Editing an existing shipment
                data['title'] = 'Confirm a shipment';
                data['box'] = thisShipment.box;
                data['tracking-number'] = thisShipment['tracking-number'];
                data['shipping-cost'] = thisShipment['shipping-cost'];

                data.action = '#/confirm-shipment/' + orderNumber + '/' + req.query.shipment;
            } else {
                // confirming a non-existent shipment?!
                return {
                    code: 404,
                    json: { reason: 'Order ' + orderNumber + ' has no shipment ' + shipment }
                };
            }
        }

        data['warehouse-name'] = doc['warehouse-name'];
        data['customer-name'] = doc['customer-name'];
        data._rev = doc._rev;
        data['shipping-service-level'] = doc['shipping-service-level'];

        data['shipping-charge'] = doc['shipping-charge'] ? (parseInt(doc['shipping-charge']) / 100).toFixed(2) : '0.00';

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
        
        
