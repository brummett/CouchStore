// items-by-sku map
function(doc) {
    if (doc.type == 'item') {
        emit(doc.sku, null);
    }
}
