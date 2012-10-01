function(keys, values, rereduce) {
    var i, sum = 0;

    for (i = 0; i < values.length; i++) {
        sum += values[i].count;
    }
    // All the items with the same barcode will have the same sku and name
    return { count: sum, name: values[0].name, sku: values[0].sku };
}
