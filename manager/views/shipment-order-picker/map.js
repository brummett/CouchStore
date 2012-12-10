// shipment-order-picker
// Generates the data used by the shipment-order-picker list
// that becomes the "Make a Shipment" drop-down chooser
function(doc) {
    var order_number = '',
        shipping = require('views/lib/shipping-priority'),
        Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc),
        count;

    if (order && order.isShippable()) {
        order_number = order.orderNumber();

        count = order.unshippedQuantity();

        if (count != 0) {
            emit([shipping.priority(doc), order_number],
                {   count: count,
                    orderSource: doc['order-source'],
                    shipping: doc['shipping-service-level'],
                    isBackordered: order.hasShipments()
                });
        }
    }
}
