// Test the order module
var Order = require('views/lib/Order');
var assert = require('assert');

describe('Order module', function() {
    var order = {};

    before(function() {
        order = Order.newFromDoc({  _id: 'order-123',
                                    type: 'order',
                                    'order-type':'sale',
                                    items: { '123': 1, '456': 2 },
                                    'item-names': {'123': 'foo', '456': 'bar' },
                                    'item-skus': {'123': 'abc', '456': 'def' },
                                    'item-costs': {'123': 100, '456': 200 },
                                    shipments: [
                                        {   box: 1,
                                            items: { '123': 1 } }
                                    ],
                                    'warehouse-name': 'home',
                                    'customer-name': 'Bob Smith',
                                    'date': '2012-01-02',
                                    'customer-address': '123 main st',
                                    'is-taxable': false,
                                    'shipping-service-level': 'fast',
                                    'order-source': 'friend',
                                    'shipping-charge': 999,
                                });
    });

    it('creates an Order object', function() {
        assert.ok(order);
    });

    it('has an order number', function() {
        assert.equal(order.orderNumber(), '123');
    });

    it('has an order type', function() {
        assert.equal(order.orderType(), 'sale');
    });

    it('can retrieve barcodes', function() {
        var barcodes = order.barcodes();
        barcodes.sort();
        assert.deepEqual(order.barcodes(), ['123','456']);
    });

    it('can query quantities', function() {
        assert.equal(order.quantityForBarcode('123'), 1);
        assert.equal(order.quantityForBarcode('456'), 2);
        assert.equal(order.quantityForBarcode('789'), null);
    });

    it('can query names', function() {
        assert.equal(order.nameForBarcode('123'), 'foo');
        assert.equal(order.nameForBarcode('456'), 'bar');
        assert.equal(order.nameForBarcode('789'), null);
    });

    it('can query skus', function() {
        assert.equal(order.skuForBarcode('123'), 'abc');
        assert.equal(order.skuForBarcode('456'), 'def');
        assert.equal(order.skuForBarcode('789'), null);
    });

    it('can query costs', function() {
        assert.equal(order.costForBarcode('123'), 100);
        assert.equal(order.costForBarcode('456'), 200);
        assert.equal(order.costForBarcode('789'), null);
    });
    
    it('has shipments', function() {
        assert.ok(order.hasShipments());
    });

    it('does not have shipments', function() {
        delete order.__doc.shipments;
        assert.ok(! order.hasShipments());
    });

    it('has 0 shipments', function() {
        order.__doc.shipments = [];
        assert.ok(! order.hasShipments());
    });

    it('can get date', function() {
        assert.equal(order.date(), '2012-01-02');
        order.date('1999-12-31');
        assert.equal(order.date(), '1999-12-31');
    });

    it('can get warehouse', function() {
        assert.equal(order.warehouseName(), 'home');
        order.warehouseName('work');
        assert.equal(order.warehouseName(), 'work');
    });

    it('can get customer', function() {
        assert.equal(order.customerName(), 'Bob Smith');
        order.customerName('Fred Jones');
        assert.equal(order.customerName(), 'Fred Jones');
    });
});
