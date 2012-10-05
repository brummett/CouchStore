// Order: functions to help managing order objects

function Order() { }

Order.newFromDoc = function(doc) {

    if (doc && (doc.type === 'order')) {
        order = new Order;
        order.__doc = doc;
        var orderNumber = doc._id.substr(6);    // the order's ID starts with 'order-'
            orderType   = doc['order-type'];

        // orderNumber and orderType are immutable
        order.orderNumber = function() { return orderNumber };
        order.orderType   = function() { return orderType };

        return order;
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
    return this.__doc.items[barcode];
}

Order.prototype.nameForBarcode = function(barcode) {
    return this.__doc['item-names'][barcode];
}

Order.prototype.skuForBarcode = function(barcode) {
    return this.__doc['item-skus'][barcode];
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

Order.prototype.warehouseId = function(id) {
    if (id !== undefined) {
        // Maybe we should have a way to link the name and warehouse id?
        this.__doc['warehouse-id'] = id;
    }
    return this.__doc['warehouse-id'];
}

Order.prototype.customerName = function(name) {
    if (name !== undefined) {
        // Maybe we should have a way to link the name and customer id?
        this.__doc['customer-name'] = name;
    }
    return this.__doc['customer-name'];
}

Order.prototype.isShippable = function () {
    if (this.orderType() === 'sale') {
        return true;
    } else {
        return false;
    }
};

// Does this order have any shipments?
Order.prototype.hasShipments = function () {
    return (('shipments' in this.__doc) && this.__doc.shipments.length);
};

module.exports = Order;
