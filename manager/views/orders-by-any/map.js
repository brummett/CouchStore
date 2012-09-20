// orders-by-any
// keys are customer names and order numbers
function(doc) {
    var unfilledItems = 0,
        shippedItems = 0,
        i,
        barcode;

    if (doc.type == 'order') {
        if (doc['order-type'] == 'sale') {
            // Figure out how many items remain unshipped
            // First, how many we ultimately need to ship
            for (barcode in doc.items) {
                unfilledItems += Math.abs( doc.items[barcode]  );
            }
            if ('shipments' in doc) {
                for (i = 0; i < doc.shipments.length; i++) {
                    for (barcode in doc.shipments[i].items) {
                        unfilledItems -= doc.shipments[i].items[barcode];
                        shippedItems  += doc.shipments[i].items[barcode];
                    }
                }
            }
        } else {
            // not a sale order
            for (barcode in doc.items) {
                shippedItems += Math.abs( doc.items[barcode]  );
            }
        }
            
        // order doc IDs start with the string 'order-'
        var order_number = doc._id.substring(6);
        var results = { 'order-number': order_number,
                        'customer-name': doc['customer-name'],
                        'order-type': doc['order-type'],
                        'unfilled-items': unfilledItems,
                        'shipped-items': shippedItems
                    };

        emit(order_number, results);
        emit(doc['customer-name'], results);
    }
}
