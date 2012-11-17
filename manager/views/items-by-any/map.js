// For use by the 'items' show, and use d to generate the
// Inventory Items list page
function(doc) {
    var results = {};
    if (doc.type == 'item') {
        results = { name: doc.name, sku: doc.sku, barcode: doc.barcode,
                    desc: doc.desc, 'is-obsolete': doc['is-obsolete'] };
        emit(doc.name, results);
        emit(doc.barcode, results);
        emit(doc.sku, results);
        emit(doc.desc, results);
    }
}
