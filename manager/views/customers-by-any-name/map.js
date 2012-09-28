// This view has the problem that it lists the same document as the value
// twice: once for firsrname lastname and again for lastname firstname
// It seems that couchdb has no good way to make it unique in the view, so
// the client code will have to do that
//
// Values are whether the customer is-taxable
function(doc) {
    if (doc.type == 'customer') {
        if (doc.firstname && doc.lastname) {
            emit(doc.firstname + ' ' + doc.lastname, doc['istaxable']);
            emit(doc.lastname + ' ' + doc.firstname, doc['istaxable']);
        } else {
            emit ((doc.firstname ? doc.firstname : doc.lastname), doc['istaxable']);
        }
    }
}
