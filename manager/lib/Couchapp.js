function toJSON(obj) {
    return obj !== null ? JSON.stringify(obj) : null;
}

function encodeOptions(options) {
    // Convert an object into form data
    var buf = [];
    if (typeof(options) === "object" && options !== null) {
        for (var name in options) {
            if ($.inArray(name, ["error", "success", "beforeSuccess", "akaxStart"]) >= 0)
                continue;
            var value = options[name];
            if ($.inArray(name, ["key", "startkey", "endkey"]) >= 0) {
                value = toJSON(value);
            }
            buf.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
        }
    }
    return buf.length ? "?" + buf.join("&") : "";
}

exports.update = function(name, data, options) {
    var docid = data._id ? data._id : null;
    var options = options || {};
    var type = 'POST';
    var url = '/' + this.db.name + '/' + this.design.doc_id + '/_update/' + name + encodeOptions(options);

    if (docid) {
        type = 'PUT';
        url = url + '/' + docid;
        delete data._id;
    }
    delete data._rev;

    $.ajax( $.extend({  type: type,
                        url: url,
                        async: true,
                        dataType: 'json',
                        data: data,
                        contentType: 'application/x-www-form-urlencoded',
                    }, options));
};

// list() has a bug where the success, error methods don't get passed down to
// the ultimate ajax () call
exports.list = function(list, view, options) {
    options = options || {};
    var type = 'GET';
    var data = null;
    var url = this.db.uri + '/' + this.design.doc_id + '/_list/' + list + '/' + view + encodeOptions(options);
    if (options['keys']) {
        type = 'POST';
        var keys = options['keys'];
        delete options['keys'];
        data = JSON.stringify({ keys: keys });
    }
    $.ajax( $.extend({
        url: url,
        type: type,
        async: true,
        dataType: 'json'
        }, options));
};

exports.show = function(show, docid, options) {
    options = options || {};
    var url = this.db.uri + '/' + this.design.doc_id + '/_show/' + show + '/' + docid + encodeOptions(options);

    $.ajax( $.extend({
        url: url,
        type: 'GET',
        async: true,
        dataType: 'json' }),
        options);
};

