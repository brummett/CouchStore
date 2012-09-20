function(newDoc, savedDoc, userCtx) {

    if (newDoc._deleted) return;

    function require(field, message) {
        message = message || 'Document must have a ' + field + ' field.';
        if (newDoc[field] == undefined) throw({ forbidden: message});
    }

    var validators = {
        order: function() {
            var barcode,
                i;

            require('order-type');
            require('item-costs');
            require('customer-name');
            require('customer-id');
            require('date');
            require('warehouse-name');
            require('warehouse-id');
            require('items');
            require('item-names');
    
            for (barcode in newDoc.items) {
                // quantities must be non-zero
                if (! newDoc.items[barcode]) {
                    throw({ forbidden: 'Quantity for barcode ' + barcode + ' must be non-zero'});
                }
                // And also appear in the costs list
                if (! ( barcode in newDoc['item-costs'])) {
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the quantity list but not the item-costs list'});
                }
                // And also in the names list
                if (! (barcode in newDoc['item-names'])) {
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the quantity list but not the item-names list'});
                }

            }
    
            for (barcode in newDoc['item-costs']) {
                // item-costs must be an integer (cents)
                if (Math.round(newDoc['item-costs'][barcode]) != newDoc['item-costs'][barcode]) {
                    throw({ forbidden: 'Cost for barcode ' + barcode + ' must be an integer number of cents'});
                }
                // and also appear in the quantity list
                if (! (barcode in newDoc.items) ) {
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the item-costs list but not the quantity list'});
                }
            }

            for (barcode in newDoc['item-names']) {
                // must appear in the items list
                if (! (barcode in newDoc['items'])) {
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the item-names list but not the quantity list'});
                }
            }
        },

        item: function() {
            require('barcode');
            require('name');
            require('sku');
        },

        customer: function() {
            require('firstname');
        },

        warehouse: function() {
            require('name');
        },
    };

        
    require('type');
    validators[newDoc.type]();
}
