function(newDoc, oldDoc, userCtx) {

    var Validator = require('lib/validate'),
        v;

    log(Validator);
    v = new Validator.Validator(newDoc, oldDoc, userCtx);
    
    v.enforce(userCtx.name, 'You must be logged in to make changes');

    if (newDoc._deleted) return;

    v.require('type');
    v.validate();
}
