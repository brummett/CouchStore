function(doc) {
    if (doc.type == 'item') {
        emit(doc.barcode, null);
    }
}
