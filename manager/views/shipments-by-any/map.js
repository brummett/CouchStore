// shipments-by-any
// keys are customer names, order numbers, tracking numbers, item names and barcodes
// shipments-by-any
function(doc) {
    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc),
        orderNumber = '',
        customerName = '';

    if (order && order.hasShipments()) {
        orderNumber = order.orderNumber();
        customerName = order.customerName();

        order.shipments().forEach(function(shipment, idx) {
            var shippedItems = 0,
                barcode = '',
                results = { 'order-number': orderNumber,
                            'customer-name': customerName,
                            shipment: idx,
                            date: order.date(),
                            'shipped-items': 0 };

            for (barcode in shipment.items) {
                results['shipped-items'] += shipment.items[barcode];
            }

            results['tracking-number'] = ('tracking-number' in shipment)
                                        ? shipment['tracking-number']
                                        : '';

            emit(orderNumber, results);
            emit(customerName, results);

            // emit keys for each barcode in the shipment
            for(barcode in shipment.items) {
                emit(barcode, results);
                emit(order.nameForBarcode(barcode), results);
            }
        });
    }
}
