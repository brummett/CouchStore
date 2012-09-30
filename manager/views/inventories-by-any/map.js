// inventories-by-any
// keys are item barcodes, skus, names and the section
function(doc) {
    var unfilledItems = 0,
        shippedItems = 0,
        i,
        barcode;

    if (doc.type == 'inventory') {
        var results = { warehouse: doc['warehouse-name'], kinds: 0, items: 0, section: doc.section };

        for (barcode in doc.items) {
            results.kinds++;
            results.items += doc.items[barcode];
        }

        emit(doc.section, results);

        for (barcode in doc.items) {
            emit(barcode, results);
            emit(doc['item-names'][barcode], results);
            emit(doc['item-skus'][barcode], results);
        }
    }
}
