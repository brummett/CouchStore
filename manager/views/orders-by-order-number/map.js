function(doc) {
    if (doc.type == 'order') {
        emit(doc.order_number, null);
    }
}
