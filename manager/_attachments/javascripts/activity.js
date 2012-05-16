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
        this.use('Form');

        this.helpers({
            showNav: function() {
                $('#navbar .logged-in-menu').show();
            },
            hideNav: function() {
                $('#navbar .logged-in-menu').hide();
            },
        });


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

        this.get('#/edit/item/:id', function(context) {
            var show_q = '_show/editItem';
            if (context.params['id']) {
                show_q += '/' + context.params['id'];
            }
            context.load(show_q)
                    .then(function(content) {
                            var modal = $(content).appendTo(context.$element())
                                                    .modal({backdrop: true, keyboard: true, show: true});
                            modal.on('hidden', function() { modal.remove(); window.history.back() });
                        });
        });
        this.post('#/edit/item/:id', function(context) {
            var validationError = 0,
                this_id = context.params['id'],
                modal = $('.modal');

            var markError = function(field, message) {
                $('fieldset#' + field + '-field').addClass('error');
                $('input#' + field).after('<span class="help-inline"><i class="icon-exclamation-sign"></i>&nbsp;'
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
                couchapp.view('items-by-'+field, {
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
                var doc = { type: 'item' };
                if (context.params['_id']) {
                    doc['_id'] = context.params['_id'];
                    doc['_rev'] = context.params['_rev'];
                }
                doc['barcode']      = context.params['barcode'];
                doc['name']         = context.params['name'];
                doc['sku']          = context.params['sku'];
                doc['description']  = context.params['description'];
                doc['cost-cents']   = context.params['cost'] * 100;
                doc['price-cents']  = context.params['price'] * 100;
                $.log(doc);

                couchapp.db.saveDoc(doc, {
                    success: function(data) {
                        modal.modal('hide');
                        showNotification('success', 'Item saved');
                    },
                    error: function(status) {
                        showNotification('error', 'Problem saving');
                    }
                });
            };

            checkFieldHasValue('sku');
            checkFieldHasValue('barcode');
            checkFieldHasValue('name');

            checkDuplicateField('barcode',
                function() { checkDuplicateField('sku',
                    function() { saveItem(context) }
                )}
            );

        });

        this.get('#/delete/:thing/:id', function(context) {

        });

    });

    activity.run('#/');

});
