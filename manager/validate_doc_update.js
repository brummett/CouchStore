function(newDoc, savedDoc, userCtx) {

    if (newDoc._deleted) return;

    function require(field, message) {
        message = message || 'Document must have a ' + field + ' field.';
        if (newDoc[field] == undefined) throw({ forbidden: message});
    }

    var key,
        keys_in_items,
        keys_in_costs;

    require('type');

    if (newDoc.type == 'order') {
        require('order-type');
        require('items');
        require('item-costs');
        require('customer-name');
        require('customer-id');
        require('warehouse-id');

        for (key in newDoc.items) {
            // quantities must be non-zero
            if (! newDoc.items[key]) {
                throw({ forbidden: 'Quantity for barcode ' + key + ' must be non-zero'});
            }
            // And also appear in the costs list
            if (! ( key in newDoc['item-costs'])) {
                throw({ forbidden: 'Barcode ' + key + ' appears in the quantity list but not the item-costs list'});
            }
        }

        for (key in newDoc['item-costs']) {
            // item-costs must be an integer (cents)
            if (Math.round(newDoc['item-costs'][key]) != newDoc['item-costs'][key]) {
                throw({ forbidden: 'Cost for barcode ' + key + ' must be an integer number of cents'});
            }
            // and also appear in the quantity list
            if (! ( key in newDoc.items)) {
                throw({ forbidden: 'Barcode ' + key + ' appears in the cost list but not the quantity list'});
            }
        }

    } else if (newDoc.type == 'item') {
        require('barcode');
        require('name');
        require('sku');

    } else if (newDoc.type == 'customer') {
        require('firstname');

    } else if (newDoc.type == 'warehouse') {
        require('name');

    }
}
