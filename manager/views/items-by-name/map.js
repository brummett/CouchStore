function(doc) {
    if (doc.type == 'item') {
    emit(doc.name, null);
    }
}
