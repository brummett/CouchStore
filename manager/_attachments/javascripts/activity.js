$.couch.app(function(couchapp) {

    var showNotification = function(type, message) {
        // Type can be error, warning, success, info
        var alertClass = 'alert-' + type, notification = $('#inline-notification');
        notification
            .empty()
            .addClass(alertClass)
            .append(message)
            .show()
            .animate({ opacity: 0}, 5000, function() { notification.removeClass(alertClass) });
    };


    var account = $.sammy('#account', function() {
        var account = this;

        this.use('Template');

        var _current_user = false;

        this.bind('run', function(context) {
            this.init();
        });

        this.helpers( {
            isLoggedIn: function() {
                return !! _current_user;
            },
            doWithUser: function(callback) {
                callback(_current_user);
            },
            init: function(callback) {
                $.couch.session({
                    success: function(session) {
                        if (session.userCtx && session.userCtx.name) {
                            var prevName = _current_user;
                            _current_user = session.userCtx;
                            if (! _current_user || (_current_user.name != prevName)) {
                                // changed from loggout out to logged in, or switched user
                                account.trigger('loggedIn');
                            }
                            if (callback) {
                                callback(_current_user);
                            }
                        } else {
                            account.trigger('loggedOut');
                        }
                    }
                });
            },
            doWithValidUser: function(callback, force) {
                var user = this;
                if (!this._current_user || force) {
                    this.init(callback);
                } else {
                    if (callback) {
                        callback(_current_user);
                    }
                }
            },
            login: function(name, password) {
                var context = this;
                $.couch.login({
                    name: name,
                    password: password,
                    success: function(s) {
                        context.doWithValidUser(function() { account.trigger('loggedIn') }, true );
                    },
                    error: function(code, error, reason) {
                        account.trigger('loggedOut');
                        showNotification('error', reason);
                    }
                });
            },
            logout: function() {
                var user = this;
                $.couch.logout({
                    success: function() {
                        user._current_user = false;
                        account.trigger('loggedOut');
                    },
                    error: function(code, error, reason) {
                        showNotification('error', reason);
                    }
                });
            },
            signup: function(name, password) {
                var user = this;
                $.couch.signup({name: name}, password, {
                    success: function() {
                        this.login(name, password);
                    },
                    error: function() {
                        showNotification('error', reason);
                    }
                });
            }
        });  // end helpers

        this.get('#/login', function(context) {
            context.render('templates/account-loginForm.template')
                    .swap(function() {
                            context.$element('input').first().focus();
                            context.$element('button#cancel').click(function() { context.trigger('loggedOut')})
                          });
                    
        });
        this.post('#/login', function(context) {
            this.login(context.params['name'], context.params['password']);
        });
        this.bind('loggedIn', function(context) {
            this.render('templates/account-loggedIn.template', {user: _current_user}).swap();
            activity.trigger('loggedIn');
            this.redirect('#/');
        });

        this.get('#/signup', function(context) {
            context.render('templates/account-signupForm.template')
                    .swap(function() {
                            context.$element('input').first().focus();
                            context.$element('button#cancel').click(function() { context.trigger('loggedOut')})
                          });
        });
        this.post('#/signup', function(context) {
            this.signup(context.params['name'], context.params['password']);
        });

        this.get('#/logout', function(context) {
            this.logout();
        });
        this.bind('loggedOut', function(context) {
            this.render('templates/account-loggedOut.template').swap();
            activity.trigger('loggedOut');
            this.redirect('#/');
        });

        account.run();
    });


    var activity = $.sammy('#activity', function() {
        var activity = this;

        this.use('Template');
        this.use('Title');

        this.helpers({
            showNav: function() {
                $('#navbar .logged-in-menu').show();
            },

            hideNav: function() {
                $('#navbar .logged-in-menu').hide();
            },

            editItemModal: function(type, item_id) {
                var show_q = '_show/edit-' + type,
                    d = jQuery.Deferred(),
                    context = this;
                if (item_id) {
                    show_q += '/' + item_id;
                }
                $.get(show_q)
                    .then(function(content) {
                        var content = $(content),
                            orderTable = $('#order-display'),
                            modal;

                        modal = content.appendTo(context.$element())
                                           .modal({backdrop: true, keyboard: true, show: true});
                        modal.on('shown', function() { modal.find('input:text:first').focus() });
                        modal.on('hidden',
                                function() {
                                    modal.remove();
                                    d.resolve(modal);
                                });
                    });
                return d;
            }
        });

        function warehouseList (callback) {
            couchapp.view('warehouses-by-name', {
                success: function(data) {
                    callback(data.rows);
                }
            });
        }

//        this.around({ except: /#\/(login|signup)/ }, function(callback) {
//            var context = this;
//            if (User.isLoggedIn()) {
//                callback();
//            } else {
//                this.trigger('loggedOut');
//            }
//            return false;
//        });

        this.bind('run', function() { 

        });

        this.bind('loggedIn', function(e) {
            var context = this;
            var account_context = new account.context_prototype();
            account_context.doWithUser(function(user) {
                if (user) {
                    context.showNav();
                } else {
                    context.hideNav();
                }
            });
        });

        this.bind('loggedOut', function(context) {
            this.$element().empty();
            this.hideNav();
            showNotification('info','Logged Out');
        });

        this.before({ except: /#\/(login|signup)/ }, function() {

            //User.doWithValidUser(this.showNav);
        });

        this.get('#/', function(context) {
            true;
        });

        this.get('#/receive-shipment', function(context) {
            warehouseList(function(warehouses) {
                var now = new Date;
                var month = now.getMonth() + 1;
                var dateStr = now.getFullYear() + '-'
                                    + (month < 10 ? '0' : '') + month + '-'
                                    + (now.getDate() < 10 ? '0' : '') + now.getDate();
                context.render('templates/activity-receive-shipment.template',
                                 { currentDate: dateStr , warehouses: warehouses })
                        .swap()
                        .then(function() {
                            var w = new OrderWidget(couchapp, context, activity);
                        });
            });
        });

        this.post('#/receive-shipment', function(context) {
            1;

        });

        this.get('#/list-items', function(context) {
            context.log("In list-items");

            var searchTerm = context.params['search-query'];
            var filter = searchTerm ? function(doc) {
                                            return ((doc.name && (doc.name.toString().toLowerCase().indexOf(searchTerm) > -1 ))
                                                || (doc.sku && (doc.sku.toString().toLowerCase().indexOf(searchTerm) > -1 ))
                                                || (doc.barcode && (doc.barcode.toString().toLowerCase().indexOf(searchTerm) > -1 ))
                                                || (doc.desc && (doc.desc.toString().toLowerCase().indexOf(searchTerm) > -1 ))
                                            ); }
                                    : function (doc) { return 1; };
            couchapp.view('items-by-name', {
                include_docs: true,
                success: function(data) {
                    var items = [];
                    for (var i in data.rows) {
                        var doc = data.rows[i].doc;
                        if (filter(doc)) {
                            items.push(doc);
                        }
                    }
                    searchTerm = searchTerm || '';
                    context.render('templates/activity-listItems.template', { items: items, searchTerm: searchTerm })
                            .swap();
                }
            });
        });

        this.get('#/list-customers', function(context) {
            context.log("In list-customers");

            var searchTerm = context.params['search-query'];
            var showResults = function(data) {
                var items = [],
                    shown = {};
                for (var i in data.rows) {
                    var doc = data.rows[i].doc;
                    if (! (doc._id in shown)) {
                        doc.name = doc.lastname + ', ' + doc.firstname;
                        items.push(doc);
                        shown[doc._id] = 1;
                    }
                }
                searchTerm = searchTerm || '';
                context.render('templates/activity-listCustomers.template', { items: items, searchTerm: searchTerm })
                        .swap();
            };

            if (searchTerm) {
                couchapp.view('customers-by-any-name', {
                    startkey: searchTerm,
                    endkey: searchTerm + 'ZZZZZZZZZ',
                    include_docs: true,
                    success: showResults
                });
            } else {
                couchapp.view('customers-by-any-name', {
                    include_docs: true,
                    success: showResults
                });
            }
        });

        this.get('#/list-warehouses', function(context) {
            context.log('In list-warehouses');

            var searchTerm = context.params['search-query'];
            var showResults = function(data) {
                var items = [],
                    shown = {};
                for (var i in data.rows) {
                    var doc = data.rows[i].doc;
                    if (! (doc._id in shown)) {
                        items.push(doc);
                        shown[doc._id] = 1;
                    }
                }
                searchTerm = searchTerm || '';
                context.render('templates/activity-listWarehouses.template', { items: items, searchTerm: searchTerm })
                        .swap();
            };

            if (searchTerm) {
                couchapp.view('warehouses-by-name', {
                    startkey: searchTerm,
                    endkey: searchTerm + 'ZZZZZZZZZ',
                    include_docs: true,
                    success: showResults
                });
            } else {
                couchapp.view('warehouses-by-name', {
                    include_docs: true,
                    success: showResults
                });
            }
        });

        this.get(/#\/edit\/(.*)\/(.*)/, function(context) {
            var type = context.params['splat'][0],
                item_id = context.params['splat'][1];

            this.editItemModal(type, item_id)
                .then(function(modal) { window.history.back() });
        });

        this.post(/#\/edit\/(.*)\/(.*)/, function(context) {
            var validationError = 0,
                type = context.params['splat'][0],
                this_id = context.params['splat'][1],
                modal = $('.modal');

            var markError = function(field, message) {
                var fieldset = $('fieldset#' + field + '-field');
                fieldset.addClass('error');
                $('[name=' + field + ']', fieldset).after('<span class="help-inline label label-important"><i class="icon-exclamation-sign icon-white"></i>&nbsp;'
                                            + message + '</span>');
            };
            var checkFieldHasValue = function(field) {
                var value = context.params[field];
                if ((value == undefined) || (value == '')) {
                    markError(field, 'Required');
                    validationError = 1;
                }
            };
            var checkDuplicateField = function(field, callback) {
                var value = context.params[field];
                couchapp.view(type + 's-by-'+field, {
                    key: value,
                    success: function(data) {
                        if (data.rows.length && data.rows[0].id != this_id) {
                            // Found an item with the form's sku/barcode and it's a different doc id
                            markError(field, 'Duplicate');
                            validationError = 1;
                        }
                        callback();
                    }
                });
            };
            var saveItem = function(context) {
                if (validationError) {
                    $.log('not saving because of errors');
                    return false;
                }
                var doc = { type: type };
                if (context.params['_id']) {
                    doc['_id'] = context.params['_id'];
                    doc['_rev'] = context.params['_rev'];
                }
                if (type == 'item') {
                    doc['barcode']      = context.params['barcode'];
                    doc['name']         = context.params['name'];
                    doc['sku']          = context.params['sku'];
                    doc['description']  = context.params['description'];
                    doc['cost-cents']   = context.params['cost'] * 100;
                    doc['price-cents']  = context.params['price'] * 100;
                } else if (type == 'customer') {
                    doc['firstname'] = context.params['firstname'];
                    doc['lastname'] = context.params['lastname'];
                    doc['address'] = context.params['address'];
                    doc['istaxable'] = (context.params['istaxable'] == 'on' ? 1 : 0);
                    doc['phonenumber'] = context.params['phonenumber'];
                    doc['alternatephonenumber'] = context.params['alternatephonenumber'];
                    doc['email'] = context.params['email'];
                    doc['notes'] = context.params['notes'];
                } else if (type == 'warehouse') {
                    doc['name'] = context.params['name'];
                    doc['address'] = context.params['address'];
                    doc['phonenumber'] = context.params['phonenumber'];
                    doc['alternatephonenumber'] = context.params['alternatephonenumber'];
                    doc['email'] = context.params['email'];
                    doc['notes'] = context.params['notes'];
                }
                $.log(doc);

                couchapp.db.saveDoc(doc, {
                    success: function(data) {
                        modal.modal('hide');
                        activity.trigger('item-updated', doc);
                        showNotification('success', type + ' saved');
                    },
                    error: function(status, reason, message) {
                        showNotification('error', 'Problem saving ' + type + ': ' + message);
                    }
                });
            };

            // Remove any errors from the last time they tried to submit
            $('fieldset.error span.help-inline', context.$element()).remove();

            if (type == 'item') {
                checkFieldHasValue('sku');
                checkFieldHasValue('barcode');
                checkFieldHasValue('name');

                checkDuplicateField('barcode',
                    function() { checkDuplicateField('sku',
                        function() { saveItem(context) }
                    )}
                );
            } else if (type == 'customer') {
                checkFieldHasValue('firstname');
                checkFieldHasValue('lastname');
                saveItem(context);
            } else if (type == 'warehouse') {
                checkFieldHasValue('name');
                checkFieldHasValue('address');
                checkDuplicateField('name',
                    function() { saveItem(context) }
                );
            }
                
        });

        this.get('#/delete/:thing/:id', function(context) {
            var docid = context.params['id'];
            var thing = context.params['thing'];
            couchapp.db.openDoc(docid, { success: function(doc) {
                if (doc.type != thing) {
                    showNotification('error', 'Document ' + docid + ' is not a ' + thing);
                    return false;
                }
                $.get(couchapp.db.uri + couchapp.ddoc._id + '/templates/modal-delete-thing.template')
                    .then( function(content) {
                        var name = (doc.type == 'customer'
                                        ? (doc.firstname + ' ' + doc.lastname)
                                        : doc.name);
                        content = context.template(content,{ id: docid, thing: thing, name: name });
                        var modal = $(content).appendTo(context.$element())
                                       .modal({backdrop: true, keyboard: true, show: true});
                        modal.on('hidden', function() {
                                                modal.remove();
                                                window.history.back(); });
                        modal.find('#delete-confirm')
                            .click( function(event) {
                                modal.modal('hide');
                                couchapp.db.removeDoc(doc, {
                                    success: function() {
                                        showNotification('success', context.params['thing'] + ' removed');
                                    },
                                    error: function(status) {
                                        context.log('delete failed after removeDoc');
                                        context.log(doc);
                                        context.log(status);
                                        showNotification('error', 'Delete failed');
                                    }
                                })
                                event.preventDefault();
                            });

                    });
            }});
        });

    });

    activity.run('#/');

});
