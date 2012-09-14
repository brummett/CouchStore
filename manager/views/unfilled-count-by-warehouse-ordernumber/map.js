function(doc) {
    if (doc.type == 'warehouse') {
        emit([doc._id, 0], doc.name);

    } else if (doc.type == 'order') {
        // order doc IDs start with the string 'order-'
        var order_number,
            barcode,
            count = 0;
        
        if ('unfilled-items' in doc) {
            for (barcode in doc['unfilled-items']) {
                count -= doc['unfilled-items'][barcode];    // sale quantities are negative
            }
        }
        if (count > 0) {
            order_number = doc._id.substring(6);
            emit([doc['warehouse-id'], 1, order_number], count);
        }
    }
}
