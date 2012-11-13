function(newDoc, oldDoc, userCtx) {

    function require(field, message) {
        message = message || 'Document must have a ' + field + ' field.';
        if (newDoc[field] == undefined) throw({ forbidden: message});
    }

    function enforce(bool, message) {
        if (!bool) throw({ forbidden: message});
    }

    function unchanged(field) {
        if (oldDoc && toJSON(oldDoc[field]) != toJSON(newDoc[field]))
            throw({ forbidden: "Field can't be changed: "+field });
    }

    // for order-type docs, make sure the barcodes that appear in 'items'
    // also appear in the other named fields, and vice-versa
    function validate_items_against(fields) {
        var varcode, i, other;

        for (barcode in newDoc.items) {
            // quantities must be non-zero
            if (! newDoc.items[barcode]) {
                throw({ forbidden: 'Quantity for barcode ' + barcode + ' must be non-zero'});
            }

            // And be in these other fields
            for (i = 0; i < fields.length; i++) {
                other = fields[i];
                if (! (barcode in newDoc[ other ])) {
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the quantity list but not the ' + other + ' list'});
                }
            }
        }

        for (i = 0; i < fields.length; i++) {
            other = fields[i];
            for (barcode in newDoc[ other ]) {
                if (! (barcode in newDoc.items)) {
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the ' + other + ' list but not the quantity list'});
                }
            }
        }
    }

    var validators = {
        order: function() {
            var barcode;

            require('order-type');
            if (newDoc['order-type'] != 'warehouse-transfer') {
                // warehouse transfers don't have customers
                require('customer-name');
            }
            require('date');
            require('warehouse-name');
            require('items');
            require('item-names');
            require('item-skus');
    
            unchanged('date');

    
            for (barcode in newDoc['item-costs']) {
                // item-costs must be an integer (cents)
                if (Math.round(newDoc['item-costs'][barcode]) != newDoc['item-costs'][barcode]) {
                    throw({ forbidden: 'Cost for barcode ' + barcode + ' must be an integer number of cents'});
                }
            }

            if ((newDoc['order-type'] == 'inventory-correction')
                || (newDoc['order-type'] == 'warehouse-transfer')) {

                validate_items_against(['item-names', 'item-skus']);
            } else {
                require('customer-id');
                require('warehouse-id');
                require('item-costs');
                validate_items_against(['item-costs', 'item-names', 'item-skus']);
            } 

            if ('shipments' in newDoc) {
                validators.shipments();
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

        shipments: function() {
            var barcode,
                i,
                thisShipment,
                count = {};

            for (barcode in newDoc.items) {
                count[barcode] = Math.abs(newDoc.items[barcode]);
            }

            for (i = 0; i < newDoc.shipments.length; i++) {
                thisShipment = newDoc.shipments[i];

                enforce('items' in thisShipment,
                        'Shipment ' + i + ' has no items list');
                enforce('date' in thisShipment,
                        'Shipment ' + i + ' has no date');
                for (barcode in thisShipment.items) {
                    enforce(barcode in newDoc.items,
                            'Shipment ' + i + ' has barcode ' + barcode + ' which is not in the items list');

                    count[barcode] -= Math.abs(thisShipment.items[barcode]);
                    enforce(count[barcode] >= 0, 'Shipments for barcode ' + barcode + ' are more than the items');
                }
            }
        },

        inventory: function() {
            require('date');
            require('warehouse-name');
            require('warehouse-id');
            require('items');
            require('item-names');
            require('item-skus');

            unchanged('date');

            validate_items_against(['item-names', 'item-skus']);
         }
    };
        
    enforce(userCtx.name, 'You must be logged in to make changes');

    if (newDoc._deleted) return;

    require('type');
    if (newDoc.type in validators) {
        validators[newDoc.type]();
    }
}
