function(doc) {
    if (doc.type == 'warehouse') {
        emit (doc.name, null);
    }
}
