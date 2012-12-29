function(doc) {
    var Order = require('views/lib/Order'),
        order = Order.newFromDoc(doc);

    if (order) {
        emit(order.orderNumber(), order.orderType());
    }
}
