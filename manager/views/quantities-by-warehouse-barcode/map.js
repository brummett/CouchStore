function(doc) {
    if (doc.type == 'order') {
        var barcode = '',
            warehouse_id = doc['warehouse-id'] || '<unknown>',
            already_printed = {},
            count,
            barcode;

        if ('items' in doc) {
            for (barcode in doc['items']) {
                count = doc['items'][barcode];
                if ('unfilled-items' in doc) {
                    count += doc['unfilled-items'][barcode];
                }
                already_printed[barcode] = true;
                emit([warehouse_id, barcode], count);
            }
        }
        if ('unfilled-items' in doc) {
            for (barcode in doc['unfilled-items']) {
                if (already_printed[barcode]) continue;

                emit([warehouse_id, barcode], doc['unfilled-items'][barcode]);
            }
        }
    }
}