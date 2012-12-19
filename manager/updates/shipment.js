// create/update a shipment
function(doc,req) {
    var Updates = require('lib/updateHelpers');

    if (! doc) {
        // Creating a new thing
        return [ null, { code: 404, json: { reason: 'No document with that id'}}];
    } else if (doc.type !== 'order') {
        return [ null, { code: 403, json: { reason: doc._id+' is not an order'}}];
    }

    var shipmentNum = Updates.valueFor('s', req),
        thisShipment,
        matches,
        items = {};

    // Go through the params and look for quantities
    function getQuantitiesFrom(props) {
        for (prop in props) {
            matches = /scan-(\w+)-quan/.exec(prop);
            if (matches && matches.length) {
                var count = parseInt(props[prop]);
                if (count !== 0) {
                    items[matches[1]] = count;
                }
            }
        }
    }
    getQuantitiesFrom(req.query);
    getQuantitiesFrom(req.form);

    if (shipmentNum === null) {
        // Creating a new shipment
        thisShipment = { };
        if (doc.shipments === undefined) {
            doc.shipments = [ thisShipment ];
        } else {
            doc.shipments.push(thisShipment);
        }

    } else {
        // updating a shipment
        thisShipment = doc.shipments[shipmentNum];
    }

    thisShipment.date = Updates.valueFor('date', req);
    thisShipment.box = parseInt(Updates.valueFor('box', req));
    thisShipment.size = Updates.valueFor('size', req);
    thisShipment.weight = Updates.valueFor('weight', req);
    thisShipment.items = items;

    return [doc, JSON.stringify({ success: true })];
}
