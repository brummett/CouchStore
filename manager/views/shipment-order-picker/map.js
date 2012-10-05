// shipment-order-picker
// Generates the data used by the shipment-order-picker list
// that becomes the "Make a Shipment" drop-down chooser
function(doc) {
    var order_number = '',
        barcode,
        isBackordered = 0,
        shipping = require('views/lib/shipping-priority'),
        Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc),
        i = 0,
        count = 0;

    if (order && order.isShippable()) {
        // order doc IDs start with the string 'order-'
        order_number = order.orderNumber();
        hasShipments = order.hasShipments();
        
        order.barcodes().forEach(function(barcode) {
            count += order.quantityForBarcode(barcode);  // sale quantities are negative
        });

        if (hasShipments) {
            order.shipments().forEach(function(shipment) {
                var barcode;
                for (barcode in shipment.items) {
                    count += shipment.items[barcode];  // shipment counts are positive
                }
            });
        }
        if (count < 0) {
            count = Math.abs(count);
            emit([shipping.priority(doc), order_number],
                { message: order_number + ' ' + count + ' items from '+ doc['warehouse-name'] + ' ' + doc['shipping-service-level'] + ' shipping',
                  isBackordered: hasShipments
                });
        }
    }
}
