// orders-by-any
// keys are customer names and order numbers
function(doc) {
    var unfilledItems = 0,
        shippedItems = 0,
        Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc);

    if (order) {
        if (order.isShippable()) {
            // Figure out how many items remain unshipped
            // First, how many we ultimately need to ship
            order.barcodes().forEach(function(barcode) {
                unfilledItems += Math.abs( order.quantityForBarcode(barcode));
            });
            if (order.hasShipments()) {
                order.shipments().forEach(function(shipment) {
                    var barcode;
                    for (barcode in shipment.items) {
                        unfilledItems -= shipment.items[barcode];
                        shippedItems  += shipment.items[barcode];
                    }
                });
            }
        } else {
            // not a sale order
            order.barcodes().forEach(function(barcode) {
                shippedItems += Math.abs( order.quantityForBarcode(barcode) );
            });
        }
            
        // order doc IDs start with the string 'order-'
        var order_number = order.orderNumber();
        var results = { 'order-number': order_number,
                        'customer-name': order.customerName(),
                        'order-type': order.orderType(),
                        'unfilled-items': unfilledItems,
                        'shipped-items': shippedItems
                    };

        emit(order_number, results);
        emit(order.customerName(), results);

        order.barcodes().forEach(function(barcode) {
            emit(barcode, results);
            emit(order.skuForBarcode(barcode), results);
        });
    }
}
