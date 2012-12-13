// items-by-barcode-or-sku view
function(doc) {
    if (doc.type === 'item') {
        var ret = { barcode: doc.barcode,
                    sku: doc.sku,
                    'cost-cents': doc['cost-cents'],
                    'price-cents': doc['price-cents'],
                    name: doc.name
                };
        emit(doc.barcode, ret);
        emit(doc.sku, ret);
    }
}
