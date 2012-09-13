function(newDoc, savedDoc, userCtx) {

    if (newDoc._deleted) return;

    function require(field, message) {
        message = message || 'Document must have a ' + field + ' field.';
        if (newDoc[field] == undefined) throw({ forbidden: message});
    }

    var validators = {
        order: function() {
            var barcode,
                itemKey,
                ckeckKeys = {};

            require('order-type');
            require('item-costs');
            require('customer-name');
            require('customer-id');
            require('warehouse-id');
    
            // An order must have either an 'items', 'unfileld-items' or both
            if ((! 'items' in newDoc) || ('unfilled-items' in newDoc)) {
                throw({ forbidden: "Orders must have either an 'items' or 'unfilled-items' field"});
            }
    
            checkKeys = { 'items': 1 };
            if (newDoc.type == 'sale') {
                // For sale orders, also check unfilled-items
                checkKeys['unfilled-items'] = 1;
            }
            for (itemKey in checkKeys) {
                for (barcode in newDoc[itemKey]) {
                    // quantities must be non-zero
                    if (! newDoc[itemKey][barcode]) {
                        throw({ forbidden: 'Quantity for barcode ' + barcode + ' must be non-zero'});
                    }
                    // And also appear in the costs list
                    if (! ( barcode in newDoc['item-costs'])) {
                        throw({ forbidden: 'Barcode ' + key + ' appears in the quantity list but not the item-costs list'});
                    }
                }
            }
    
            for (key in newDoc['item-costs']) {
                // item-costs must be an integer (cents)
                if (Math.round(newDoc['item-costs'][key]) != newDoc['item-costs'][key]) {
                    throw({ forbidden: 'Cost for barcode ' + key + ' must be an integer number of cents'});
                }
                // and also appear in the quantity list
                if (! ( key in newDoc.items) && ! ( key in newDoc['unfilled-items'])) {
                    throw({ forbidden: 'Barcode ' + key + ' appears in the cost list but not the quantity list'});
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
