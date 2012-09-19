function(doc) {
    if (doc.type == 'order') {
        // order doc IDs start with the string 'order-'
        var order_number,
            barcode,
            isBackordered = doc.shipments ? doc.shipments.length : 0,
            shipping = { standard: 10, expedited: 5, overnight: 1 },
            count = 0;
        
        if ('unfilled-items' in doc) {
            for (barcode in doc['unfilled-items']) {
                count -= doc['unfilled-items'][barcode];    // sale quantities are negative
            }
        }
        if (count > 0) {
            order_number = doc._id.substring(6);
            emit([order_number, shipping[doc['shipping-service-level']]],
                { message: order_number + ' ' + count + ' items from '+ doc['warehouse-name'] + ' ' + doc['shipping-service-level'] + ' shipping',
                  isBackordered: isBackordered
                });
        }
    }
}
