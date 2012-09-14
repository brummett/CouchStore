// This view has the problem that it lists the same document as the value
// twice: once for firsrname lastname and again for lastname firstname
// It seems that couchdb has no good way to make it unique in the view, so
// the client code will have to do that
function(doc) {

    function emit_results(name) {
        var emitted_name = (doc.firstname && doc.lastname)
                        ? (doc.firstname + ' ' + doc.lastname)
                        : (doc.firstname || doc.lastname);
        var results = { name: emitted_name,
                        email: doc.email,
                        phone: doc.phone
                    };
        emit(name, results);
        emit(doc.email, results);
        emit(doc.phone, results);
    }
            
    if (doc.type == 'customer') {
        if (doc.firstname && doc.lastname) {
            emit_results(doc.firstname + ' ' + doc.lastname);
            emit_results(doc.lastname + ' ' + doc.firstname);
        } else {
            emit_results(doc.firstname ? doc.firstname : doc.lastname);
        }
    }
}
