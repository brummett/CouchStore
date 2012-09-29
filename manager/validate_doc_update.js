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

    var validators = {
        order: function() {
            var barcode;

            require('order-type');
            require('item-costs');
            require('customer-name');
            require('customer-id');
            require('date');
            require('warehouse-name');
            require('warehouse-id');
            require('items');
            require('item-names');
            require('item-skus');
    
            unchanged('date');

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
                // And the skus list
                if (! (barcode in newDoc['item-skus'])) {
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the quantity list but not the item-skus list'});
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

            for (barcode in newDoc['item-skus']) {
                // must appear in the items list
                if (! (barcode in newDoc['items'])) {
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the item-skus list but not the quantity list'});
                }
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
        }
    };

        
    enforce(userCtx.name, 'You must be logged in to make changes');

    if (newDoc._deleted) return;

    require('type');
    validators[newDoc.type]();
}
