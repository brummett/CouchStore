// This view has the problem that it lists the same document as the value
// twice: once for firsrname lastname and again for lastname firstname
// It seems that couchdb has no good way to make it unique in the view, so
// the client code will have to do that
//
// Values are whether the customer is-taxable
function(doc) {
    var result;
    if (doc.type == 'customer') {
        result = { 'is-taxable': doc['is-taxable'],
                    address: doc.address,
                    name: doc.firstname + ' ' + doc.lastname
                };
        if (doc.firstname && doc.lastname) {
            emit(doc.firstname + ' ' + doc.lastname, result);
            emit(doc.lastname + ' ' + doc.firstname, result);
        } else {
            emit ((doc.firstname ? doc.firstname : doc.lastname), result);
        }
    }
}
