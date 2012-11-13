// inventory-by-permanent-warehouse-barcode
// keys are [is-permanent, warehouse-name, barcode], values include item count, name and sku
// permanenet means part of an order or committed inventory correction
// not permanent means it's part of a proposed inventory
//
// When queried for both permanent and not permanent, the counts are how many short
// the proposed inventory is
function(doc) {
    var barcode;

    if (doc.type == 'order') {
        if (doc['order-type'] === 'warehouse-transfer') {
            for (barcode in doc.items) {
                emit([1, doc['source-warehouse-name'], barcode],
                    {   count: (0 - doc.items[barcode]),
                        name: doc['item-names'][barcode],
                        sku: doc['item-skus'][barcode]
                    });
            }
        }
        for (barcode in doc.items) {
            emit([1, doc['warehouse-name'], barcode],
                {   count: doc.items[barcode],
                    name: doc['item-names'][barcode],
                    sku: doc['item-skus'][barcode]
                });
        }
    } else if (doc.type == 'inventory') {
        for (barcode in doc.items) {
            emit([0, doc['warehouse-name'], barcode],
                {   count: 0 - doc.items[barcode],  // Make these negative
                //{   count: doc.items[barcode],
                    name: doc['item-names'][barcode],
                    sku: doc['item-skus'][barcode]
                });
        }
    }
}
