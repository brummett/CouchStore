function(doc) {
    var order_number,
        barcode,
        i,
        count = 0;

    if (doc.type == 'warehouse') {
        emit([doc._id, 0], doc.name);

    } else if (doc.type == 'order') {
        // order doc IDs start with the string 'order-'

        for (barcode in doc['items']) {
            count += doc['items'][barcode];    // sale quantities are negative
        }
        if ('shipments' in doc) {
            for (i = 0; i < doc.shipments.length; i++) {
                for (barcode in doc.shipments[i].items) {
                    count += doc.shipments[i].items[barcode];  // shipment counts are positive
                }
            }
        }

        if (count < 0) {
            count = Math.abs(count);
            order_number = doc._id.substring(6);
            emit([doc['warehouse-id'], 1, order_number], count);
        }
    }
}
