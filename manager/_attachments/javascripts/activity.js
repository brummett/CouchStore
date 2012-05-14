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
            context.render('templates/activity-listItems.template')
                    .swap( function() {
                                // After creating the list-items activity, trigger a search
                                // on an empty string which will populate the initial list
                                context.$element('form#search').trigger('submit');
                        });
        });

        this.post('#/search/:type', function(context) {
            var tableContainer = $('#search-results');
            var searchTerm = $('#search-query').val();

            var filter, viewName, rowTemplate;
            if (context.params['type'] == 'item') {
                viewName = 'items-by-name',
                rowTemplate = 'templates/activity-listItems-itemRow.template';
                filter = searchTerm ? function(doc) { 
                                            return ((doc.name && (doc.name.toString().toLowerCase().indexOf(searchTerm) > -1 ))
                                                || (doc.sku && (doc.sku.toString().toLowerCase().indexOf(searchTerm) > -1 ))
                                                || (doc.barcode && (doc.barcode.toString().toLowerCase().indexOf(searchTerm) > -1 ))
                                                || (doc.desc && (doc.desc.toString().toLowerCase().indexOf(searchTerm) > -1 ))
                                            ); }
                                    : function (doc) { return 1; };
            }

            context.load(rowTemplate)
                .then(function(templateContent) {
                        couchapp.view(viewName, {
                            include_docs: true,
                            success: function(data) {
                                tableContainer.empty();
                                for (var i in data.rows) {
                                    var doc = data.rows[i].doc;
                                    var item_rows = [];
                                    if (filter(doc)) {
                                        tableContainer.append(context.template(templateContent, {item: doc}));
                                    }
                                }
                            }
                        });
                });
            })

        this.get('#/edit/:type/:id', function(context) {

        });
        this.post('#/edit/:thing/:id', function(context) {

        });

        this.get('#/delete/:thing/:id', function(context) {

        });

    });

    activity.run('#/');

});
