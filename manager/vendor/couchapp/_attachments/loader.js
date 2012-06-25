
function couchapp_load(scripts) {
  for (var i=0; i < scripts.length; i++) {
    document.write('<script src="'+scripts[i]+'"><\/script>')
  };
};

couchapp_load([
  "/_utils/script/sha1.js",
  "/_utils/script/json2.js",
   "vendor/jquery/jquery-1.7.2.js",
  "/_utils/script/jquery.couch.js",
  "vendor/couchapp/jquery.couch.app.js",
  "vendor/couchapp/jquery.couch.app.util.js",
  "vendor/couchapp/jquery.mustache.js",
  "vendor/couchapp/jquery.evently.js",
  "vendor/sammy.js/sammy.js",
  "vendor/sammy.js/sammy.template.js",
  "vendor/sammy.js/sammy.title.js",
  "vendor/sammy.js/sammy.form.js",
  "vendor/bootstrap/bootstrap.js"
  "vendor/bootstrap/bootstrap-typeahead.js"
]);
