//shipment-detail show
// return quick info about a shipment suitable for putting
// into a modal
function(doc, req) {
    if (!doc) {
        return { code: 404, json: { reason: 'Unknown order number '+req.id }};
    }
    if (doc.type !== 'order') {
        return { code: 403, json: { reason: 'Document is not an order' }};
    }

    if (! ( 'shipment' in req.query)) {
        return { code: 403, json: { reason: '"shipment" is a required parameter' }};
    }

    if (! doc.shipments[ req.query.shipment ]) {
        return { code: 404, json: { reason: 'That order does not have shipment '+req.query.shipment }};
    }

    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc),
        Mustache = require('vendor/couchapp/lib/mustache'),
        thisShipment = order.shipment( req.query.shipment ),
        data = {order: order.orderNumber(),
                shipment: req.query.shipment,
                items: [],
                date:               thisShipment['date'],
                'tracking-number':  thisShipment['tracking-number'],
                carrier:            thisShipment['carrier'],
                'carrier-method':   thisShipment['carrier-method'],
                box:                thisShipment['box']
            };

    if (order.orderType === 'warehouse-transfer') {
        data.warehouseTransfer = true;
        data.source = doc['source-warehouse-name'];
        data.dest = doc['warehouse-name'];
    } else {
        data.dest = order.customerName();
    }
    for (var barcode in thisShipment.items) {
        data.items.push({ name: order.nameForBarcode(barcode),
                          count: thisShipment.items[barcode] });
    }

    provides('json', function() {
        return JSON.stringify(data);
    });

    provides('html', function() {
        return Mustache.to_html(this.templates['shipment-detail'], data);
    });
}
