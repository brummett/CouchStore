function(doc) {
    function countItems(key) {
        var count = 0,
            barcode;
        if (key in doc) {
            for (barcode in doc[key]) {
                count += Math.abs(doc[key][barcode]);
            }
        }
        return count;
    }
            
    if (doc.type == 'order') {
        // order doc IDs start with the string 'order-'
        var order_number = doc._id.substring(6);
        var results = { 'order-number': order_number,
                        'customer-name': doc['customer-name'],
                        'order-type': doc['order-type'],
                        'unfilled-items': countItems('unfilled-items'),
                        'shipped-items': countItems('items')
                    };
        emit(order_number, results);
        emit(doc['customer-name'], results);
    }
}
