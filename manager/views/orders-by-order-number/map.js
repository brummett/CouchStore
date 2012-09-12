function(doc) {
    if (doc.type == 'order') {
        // order doc IDs start with the string 'order-'
        var order_number = doc._id.substring(6);
        emit(order_number, doc['order-type']);
    }
}
