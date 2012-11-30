// item-count-by-ordersource-selldate reduce
function(keys, values, rereduce) {
    var retval = [ ],
        seen = {},
        i;

    for (i = 0; i < values.length; i++) {
        var barcode = values[i].barcode,
            node = seen[barcode];

        if (node) {
            node.count += values[i].count;
        } else {
            seen[barcode] = values[i];
            retval.push(values[i]);
        }
    }

    return retval;
}
