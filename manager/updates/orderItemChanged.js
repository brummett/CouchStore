// orderItemChanged
// Called when an Item is edited and its barcode, sku or name changes
// Requires params:
//    field: barcode, name or sku
//    barcode: barcode of the change item, or original barcode if changing the barcode
//    value: the new value
function(doc, req) {
    if (!doc) {
        return [ null, { code: 404, json: { reason: 'No order to change' }} ];

    } else if (doc.type !== 'order') {
        return [ null, { code: 403, json: { reason: 'Not an order' }}];

    }

    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc),
        field = req.query.field,
        barcode = req.query.barcode,
        value = req.query.value;

    if (field === 'barcode') {
        order.itemBarcodeChanged(barcode, value);

    } else if (field === 'sku') {
        order.itemSkuChanged(barcode, value);

    } else if (field === 'name') {
        order.itemNameChanged(barcode, value);

    } else {
        return [ null, { code: 403, json: { reason: 'Cannot change field'+field+' through orderItemChanged' }}];
    }

    return [ order.doc(), JSON.stringify({ success: true })];
}
