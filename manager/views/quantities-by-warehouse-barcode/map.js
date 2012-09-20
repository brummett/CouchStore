function(doc) {
    var barcode = '',
        warehouse_id = doc['warehouse-id'] || '<unknown>';

    if (doc.type == 'order') {
        if ('items' in doc) {
            for (barcode in doc['items']) {
                emit([warehouse_id, barcode], doc['items'][barcode]);
            }
        }
    }
}
