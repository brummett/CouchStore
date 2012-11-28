// validate.js
// Helpers for validating documents

function Validator(newDoc, oldDoc, userCtx) {

    var that = this;

    if (toJSON === undefined) {
        toJSON = function(obj) { JSON.stringify(obj) };
    }

    this.require = function(field, message) {
        if (newDoc[field] === undefined)
            throw({ forbidden: (message || ('Document must have a "'+field+'" value')),
                    field: field,
                    reason: 'Required' });
    };

    this.exists = function(field, message) {
        if (! (field in newDoc))
            throw({ forbidden: (message || ('Document must have a '+field+' field')),
                    field: field,
                    reason: 'Required' });
    };

    this.unchanged = function(field, message) {
        if (oldDoc && toJSON(oldDoc[field]) !== toJSON(newDoc[field]))
            throw({ forbidden: (message || ('Field '+field+' cannot be changed')),
                    field: field,
                    reason: 'Changed' });
    };

    this.enforce = function(bool, message) {
        if (!bool)
            throw({ forbidden: (message || 'Boolean assertion failed') });
    };


    // for order-type docs, make sure the barcodes that appear in 'items'
    // also appear in the other named fields, and vice-versa
    this.validate_items_against = function(fields) {
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

    this.validateOrder = function() {
        var barcode;

        that.require('order-type');
        if (newDoc['order-type'] != 'warehouse-transfer') {
            // warehouse transfers don't have customers
            that.require('customer-name');
        }
        that.require('date');
        that.require('warehouse-name');
        that.require('items');
        that.require('item-names');
        that.require('item-skus');

        that.unchanged('date');

        for (barcode in newDoc['item-costs']) {
            // item-costs must be an integer (cents)
            if (Math.round(newDoc['item-costs'][barcode]) != newDoc['item-costs'][barcode]) {
                throw({ forbidden: 'Cost for barcode ' + barcode + ' must be an integer number of cents'});
            }
        }

        if ((newDoc['order-type'] == 'inventory-correction')
            || (newDoc['order-type'] == 'warehouse-transfer')) {

            that.validate_items_against(['item-names', 'item-skus']);
        } else {
            that.require('customer-id');
            that.require('warehouse-id');
            that.require('item-costs');
            that.validate_items_against(['item-costs', 'item-names', 'item-skus']);
        }

        if ('shipments' in newDoc) {
            that.validateShipments();
        }
    };

    this.validateItem = function() {
        that.require('barcode');
        that.require('name');
        that.require('sku');
    };

    this.validateCustomer = function() {
        that.require('firstname');
    };

    this.validateWarehouse = function() {
        that.require('name');
    };

    this.validateShipments = function() {
        var barcode,
            i,
            thisShipment,
            count = {};

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
        that.require('date');
        that.require('warehouse-name');
        that.require('warehouse-id');
        that.require('items');
        that.require('item-names');
        that.require('item-skus');

        that.unchanged('date');

        that.validate_items_against(['item-names', 'item-skus']);
    };

    var validators = {
        item: 'validateItem',
        customer: 'validateCustomer',
        warehouse: 'validateWarehouse',
        order: 'validateOrder',
        inventory: 'validateInventory'
    };

    this.validate = function() {
        var validator = that[ validators[ newDoc.type ] ];
        validator();
    };
}

exports.Validator = Validator;
