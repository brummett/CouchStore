// shipment-box-ids
// Used to determine the next box identification when shipping
// Caller should get the latest-sorting item, then pick the next
// letter
function(doc) {
    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc);

    if (order && order.hasShipments()) {
        order.shipments().forEach(function(shipment) {
            emit([shipment.date, shipment.box], null);
        });
    }
}

