// unconfirmed shipments
// keys are priority
function(doc) {
    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc);

    if (order && order.hasShipments()) {
        order.shipments().forEach(function(shipment, idx) {
            var count = 0,
                barcode = '';

            // Don't emit shipments with tracking numbers
            if ('tracking-number' in shipment) return;

            for (barcode in shipment.items) {
                count += shipment.items[barcode];
            }

            // For now, they all have priority 0
            emit(0, {   shipment: idx,
                        count: count,
                        box: shipment.box });
        });
    }
}
