function(doc) {
    var result = {};
    if (doc.type == 'warehouse') {
        result = { name: doc.name, email: doc.email, phone: doc.phone };
        emit(doc.name, result);
        emit(doc.email, result);
        emit(doc.phone, result);
    }
}
