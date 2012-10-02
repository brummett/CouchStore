// item-history-by-barcode-date
// Returns data about each order a barcode has been part of
function(doc) {
    var barcode;
    if (doc.type == 'order') {
        for (barcode in doc.items) {
            emit([barcode, doc.date],
                    {   name:           doc['item-names'][barcode],
                        sku:            doc['item-skus'][barcode],
                        count:          doc.items[barcode],
                        warehouse:      doc['warehouse-name'],
                        'order-type':   doc['order-type'],
                        'order-number': doc._id.substr(6)  // starts with 'order-'
                    });
        }
    }
}
