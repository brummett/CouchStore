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
        var Order = require('views/lib/Order'),
            order = Order.newFromDoc(doc);

        if (doc['order-type'] === 'warehouse-transfer') {
            // For warehouse transfers, the source warehouse items are decremented...
            for (barcode in doc.items) {
                emit([1, doc['source-warehouse-name'], barcode],
                    {   count: (0 - doc.items[barcode]),
                        name: doc['item-names'][barcode],
                        sku: doc['item-skus'][barcode],
                        date: order.date()
                    });
            }
            //... and the the destination gets items incremented
        }
        if (doc['order-type'] === 'sale') {
            // For sales, subtract the shipped counts
            order.shipments().forEach(function(shipment) {
                for (barcode in shipment.items) {
                    emit([1, order.warehouseName(), barcode],
                        {  count:  (0 - shipment.items[barcode]),
                            name:   order.nameForBarcode(barcode),
                            sku:    order.skuForBarcode(barcode),
                            date:   order.date()
                        });
                }
            });
        } else {
            for (barcode in doc.items) {
                emit([1, doc['warehouse-name'], barcode],
                    {   count: doc.items[barcode],
                        name: doc['item-names'][barcode],
                        sku: doc['item-skus'][barcode],
                        date:   order.date()
                    });
            }
        }
    } else if (doc.type == 'inventory') {
        for (barcode in doc.items) {
            emit([0, doc['warehouse-name'], barcode],
                {   count: 0 - doc.items[barcode],  // Make these negative
                //{   count: doc.items[barcode],
                    name: doc['item-names'][barcode],
                    sku: doc['item-skus'][barcode],
                    date:   doc.date
                });
        }
    }
}
