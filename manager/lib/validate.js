// validate.js
// Helpers for validating documents

var validators = {
    item: [
        function(o) { o.unchanged('type', 'Cannot change the type of an entity') },
        function(o) { o.require('barcode'); },
        function(o) { o.require('name'); },
        function(o) { o.require('sku'); }
    ],
    customer: [
        function(o) { o.unchanged('type', 'Cannot change the type of an entity') },
        function(o) { o.require('firstname'); }
    ],
    warehouse: [
        function(o) { o.unchanged('type', 'Cannot change the type of an entity') },
        function(o) { o.require('name'); },
        function(o) { o.require('address'); }
    ],
    order: [
        function(o) { o.unchanged('type', 'Cannot change the type of an entity') },
        function(o) { o.require('order-type'); },
        function(o) { o.orderRequireCustomerName() },
        function(o) { o.require('date'); },
        function(o) { o.require('warehouse-name'); },
        function(o) { o.require('items'); },
        function(o) { o.require('item-names'); },
        function(o) { o.require('item-skus'); },
        function(o) { o.unchanged('date'); },
        function(o) { o.validateOrderItemCosts(); },
        function(o) { o.validateShipments() }
    ],
    inventory: [
        function(o) { o.unchanged('type', 'Cannot change the type of an entity') },
        function(o) { o.require('date'); },
        function(o) { o.require('warehouse-name'); },
        function(o) { o.require('items'); },
        function(o) { o.require('item-names'); },
        function(o) { o.require('item-skus'); },
        function(o) { o.require('section'); },
        function(o) { o.unchanged('section'); },
        function(o) { o.validate_items_against(['item-names', 'item-skus']); }
    ]
};


function Validator(newDoc, oldDoc, userCtx) {

    var that = this;

    this.require = function(field, message) {
        if ((newDoc[field] == undefined) || (newDoc[field] == '')) {
            that.isValid = false;
            throw({ forbidden: (message || ('Document must have a "'+field+'" value')),
                    field: field,
                    reason: 'Required' });
        }
    };

    this.exists = function(field, message) {
        if (! (field in newDoc)) {
            that.isValid = false;
            throw({ forbidden: (message || ('Document must have a '+field+' field')),
                    field: field,
                    reason: 'Required' });
        }
    };

    this.unchanged = function(field, message) {
        if (oldDoc && JSON.stringify(oldDoc[field]) !== JSON.stringify(newDoc[field])) {
            that.isValid = false;
            throw({ forbidden: (message || ('Field '+field+' cannot be changed')),
                    field: field,
                    reason: 'Changed' });
        }
    };

    this.enforce = function(bool, message) {
        if (!bool) {
            that.isValid = false;
            throw({ forbidden: (message || 'Boolean assertion failed') });
        }
    };

    // Needs JQuery and the couchapp attribute set
    this.unique = function(field, message) {
        if ((jQuery === undefined) || (that.couchapp === undefined)) {
            return true;
        }

        var d = jQuery.Deferred();

        var value = newDoc[field];
        that.couchapp.view((newDoc.type)+'s-by-'+field, {
            key: value,
            success: function(data) {
                if (data.rows.length === 0) {
                    d.resolve();
                } else {
                    data.rows.forEach(function(row) {
                        if (row.id !== newDoc._id) {
                            d.reject({ forbidden: (message || (field + ' must be unique for ' + newDoc.type + ' documents')),
                                        field: field,
                                        reason: 'Duplicate' });
                        }
                    });
                    d.resolve();
                }
            },
            error: function(status, reason, message) {
                d.reject({ forbidden: message,
                            field: field,
                            reason: 'Duplicate check failed'});
            }
        });
        return d.promise();
    };


    // for order-type docs, make sure the barcodes that appear in 'items'
    // also appear in the other named fields, and vice-versa
    this.validate_items_against = function(fields) {
        var varcode, i, other;

        for (barcode in newDoc.items) {
            // quantities must be non-zero
            if (! newDoc.items[barcode]) {
                that.isValid = false;
                throw({ forbidden: 'Quantity for barcode ' + barcode + ' must be non-zero'});
            }

            // And be in these other fields
            for (i = 0; i < fields.length; i++) {
                other = fields[i];
                if (! (barcode in newDoc[ other ])) {
                    that.isValid = false;
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the quantity list but not the ' + other + ' list'});
                }
            }
        }

        for (i = 0; i < fields.length; i++) {
            other = fields[i];
            for (barcode in newDoc[ other ]) {
                if (! (barcode in newDoc.items)) {
                    that.isValid = false;
                    throw({ forbidden: 'Barcode ' + barcode + ' appears in the ' + other + ' list but not the quantity list'});
                }
            }
        }
    }

    this.orderRequireCustomerName = function() {
        if (newDoc['order-type'] != 'warehouse-transfer') {
            // warehouse transfers don't have customers
            that.require('customer-name');
        }
    };

    this.validateOrderItemCosts = function() {
        for (barcode in newDoc['item-costs']) {
            // item-costs must be an integer (cents)
            if (Math.round(newDoc['item-costs'][barcode]) != newDoc['item-costs'][barcode]) {
                that.isValid = false;
                throw({ forbidden: 'Cost for barcode ' + barcode + ' must be an integer number of cents'});
            }
        }

        if ((newDoc['order-type'] == 'inventory-correction')
            || (newDoc['order-type'] == 'warehouse-transfer')) {

            that.validate_items_against(['item-names', 'item-skus']);
        } else {
            that.require('customer-id');
            that.require('warehouse-name');
            that.require('item-costs');
            that.validate_items_against(['item-costs', 'item-names', 'item-skus']);
        }
    };

    this.validateShipments = function() {
        var barcode,
            i,
            thisShipment,
            count = {};

        if (! ('shipments' in newDoc)) {
            return true;
        }

        for (barcode in newDoc.items) {
            count[barcode] = Math.abs(newDoc.items[barcode]);
        }

        for (i = 0; i < newDoc.shipments.length; i++) {
            thisShipment = newDoc.shipments[i];

            that.enforce('items' in thisShipment,
                    'Shipment ' + i + ' has no items list');
            that.enforce('date' in thisShipment,
                    'Shipment ' + i + ' has no date');
            for (barcode in thisShipment.items) {
                that.enforce(barcode in newDoc.items,
                        'Shipment ' + i + ' has barcode ' + barcode + ' which is not in the items list');

                count[barcode] -= Math.abs(thisShipment.items[barcode]);
                that.enforce(count[barcode] >= 0, 'Shipments for barcode ' + barcode + ' are more than the items');
            }
        }
    };

    this.validateInventory = function() {
   };

    this.validate = function() {
        if ((that.validators === undefined) || (that.validators.length === 0)) {
            // Copy from the outer validators list for the appropriate type
            that.validators = [];
            validators[newDoc.type].forEach(function(f) {
                that.validators.push(f);
            });
        }

        while(that.validators.length) {
            var f = that.validators.shift();
            f(that);
        }
        if (that.isValid === undefined) {
            that.isValid = true;
        }
    };

    this.isStillValidating = function() {
        return ((that.validators === undefined) || that.validators.length);
    };

    this.validateAll = function(error) {
        var lastErr;
        error = error || function() {};
        while(that.isStillValidating()) {
            try { that.validate() }
            catch(err) { error(err); lastErr = err };
        }
        if (lastErr) {
            throw(err);
        }
    };

}

exports.Validator = Validator;
