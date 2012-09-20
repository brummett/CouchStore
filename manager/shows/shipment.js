function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = {},
        unfilledItems = {},
        templateName = '',
        i = 0,
        thisShipment,
        barcode = '';

    if (doc) {
        if ( doc.type != 'order' ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an order' }
            };
        }

        data.action = '#/shipment/'
        data.title = 'Create shipment';

        data.orderType = doc['order-type'];

        data.orderNumber = doc._id.substr(6);  // order docs start with the text 'order-'
        data.warehouseName = doc['warehouse-name'];
        data.customerName = doc['customer-name'];
        data._rev = doc._rev;
        data.shippingServiceLevel = doc['shipping-service-level'];
        data.orderSource = doc['order-source'];

        data.shippingCharge = doc['shipping-charge'] ? (parseInt(doc['shipping-charge']) / 100).toFixed(2) : '0.00';

        // How many items we ultimately need to ship out
        unfilledItems = {};
        for (barcode in doc.items) {
            unfilledItems[barcode] = Math.abs(doc.items[barcode]);
        }
        // Deduct items already shipped
        if ('shipments' in doc) {
            for (i = 0; i < doc.shipments.length; i++) {
                for (barcode in doc.shipments[i].items) {
                    unfilledItems[barcode] -= doc.shipments[i].items[barcode];
                }
            }
        }
        // Only include non-zero items to avoid cluttering up the interface
        data.unfilledItems = [];
        for (barcode in unfilledItems) {
            if (unfilledItems[barcode] != 0) {
                data.unfilledItems.push({ barcode: barcode, quantity: unfilledItems[barcode] });
            }
        }

        // Items already part of this shipment
        data.shippingItems = [];
        if ('shipment' in req.query) {
            var shipment = req.query.shipment;
            if (doc.shipments[shipment]) {
                thisShipment = doc.shipments[shipment];
                // An already existing shipment
                data.title = 'Edit shipment';
                data.date = thisShipment.date;

                for (barcode in thisShipment.items) {
                    if (thisShipment.items[barcode] != 0 ) {
                        data.shippingItems.push({ barcode: i, quantity: Math.abs(thisShipment[barcode]) });
                    }
                }
            } else {
                return {
                    code: 404,
                    json: { reason: 'Order ' + orderNumber + ' has no shipment ' + shipment }
                };
            }
        }

    } else {
        if (! req.query.type) {
            return {
                code: 404,
                json: { reason: 'Unknown order number' }
            };
        }

        templateName = 'shipment-order-picker';

    }

    return Mustache.to_html(ddoc.templates['shipment'], data, ddoc.templates.partials['edit-order']);
}
        
        
