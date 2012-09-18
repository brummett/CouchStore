function(doc, req) {
    var ddoc = this,
        Mustache = require('vendor/couchapp/lib/mustache'),
        data = {},
        templateName = '',
        i = 0,
        itemKey = '';

    if (doc) {
        if ( doc.type != 'order' ) {
            return {
                code: 403,
                json: { reason: 'Document is a '+doc.type+', expected an order' }
            };
        }
        if ( ! ( 'unfilled-items' in doc)) {
            return {
                code: 403,
                json: { reason: 'Order has no unfilled items' }
            };
        }

        data.action = '#/shipment/'
        data.title = 'Fill pick list';

        data.orderType = doc['order-type'];
        data.date = doc.date;
        data.orderNumber = doc._id.substr(6);  // order docs start with the text 'order-'
        data.warehouseName = doc['warehouse-name'];
        data.customerName = doc['customer-name'];
        data._rev = doc._rev;
        data.shippingServiceLevel = doc['shipping-service-level'];
        data.orderSource = doc['order-source'];

        data.shippingCharge = doc['shipping-charge'] ? (parseInt(doc['shipping-charge']) / 100).toFixed(2) : '0.00';

        // Items already part of this shipment
        data.shippingItems = [];
        if ('shipment' in req.query) {
            var shipment = req.query.shipment;
            if (doc['shipments'][shipment]) {
                for (i in doc['shipments']) {
                    data.shippingItems.push({ barcode: i, quantity: Math.abs(doc['items'][i])});
                }
            } else {
                return {
                    code: 404,
                    json: { reason: 'Order ' + orderNumber + ' has no order ' + shipment }
                };
            }
        }

        // Items still not yet shipped
        data['unfilled-items'] = [];
        for (i in doc['unfilled-items']) {
            data['unfilled-items'].push({ barcode: i, quantity: Math.abs(doc['unfilled-items'][i])});
        }
        
    } else {
        if (! req.query.type) {
            return {
                code: 403,
                json: { reason: 'Unknown order number' }
            };
        }

        templateName = 'picklist-order-picker';

    }

    return Mustache.to_html(ddoc.templates['picklist'], data, ddoc.templates.partials['edit-order']);
}
        
        
