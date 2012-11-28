// Order: functions to help managing order objects

function Order() { }

Order.newFromDoc = function(doc) {

    if (doc && (doc.type === 'order')) {
        var order = new Order;
        order.__doc = doc;
        var orderNumber = Order.orderNumber(doc),
            orderType   = doc['order-type'];

        // orderNumber and orderType are immutable
        order.orderNumber = function() { return orderNumber };
        order.orderType   = function() { return orderType };

        return order;
    } else {
        return undefined;
    }
}

// An order's ID starts with 'order-'
Order.orderNumber = function(doc) {
    if (typeof(doc) === 'string') {
        return doc.substr(6);
    } else if (typeof(doc) === 'object') {
        return doc._id.substr(6);
    }
}

Order.prototype.barcodes = function() {
    var barcodes = [],
        barcode;
    for (barcode in this.__doc.items) {
        barcodes.push(barcode);
    }
    return barcodes;
}

Order.prototype.quantityForBarcode = function(barcode) {
    if (!('items' in this.__doc)) return null;
    return this.__doc.items[barcode];
}

Order.prototype.unshippedQuantityForBarcode = function(barcode) {
    var count = this.quantityForBarcode(barcode);
    if (count !== null) {
        if (this.orderType() === 'sale') {
            // For sale orders, the quantity is negative
            count = Math.abs(count);
        }

        if (this.hasShipments()) {
            // shipment counts are positive
            this.shipments().forEach(function(shipment) {
                for (var barcode in shipment.items) {
                    count -= shipment.items[barcode];
                }
            });
        }
    }
    return count;
}

Order.prototype.unshippedQuantity = function() {
    var count = 0;
    for (var barcode in this.__doc.items) {
        count += this.unshippedQuantityForBarcode(barcode);
    }
    return count;
}

Order.prototype.nameForBarcode = function(barcode) {
    if (!('item-names' in this.__doc)) return null;
    return this.__doc['item-names'][barcode];
}

Order.prototype.skuForBarcode = function(barcode) {
    if (!('item-skus' in this.__doc)) return null;
    return this.__doc['item-skus'][barcode];
}

Order.prototype.costForBarcode = function(barcode) {
    if (!('item-costs' in this.__doc)) return null;
    return this.__doc['item-costs'][barcode];
}

Order.prototype.shipments = function(barcode) {
    return this.__doc.shipments;
}

// Some mutable properites
Order.prototype.date = function(date) {
    if (date !== undefined) {
        this.__doc.date = date;
    }
    return this.__doc.date;
}

Order.prototype.warehouseName = function(name) {
    if (name !== undefined) {
        // Maybe we should have a way to link the name and warehouse id?
        this.__doc['warehouse-name'] = name;
    }
    return this.__doc['warehouse-name'];
}

Order.prototype.customerName = function(name) {
    if (name !== undefined) {
        // Maybe we should have a way to link the name and customer id?
        this.__doc['customer-name'] = name;
    }
    return this.__doc['customer-name'];
}

Order.prototype.customerAddress = function(a) {
    if (a !== undefined) {
        // Maybe we should have a way to link the name and customer id?
        this.__doc['customer-address'] = name;
    }
    return this.__doc['customer-address'];
}

Order.prototype.customerId = function(id) {
    if (id !== undefined) {
        // Maybe we should have a way to link the name and customer id?
        this.__doc['customer-id'] = id;
    }
    return this.__doc['customer-id'];
}

Order.prototype.isTaxable = function(t) {
    if (t !== undefined) {
        this.__doc['is-taxable'] = t;
    }
    return this.__doc['is-taxable'];
}

Order.prototype.shippingServiceLevel = function(l) {
    if (l !== undefined) {
        this.__doc['shipping-service-level'] = l;
    }
    return this.__doc['shipping-service-level'];
}

Order.prototype.orderSource = function(s) {
    if (s !== undefined) {
        this.__doc['order-source'] = s;
    }
    return this.__doc['order-source'];
}

Order.prototype.shippingCharge = function(s) {
    if (s !== undefined) {
        this.__doc['shipping-charge'] = s;
    }
    return this.__doc['shipping-charge'];
}

Order.prototype.isShippable = function () {
    if ((this.orderType() === 'sale') || (this.orderType() === 'warehouse-transfer')) {
        return true;
    } else {
        return false;
    }
};

Order.prototype.isEditable = function () {
    if (this.orderType() === 'inventory-correction') {
        return false;
    } else {
        return true;
    }
};

// Does this order have any shipments?
Order.prototype.hasShipments = function () {
    return (('shipments' in this.__doc) && this.__doc.shipments.length);
};

Order.prototype.isObsolete = function(s) {
    if (s !== undefined) {
        this.__doc['is-obsolete'] = s;
    }
    return this.__doc['is-obsolete'];
};

module.exports = Order;
