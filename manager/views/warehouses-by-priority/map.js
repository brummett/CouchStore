function(doc) {
    if(doc.type === 'warehouse') {
        emit(doc.priority, doc.name);
    }
}
