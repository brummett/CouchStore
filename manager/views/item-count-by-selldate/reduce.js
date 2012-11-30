// item-count-by-selldate-barcode reduce
function(keys, values, rereduce) {
    var retval = [ ],
        seen = {};

    values.forEach(function(value) {
        var barcode = value.barcode,
            node = seen[barcode];

        if (node) {
            node.count += value.count;
        } else {
            seen[barcode] = value;
            retval.push(value);
        }
    });

    return retval;
}
