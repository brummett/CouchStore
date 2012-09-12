function(doc) {
    if (doc.type == 'order') {
        if (doc.items) {
            var barcode = '',
                warehouse_id = doc['warehouse-id'] || '';
            for (barcode in doc.items) {
                emit([warehouse_id, barcode], doc.items[barcode]);
            }
        }
    }
}
