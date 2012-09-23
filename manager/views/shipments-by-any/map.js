// shipments-by-any
// keys are customer names, order numbers, tracking numbers, item names and barcodes
function(doc) {
    var thisShipment,
        i,
        shippedItems = 0,
        results,
        barcode;

    if (doc.type == 'order') {
        if ('shipments' in doc) {
            for (i = 0; i < doc.shipments.length; i++) {
                thisShipment = doc.shipments[i];

                // First go through to count the number of items
                shippedItems = 0;
                for (barcode in thisShipment.items) {
                    shippedItems += thisShipment.items[barcode];
                }

                // Emit the results
                results = { 'order-number': doc._id.substring(6),   // order doc IDs start with the string 'order-'
                            'customer-name': doc['customer-name'],
                            'shipment':     i,
                            'date':         thisShipment.date,
                            'shipped-items': shippedItems };

                if ('tracking-number' in thisShipment) {
                    results['tracking-number'] = thisShipment['tracking-number'];
                    emit(thisShipment['tracking-number'], results);
                } else {
                    results['tracking-number'] = '';
                }
                emit(results['order-number'], results);
                emit(results['customer-name'], results);

                // emit keys for each barcode
                for (barcode in thisShipment.items) {
                    emit(barcode, results);
                    emit(doc['item-names'][barcode], results);
                }
            }
        }
    }
}
