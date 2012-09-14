function(doc) {
    if (doc.type == 'order') {
        // order doc IDs start with the string 'order-'
        var order_number = doc._id.substring(6);
        var results = { 'order-number': order_number,
                        'customer-name': doc['customer-name'],
                        'order-type': doc['order-type'],
                        'unfilled-items': doc['unfilled-items'] ? Object.keys(doc['unfilled-items']).length : 0,
                        'shipped-items': doc['items']  ? Object.keys(doc['items']).length : 0,
                    };
                    
        emit(order_number, results);
        emit(doc['customer-name'], results);
    }
}
