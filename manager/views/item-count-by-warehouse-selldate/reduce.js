// item-count-by-selldate-barcode reduce
function(keys, values, rereduce) {
    var retval = { quantities: {}, names: {}, skus: {} };

    if (rereduce) {
        values.forEach(function(value) {
           retval.quantities[barcode] += value.count;
            retval.names[barcode] = value.name
            retval.skus[barcode] = value.sku;
        });

    } else {
        values.forEach(function(value) {
            var barcode = value.barcode;
            retval.quantities[barcode] = retval.quantities[barcode] || 0;
            retval.quantities[barcode] += value.count;
            retval.names[barcode] = value.name
            retval.skus[barcode] = value.sku;
        });
    }

    return retval;
}
