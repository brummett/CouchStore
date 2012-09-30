// inventory-by-warehouse-barcode-permanent
// keys are [warehouse-name, barcode, is-permanent], values are count
// permanenet means part of an order or committed inventory correction
// not permanent means it's part of a proposed inventory
function(doc) {
    var barcode;

    if (doc.type == 'order') {
        for (barcode in doc.items) {
            emit([doc['warehouse-name'], barcode, 1],
                {   count: doc.items[barcode],
                    name: doc['item-names'][barcode],
                    sku: doc['item-skus'][barcode]
                });
        }
    } else if (doc.type == 'inventory') {
        for (barcode in doc.items) {
            emit([doc['warehouse-name'], barcode, 0],
                {   count: 0 - doc.items[barcode],  // Make these negative
                    name: doc['item-names'][barcode],
                    sku: doc['item-skus'][barcode]
                });
        }
    }
}
