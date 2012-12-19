function runActivity(couchapp) {
    // return true if running in the Zombie.js test harness
    var isZombie = /Zombie.js/.test(navigator.userAgent);

    // Make a new function for running _update handlers
    // Adapted from jquery.couch.js code
    if (! couchapp.update) {
        (function() {
            var Couchapp = couchapp.require('lib/Couchapp');
            couchapp.update = Couchapp.update;
            couchapp.list = Couchapp.list;
            couchapp.show = Couchapp.show;
        })();
    }

    function fade(elt, delay, then) {
        delay = delay === undefined ? 5000 : delay;
        if (isZombie) {
            window.setTimeout(function() {
                then();
            });
        } else {
            elt.animate({ opacity: 0},
                        5000,
                        then);
        }
    }

    var showNotification = function(type, message) {
        // Type can be error, warning, success, info
        var alertClass = 'alert-' + type,
            notification = $('#inline-notification');

        notification
            .empty()
            .addClass(alertClass)
            .append(message)
            .show();

            fade(notification, 5000, function() {
                        notification.removeClass(alertClass);
                        notification.hide();
                });
    };

    var errorNotifier = function(message, cb) {
        return function(resp, status, reason) {
            var text = resp.responseText,
                errorObj;
            // Try to deduce what the cause of the error was
            try { errorObj = JSON.parse(resp.responseText); } catch(err) {}
            if (errorObj) {
                if ('reason' in errorObj) {
                    text = errorObj.reason;
                } else if ('error' in errorObj) {
                    text = errorObj.error;
                }
            }

            showNotification('error', message + ': ' + text)
            if (cb) {
                cb();
            }
        }
    };

    var loggedInUser = false;

    var account = $.sammy('#account', function() {
        var account = this;

        this.use('Template');

        this.bind('run', function(context) {
            this.init();
        });

        this.helpers( {
            isLoggedIn: function() {
                return !! loggedInUser;
            },
            doWithUser: function(callback) {
                callback(loggedInUser);
            },
            init: function(callback) {
                $.couch.session({
                    success: function(session) {
                        if (session.userCtx && session.userCtx.name) {
                            var prevName = loggedInUser.name;
                            loggedInUser = session.userCtx;
                            if (! loggedInUser || (loggedInUser.name != prevName)) {
                                // changed from loggout out to logged in, or switched user
                                account.trigger('loggedIn');
                            }
                            if (callback) {
                                callback(loggedInUser);
                            }
                        } else {
                            account.trigger('loggedOut');
                        }
                    }
                });
            },
            doWithValidUser: function(callback, force) {
                var user = this;
                if (!this.loggedInUser || force) {
                    this.init(callback);
                } else {
                    if (callback) {
                        callback(logegdInUser);
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
                    error: errorNotifier('login failed', function() { account.trigger('loggedOut')})
                });
            },
            logout: function() {
                var user = this;
                $.couch.logout({
                    success: function() {
                        user.logegdInUser = false;
                        account.trigger('loggedOut');
                    },
                    error: errorNotifier('logout failed')
                });
            },
            signup: function(name, password) {
                var user = this;
                $.couch.signup({name: name}, password, {
                    success: function() {
                        this.login(name, password);
                    },
                    error: errorNotifier('Cannot create account')
                });
            }
        });  // end helpers

        this.notFound = function() { };

        this.get('#/', function(context) {
            context.$element().empty()
         });

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
            this.render('templates/account-loggedIn.template', {user: loggedInUser}).swap();
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

        account.run('#/');
    });


    var activity = $.sammy('#activity', function() {
        var activity = this;

        activity.notFound = function() { };

        this.use('Template');
        this.use('Title');
        this.setTitle(function(title) {
            return title + ' \\\\\\ CouchStore';
        });

        var Money = couchapp.require('views/lib/money');
        var currentOrderWidget;

        this.helpers({
            showNotification: showNotification,
            errorNotifier: errorNotifier,

            showNav: function() {
                $('#navbar .logged-in-menu').show();
            },

            hideNav: function() {
                $('#navbar .logged-in-menu').hide();
            },

            deactivateOrderWidget: function() {
                if (currentOrderWidget) {
                    currentOrderWidget.deactivate();
                    currentOrderWidget = null;
                }
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
                return d.promise();
            },

            errorModal: function(title, message) {
                var d = $.Deferred();
                var modal = $.mustache(couchapp.ddoc.templates['error-modal'],
                                            { title: 'Barcode', message: message });
                modal = $(modal).appendTo(this.$element())
                                .modal({backdrop: true, keyboard: true, show: true});
                modal.on('hidden', function() { modal.remove(); d.resolve(true) });
                return d.promise();
            },

            dialogModal: function(title, message, buttons) {
                var d = $.Deferred(),
                    buttons = buttons || ['Ok'],  // Have at least one button labeled 'Ok'
                    i, modal, elt,
                    data = { title: title, buttons: buttons };

                // Normalize the buttons
                for (i = 0; i < buttons.length; i++) {
                    // Convert simple string to an object
                    if (typeof buttons[i] === 'string') {
                        buttons[i] = { label: buttons[i] };
                    }
                    // Default value is the same as the label
                    if (buttons[i].value === undefined) {
                        buttons[i].value = buttons[i].label;
                    }
                    // The first button defaults to Bootstrap class "primary"
                    if ((buttons[i].class === undefined) && (i === 0)) {
                        buttons[i].class = 'btn-primary';
                    } else if ((buttons[i].class) && (! /^btn-/.test(buttons[i].class))) {
                        buttons[i].class = 'btn-' + buttons[i].class;
                    }
                    // The first button defaults to type 'submit'
                    if (buttons[i].type === undefined) {
                        buttons[i].type = (i === 0) ? 'submit' : 'button';
                    }
                }
                if (typeof(message) == 'object') {
                    elt = message;   // This seems cheesy....
                } else {
                    data.message = message;
                }

                modal = $.mustache(couchapp.ddoc.templates['dialog-modal'], data);
                modal = $(modal).appendTo(this.$element())
                                .modal({backdrop: true, keyboard: true, show: true});
                if (elt) {
                    modal.find('div.modal-body').append(elt);
                }
                modal.click(function(e) {
                    var elt = $(e.srcElement);
                    if (elt.is('button')) {
                        d.resolve(elt.attr('value'));
                    }
                });
                modal.on('hidden', function() { modal.remove(); });
                return d.promise();
            },
 

            fixupOrderWarehouseSelect: function(warehouseList, selectedWarehouseName) {
                // The order show functions don't have access to all the warehouse docs, and
                // the select input is empty.  After we get the order's HTML, we need to fill
                // in the warehouse select
                var html = '',
                    warehouseSelect = $('select.warehouse-picker');

                $.each(warehouseList, function(idx, warehouse) {
                    html += '<option value="' + warehouse.value + '">' + warehouse.value + '</option>';
                });
                warehouseSelect.append(html);

                if (typeof(selectedWarehouseId) === 'Array') {
                    selectedWarehouseName.forEach(function(warehouseName, idx) {
                        warehouseName && warehouseName.done(
                            function(warehouseName) {
                                warehouseSelect.get(idx).val(warehouseName);
                            }
                        );
                    });
                } else {
                    selectedWarehouseName && selectedWarehouseName.done(
                        function(warehouseNames) {
                            var setSelect = function(warehouseName, idx) {
                                $(warehouseSelect.get(idx)).val(warehouseName);
                            };
                            if ($.isArray(warehouseNames)) {
                                warehouseNames.forEach(setSelect);
                            } else {
                                setSelect(warehouseNames, 0);
                            }
                        }
                    );
                }
            },

            // This updates the price/cost of all items in the order
            updateOrdersItems: function(orderDoc) {
                var update_method = orderDoc['order-type'] === 'receive' ? 'item-cost-cents' : 'item-price-cents',
                    items_to_update = {},
                    context = this,
                    d = $.Deferred();

                if ('_rev' in orderDoc) {
                    // Don't update item costs/prices when editing an exiting order
                    d.resolve();
                } else if (orderDoc['order-type'] === 'warehouse-transfer') {
                    // transfer orders don't have price/cost
                    d.resolve();
                } else {
                    // Go through the items list and update the cost/price of them
                    if ('items' in orderDoc) {
                        $.each(orderDoc['items'], function(barcode, quan) {
                            items_to_update[barcode] = quan;
                        });
                    }
                    couchapp.view('items-by-barcode', {
                        keys: Object.keys(items_to_update),
                        success: function(data) {
                            var i = 0,
                                barcode,
                                docid,
                                waitingOn = data.rows.length;

                            d.progress(function() {
                                if (--waitingOn === 0 ) {
                                    d.resolve();
                                }
                            });

                            for (i = 0; i < data.rows.length; i++) {
                                barcode = data.rows[i].key;
                                docid = data.rows[i].id;
                                couchapp.update( update_method, { _id: docid, v: orderDoc['item-costs'][barcode] }, {
                                    success: function() {
                                        d.notify();
                                    },
                                    error: errorNotifier('Problem updating '
                                                            + update_method + 'for item '
                                                            + orderDoc['item-names'][barcode],
                                                        function() { d.reject })
                                });
                            }
                        }
                    });
                }
                return d.promise();
            },

            // Today's date as a string
            dateAsString: function(now) {
                var now = now || new Date;
                    month = now.getMonth() + 1,
                    dateStr = now.getFullYear() + '-'
                            + (month < 10 ? '0' : '') + month + '-'
                            + (now.getDate() < 10 ? '0' : '') + now.getDate();
                return dateStr;
            },

            // Find the last box ID used and return the next one
            getNextBoxId: function() {
                var d = $.Deferred();

                couchapp.view('shipment-box-ids', {
                    descending: true,
                    startkey: [this.dateAsString(), {}],
                    endkey: [this.dateAsString()],
                    limit: 1,
                    success: function(data) {
                        var boxID = data.rows.length ? parseInt(data.rows[0].key[1]) : false;
                        if (boxID) {
                            boxID++;
                        } else {
                            boxID = 1;
                        }

                        d.resolve(boxID);
                    }
                });
                return d.promise();
            },

            // Wire up the show-obsolete check box in the item lister and inventory report
            toggleObsolete: function() {
                $('input#show-obsolete').click(function(e) {
                    var rows = $('tr.obsolete');
                    if (e.target.checked) {
                        rows.show();
                    } else {
                        rows.hide();
                    }
                });
            },

        });

        function getWarehouseList () {
            var d = $.Deferred();
            couchapp.view('warehouses-by-priority', {
                success: function(data) {
                    d.resolve(data.rows);
                },
                error: errorNotifier('Cannot get warehouse list', function() {d.reject()})
            });
            return d.promise();
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
            context.deactivateOrderWidget();
            this.title('Home');
            context.$element().empty();
        });

        // When called without an order-number, it presents a list of shipments without tracking
        // numbers for the user to pick from.  The form re-get()s this same URL with the
        // order-number and shipment as a param
        this.get('#/confirm-shipment/', function(context) {
            context.deactivateOrderWidget();
            this.title('Confirm a Shipment');

            if (! ('shipment-id' in context.params)) {
                // No shipment, show the list of shipments to pick form
                var list_q = '_list/confirm-shipment-order-picker/unconfirmed-shipments';
                context.$element().load(list_q);

            } else {
                // Show the confirm-shipment entry form

                // shipment_id is composite of shipment-orderNumber
                var shipment_id = context.params['shipment-id'],
                    shipment    = shipment_id.substr(0, shipment_id.indexOf('-')),
                    orderNumber = shipment_id.substr(shipment_id.indexOf('-') + 1),
                    show_q      = '_show/confirm-shipment/order-' + orderNumber;

                context.$element().load(show_q + '?shipment='+encodeURIComponent(shipment));
            }

        });

        this.post('#/confirm-shipment/:orderNumber/:shipment', function(context) {
            var params = context.params,
                cost = Money.toCents(params['shipping-cost']),
                docid = 'order-'+params.orderNumber,
                hasErrors = false;

            if ((params['tracking-number'] === undefined) || (params['tracking-number'] === '')) {
                // tracking number is required
                var controlGroup = $('input[name="tracking-number"]').parents('.control-group');
                if (! controlGroup.hasClass('error')) {
                    controlGroup.addClass('error')
                    .find('div.controls')
                    .append('<span class="help-inline">Required</span>');
                }
                hasErrors = true;
            }
            if (! Money.dollarsAndCentsRegex.test(context.params['shipping-cost'])) {
                var controlGroup = $('input[name="shipping-cost"]').parents('.control-group');
                if (! controlGroup.hasClass('error')) {
                    controlGroup.addClass('error')
                    .find('div.controls')
                    .append('<span class="help-inline">Bad money format</span>');
                }
                hasErrors = true;
            }

            if (hasErrors) {
                return;
            }

            couchapp.update('confirm-shipment', {   _id: docid,
                                                    s: params.shipment,
                                                    'tracking-number': params['tracking-number'],
                                                    'shipping-cost': cost,
                                                    'carrier-method': params['carrier-method'],
                                                    'carrier': params.carrier },
                        {
                            success: function() {
                                showNotification('success', 'Shipment confirmed');
                                context.redirect('#/confirm-shipment/');
                            },
                            error: errorNotifier('Could not confirm shipment')
                        });
        });

        // When called without an order-number, it presents a list of sale orders with unshipped items
        // to the user to pick from.  The form re-get()s this same URL with the order-number as a
        // param.
        this.get('#/shipment/', function(context) {
            context.deactivateOrderWidget();
            this.title('Make a Shipment');
            if (! ('order-number' in context.params)) {
                // No order-number, show the list of orders to pick from

                var list_q = '_list/shipment-order-picker/shipment-order-picker';
                $.get(list_q, function(content) {
                    context.$element().html(content);
                    // The loaded page has scripts we need to start up
                    // that match the test box and select list
                    context.$element().find('script').each( function(i) {
                        eval($(this).text());
                    });
                });
            } else {
                // Presents a sale order to the user and allows them to select unshipped items to send
                // out in this shipment
                var orderNumber = context.params['order-number'],
                    orderId = 'order-' + orderNumber,
                    show_q = '_show/shipment/'+orderId+'?date='+context.dateAsString();
            
                $.get(show_q)
                    .done(function(content) {
                        context.$element().html(content);
                        ShipmentWidget({
                            couchapp: couchapp,
                            context: context,
                            activity: activity
                        });
                    })
                    .fail(errorNotifier('Could not generate shipment for order ' + orderNumber))
            }
        });

        // Called to edit a previously defined shipment
        this.get('#/edit/shipment/:orderId/:shipmentId', function(context) {
            context.deactivateOrderWidget();
            this.title('Edit Shipment');
            var show_q = '_show/shipment/' + context.params.orderId;
            context.$element()
                .load(show_q + '?shipment=' + encodeURIComponent(context.params.shipmentId),
                    function() {
                        ShipmentWidget({
                            couchapp: couchapp,
                            context: context,
                            activity: activity
                        });
                    }
                );

        });

        this.get('#/delete/shipment/:orderId/:shipment', function(context) {
            context.deactivateOrderWidget();
            var docid = context.params.orderId,
                orderNumber = docid.substr(6),
                shipment = context.params.shipment;

            var message = 'Are you sure you want to delete shipment '
                               + shipment + ' from order ' + orderNumber;
            var answer = context.dialogModal('Delete Shipment',
                                                    message,
                                                    [{ label: 'Delete', class: 'danger' }, 'Cancel']);
            answer.done(function(answer) {
                if (answer == 'Delete') {
                    couchapp.update('delete-shipment', { _id: docid, s: shipment }, {
                        success: function() {
                            window.history.back();
                            showNotification('success', 'Shipment deleted');
                        },
                        error: errorNotifier('Cannot delete shipment', function() { window.history.back(); } )
                    });
                } else {
                    window.history.back();
                }
            });
        });

        // called when a shipment form is submitted to define a shipment
        this.post('#/shipment/', function(context) {
            var orderId = 'order-' + context.params['order-number'],
                params = $.extend({ _id: orderId,
                                s: context.params['shipment'] },
                                context.params.toHash());

            delete params['order-number'];
            delete params['shipment'];

            function saveShipment(params) {
                couchapp.update('shipment', params, {
                    success: function() {
                        context.dialogModal('Shipment saved',
                                                    'Shipment for order ' + orderId
                                                    + ' is box ' + params.box)
                            .then(function() {
                                showNotification('success', 'Shipment saved');
                                context.redirect('#/shipment/');
                            });
                    },
                    error: errorNotifier('Cannot save shipment')
                });
            }

            if (params.s === undefined) {
                context.getNextBoxId()
                    .then( function(boxId) {
                        params.box = boxId;
                        saveShipment(params);
                    });
            } else {
                saveShipment(params);
            }
        });

        // Presents a form to the user to start an inventory correction
        this.get('#/edit/inventory/(.*)', function(context) {
            context.deactivateOrderWidget();
            this.title('Edit Partial Physical Inventory');
            var inv_id = context.params['splat'][0],
                show_q = '_show/partial-inventory';

            if (inv_id) {
                show_q += '/' + inv_id;
            }
            show_q = show_q + '?date='+context.dateAsString();
            function runOrderWidget() {
                getWarehouseList().then( context.fixupOrderWarehouseSelect );
                new InventoryWidget({   couchapp: couchapp,
                                    context: context,
                                    activity: activity,
                            });
            }

            context.$element().load(show_q, runOrderWidget);
        });

        // Submit a partial inventory correction
        this.post('#/edit/inventory/(.*)', function(context) {
            var params = context.params.toHash(),
                docId = context.params['splat'][0] || context.params['_id'] || '',
                section = context.params.section,
                next_url = '#/';

            if (docId) {
                params._id = docId;
            }
            couchapp.update('partial-inventory', params, {
                success: function(orderDoc) {
                    context.showNotification('success', 'Inventory for section ' + orderDoc.section + ' saved!');
                    activity.trigger('inventory-updated', orderDoc);
                    context.$element().empty();
                    context.redirect(next_url);
                },
               error: errorNotifier('Cannot save inventory for section ' + section)
            });
        });

        // Used to apply the accumulated partial physical inventories into one "order" per
        // warehouse that will make the item counts correct
        this.get('#/inventory-commit/', function(context) {
            context.deactivateOrderWidget();
            this.title('Commit Physical Inventory');

            couchapp.list('proposed-inventory-correction', 'inventory-by-permanent-warehouse-barcode', {
                group: true,
                dataType: 'html',
                success: function(content) {
                    context.$element().html(content);
                },
                error: function(status, reason, message) {
                    context.showNotification('error', 'Cannot get inventory correction list: '+message);
                }
            });
        });

        this.post('#/inventory-commit/', function(context) {
            var todaysDate = context.dateAsString(),
                remove_on_error = [],  // In case of problems, remove these already-saved corrections
                done = jQuery.Deferred();

            couchapp.list('proposed-inventory-correction', 'inventory-by-permanent-warehouse-barcode', {
                group: true,
                success: processRows,
                error: errorNotifier('Cannot get inventory correnctions',
                                    function() { done.reject() })
            });

            done.done(function() {
                showNotification('success', 'Inventory changes applied successfully');
                context.redirect('#/');
            });
            done.fail(function() {
                remove_on_error.forEach(function(orderDoc) {
                    couchapp.db.removeDoc(orderDoc);
                });
            });

            function processRows(warehouses) {
                var warehouse, barcode, updateParams,
                    warehouseCount = 0;

                for (warehouse in warehouses) {
                    warehouseCount++;
                }

                // FIXME - we could probably move this conversion code into the list
                for (warehouse in warehouses) {
                    updateParams = {
                        _id: 'order-' + warehouse + '-inv-' + todaysDate,
                            date: todaysDate,
                            'warehouse-name': warehouse,
                            'customer-name': loggedInUser.name,
                        };
                    for (barcode in warehouses[warehouse]) {
                        thisItem = warehouses[warehouse][barcode];
                        updateParams['scan-'+barcode+'-quan'] = thisItem.count;
                        updateParams['scan-'+barcode+'-sku']  = thisItem.sku;
                        updateParams['scan-'+barcode+'-name'] = thisItem.name;
                    }
                    (function(warehouse) {
                        couchapp.update('inventory-correction', updateParams, {
                            success: function(doc) {
                                remove_on_error.push(doc);
                                if (--warehouseCount === 0) {
                                    removePartialInventories();
                                }
                            },
                            error: errorNotifier('Cannot save inventory correction for '+warehouse,
                                                function() { done.reject(); })
                        });
                    })(warehouse);
                }
            } // end processRows

            var left_to_delete = -1;
            function removePartialInventories() {
                couchapp.db.allDocs({
                    startkey: 'inv-',
                    endkey: 'inv-\u9999',
                    success: function(data) {
                        left_to_delete = data.rows.length;
                        data.rows.forEach(removeThisPartialInventory);
                    },
                    error: errorNotifier('Cannot get list of partial inventories',
                                        function() { done.reject(); })
                });
            }

            function removeThisPartialInventory(row) {
                var remove = { _id: row.id, _rev: row.value.rev };
                couchapp.db.removeDoc(remove, {
                    success: function() {
                        if (--left_to_delete === 0) {
                            done.resolve();
                        }
                    },
                    error: errorNotifier('Cannot remove partial inventory doc '+row.id,
                                        function() { done.reject(); })
                });
            }
        });

        // Presents a form to the user to edit an already existing order
        this.get('#/edit/order/(.*)', function(context) {
            context.deactivateOrderWidget();
            this.title('Edit Order');
            var order_id = context.params['splat'][0],
                show_q = '_show/edit-order';

            if (order_id) {
                show_q += '/' + order_id;
            }

            $.get(show_q)
                .then(function(content) {
                    context.$element().html(content);

                    // We still need to fixup the warehouse
                    var d = $.Deferred();
                    couchapp.db.openDoc(order_id, {
                        success: function(doc) {
                            if (doc['order-type'] === 'warehouse-transfer') {
                                d.resolve([ doc['source-warehouse-name'], doc['warehouse-name']]);
                            } else {
                                d.resolve(doc['warehouse-name']);
                            }
                        }
                    });
                    getWarehouseList().then( function(warehouseList) { context.fixupOrderWarehouseSelect(warehouseList, d.promise()) } );
                    currentOrderWidget = new OrderWidget({
                                                couchapp: couchapp,
                                                context: context,
                                                activity: activity
                                        });
                });
        });

        // This presents a form to the user to create some kind of order
        // order_type is either receive or sale
        // The form posts to #/order/receive below VVV
        this.get('#/create-order/:order_type/', function(context) {
            context.deactivateOrderWidget();
            this.title('Create Order');
            var order_type = context.params.order_type,
                show_q = '_show/edit-order/?type=' + order_type + '&date='+context.dateAsString();

            $.get(show_q)
                .then(function(content) {
                    context.$element().html(content);

                    // Still need to supply today's date and fix up the warehouse select
                    getWarehouseList().then( context.fixupOrderWarehouseSelect );
                    if (order_type === 'warehouse-transfer') {
                        currentOrderWidget = new InventoryWidget({
                                        couchapp: couchapp,
                                        context: context,
                                        activity: activity
                                });
                    } else {
                        currentOrderWidget = new OrderWidget({
                                        couchapp: couchapp,
                                        context: context,
                                        activity: activity
                                });
                    }
                });
                    
        });

        // Called when the user submits an order to the system
        // order_type is receive or sale
        this.post('#/create-order/(.*)/(.*)', function(context) {
            var params = context.params.toHash(),
                order_type = context.params['splat'][0],
                order_number = context.params['splat'][1] || context.params['order-number'],
                updateOrdersItems = true,
                next_url;

            if (order_type === 'receive') {
                next_url = '#/';   // Go back to the start page
            } else if (order_type === 'sale') {
                next_url = context.path;  // stay at the same URL
            } else if (order_type === 'warehouse-transfer') {
                next_url = '#/';   // Go back to the start page
                updateOrdersItems = false;
                order_number = order_number || 'xfer-' + params['source-warehouse-name']
                                                + '-' + params['warehouse-name']
                                                + '-' + params['date'];
            } else {
                showNotification('error', 'Unknown type of order: '+order_type);
                return;
            }

            params._id = 'order-' + order_number;
            params['order-type'] = order_type;

            couchapp.update('order', params, {
                success: function(orderDoc) {
                    context.updateOrdersItems(orderDoc)
                        .then( function() {
                            context.showNotification('success', 'Order ' + order_number + ' saved!');
                            activity.trigger('order-updated', orderDoc);
                            context.$element().empty();
                            context.redirect(next_url);
                        });
                },
                error: errorNotifier('Problem saving order ' + order_number)
            });
        });

        this.get('#/data/:type/', function dataLister(context) {
            context.deactivateOrderWidget();
            var search  = context.params['search-query'] || '';
                type    = context.params['type'],
                view    = type + '-by-any',
                list_q  = '_list/items/' + view;

            this.title('List '+type);

            if (search) {
                list_q += '?search-query=' + encodeURIComponent(search);
            }

            couchapp.list('items', view, {
                'search-query': search,
                dataType: 'html',
                success: function(content) {
                    context.$element().html(content);

                    context.toggleObsolete();
                    // The physical inventories lister should show the list of proposed corrections, too
                    if (type == 'inventories') {
                        couchapp.list('proposed-inventory-correction', 'inventory-by-permanent-warehouse-barcode', {
                            group: true,
                            dataType: 'html',
                            listOnly: true,
                            success: function(content) {
                                context.$element().append(content);
                            },
                            error: errorNotifier("Can't get physical inventory list")
                        });
                    }
                },
                error: errorNotifier('Cannot get data for '+type)
            });
        });

        this.get('#/edit/(.*)/(.*)', function(context) {
            context.deactivateOrderWidget();
            var type = context.params['splat'][0],
                item_id = context.params['splat'][1];

            this.editItemModal(type, item_id)
                .then(function(modal) {
                        window.history.back()
                    });
        });

        this.post('#/edit/(.*)/(.*)', function(context) {
            var type = context.params['splat'][0],
                this_id = context.params['splat'][1],
                modal = $('.modal');

            var Validator = couchapp.require('lib/validate');
            context.params.type = type;
            var validator = new Validator.Validator(context.params);

            validator.couchapp = couchapp;

            var noteError = function(err) {
                var fieldset = $('fieldset#' + err.field + '-field');
                fieldset.addClass('error');
                $('[name=' + err.field + ']', fieldset)
                    .after('<span class="help-inline label label-important"><i class="icon-exclamation-sign icon-white"></i>&nbsp;'
                            + err.reason + '</span>');
            };
            var saveItem = function(context) {
                // scanned is used in the receive/sale order page when an unknown
                // item is scanned, the user brings up the edit item form and changes
                // the barcode.  This retains the original scanned thing
                var scanned = context.params['scanned'];

                if (type == 'item') {
                    // Boolean options default to false
                    context.params['is-obsolete'] = context.params['is-obsolete'] || '';
                } else if (type == 'customer') {
                    context.params['is-taxable'] = context.params['is-taxable'] || '';
                } else if (type == 'warehouse') {
                    // nothing special for warehouses
                }

                couchapp.update(type, context.params, {
                    success: function(newDoc) {
                        modal.modal('hide');
                        activity.trigger(type + '-updated', { item: newDoc, scanned: scanned });
                        showNotification('success', type + ' saved');
                    },
                    error: errorNotifier('Problem saving '+type,
                                        function() { modal.modal('hide'); })
                });
            };

            // Remove any errors from the last time they tried to submit
            $('fieldset.error span.help-inline', context.$element()).remove();

            var savable = jQuery.Deferred();
            savable.done(function() { saveItem(context) });

            try { validator.validateAll(noteError) }
            catch(err) { savable.reject() };

            if (savable.state() === 'rejected') {
                return;
            }
            if (type == 'item') {
                if ((context.params.cost != '') && (! Money.dollarsAndCentsRegex.test(context.params.cost))) {
                    noteError({field: 'cost', reason: 'Money format'});
                    savable.reject();
                }
                if ((context.params.price != '') && (! Money.dollarsAndCentsRegex.test(context.params.price))) {
                    noteError({field: 'price', reason: 'Money format'});
                    savable.reject();
                }
                var checkdupsCount = 2;
                ['barcode','sku'].forEach(function(param) {
                    validator.unique(param)
                        .fail(function(err) {
                            noteError(err);
                            savable.reject();
                        })
                        .done(function() {
                            if (--checkdupsCount === 0) {
                                savable.resolve();
                            }
                        });
                });
                       
            } else if (type == 'customer') {
                savable.resolve();
            } else if (type == 'warehouse') {
                validator.unique('name')
                    .fail(function(err) {
                        noteError(err);
                        savable.reject();
                    })
                    .done(function() {
                        savable.resolve();
                    });
            }
                
        });

        this.get('#/delete/:thing/:id', function(context) {
            context.deactivateOrderWidget();
            var docid = context.params['id'],
                thing = context.params['thing'],
                doc,
                modal,
                show_q = '_show/delete-thing/' + docid;

            function cleanUpModal () {
                if (modal) {
                    modal.modal('hide');
                    modal.remove();
                    window.history.back();
                }
            }

            couchapp.db.openDoc(docid, {
                success: function(loadedDoc) {
                    if (loadedDoc.type != thing) {
                        context.showNotification('error', 'Expected document ' + docid + ' to be a ' + thing
                                                            + ', but it is a ' + loadedDoc.type);
                        cleanUpModal();
                    } else {
                        doc = loadedDoc;
                    }
                },
                error: errorNotifier('There is no '+ thing + 'with id ' + docid,
                                    cleanUpModal)
            });
    
            $.get(show_q)
                .then(function(content) {
                    modal = $(content).appendTo(context.$element())
                                   .modal({backdrop: true, keyboard: true, show: true});
                    modal.on('hidden', function() {
                                            modal.remove();
                                            window.history.back();
                                        });
                    modal.find('#delete-confirm')
                        .click( function(event) {
                            couchapp.db.removeDoc(doc, {
                                success: function() {
                                    showNotification('success', context.params['thing'] + ' removed');
                                    modal.modal('hide');
                                },
                                error: errorNotifier('Delete failed', function() { modal.modal('hide'); })
                            })
                            event.preventDefault();
                        });
                });
            
        });


        this.get('#/report/inventory/', function(context) {
            context.deactivateOrderWidget();
            this.title('Current Inventory Report');
            var search = context.params['search-query']
                list_q = '_list/current-inventory-report/inventory-by-permanent-warehouse-barcode?group=true&startkey=[1]';

            if (search) {
                list_q += '&search-query=' + encodeURIComponent(search);
            }
            context.$element().load(list_q, function() {
                new InventoryReport({
                        context: context,
                        activity: activity,
                        couchapp: couchapp
                    });
            });
        });

        this.get('#/report/item-history/:barcode', function(context) {
            context.deactivateOrderWidget();
            var options = { dataType : 'html' };
            if ('barcode' in context.params) {
                options.startkey = [context.params.barcode];
                options.endkey = [context.params.barcode,{}];
            }

            couchapp.list('item-history', 'item-history-by-barcode-date',
                $.extend(options, {
                success: function(content) {
                    var answer = context.dialogModal('Item History',
                                                        $(content),
                                                        ['Ok']);
                    answer.always(function() {
                        window.history.back()
                    });
                },
                error: errorNotifier('History not available')
                })
            );
        });

        this.get('#/report/shipment-summary/', function(context) {
            context.deactivateOrderWidget();
            var options = { dataType: 'html' };

            if (context.params.start) {
                options.startkey = context.dateAsString();
                options.endkey = context.dateAsString();
            } else {
                if (context.params.startkey) {
                    options.startkey = context.params.startkey;
                }
                if (context.params.endkey) {
                    options.endkey = context.params.endkey;
                }
            }
            this.title('Shipment Summary Report ' + options.startkey + ' to ' + options.endkey);

            couchapp.list('shipment-summary-report','shipments-by-date',
                $.extend(options, {
                error: errorNotifier('Cannot get shipment summary report'),
                success: function(content) {
                    context.$element().html(content);

                    var form = context.$element().find('form#date-selector'),
                        start_date = form.find('input[name="startkey"]'),
                        end_date = form.find('input[name="endkey"]');

                    start_date.change(function(e) {
                        var startkey = start_date.val(),
                            endkey = end_date.val();

                        if (!endkey) {
                            end_date.val(startkey);
                        }
                    });

                    form.submit(function(e) {
                        var startkey = start_date.val(),
                            endkey = end_date.val(),
                            url,
                            params = [];

                        url = context.path.replace(/\?.*$/, '');  // Remove any params already there
                        if (startkey) {
                            params.push('startkey='+startkey);
                        }
                        if (endkey) {
                            params.push('endkey='+endkey);
                        }
                        if (params.length) {
                            url += '?' + params.join('&');
                        }
                        context.redirect(url);

                        return false;
                    });

                }})
            );

        });

        this.get('#/report/purchase/', function(context) {
            context.deactivateOrderWidget();
            this.title('Suggested Purchase Report');

            

        });

        // Show a report if items sorted by how many were sold between two dates
        this.get('#/report/popular-items/', function(context) {
            context.deactivateOrderWidget();

            var view,
                options = { action: window.location.hash.replace(/\?.*$/,''),
                            dataType: 'html',
                            'order-source': context.params['order-source'] };

            if (context.params.start) {
                var date = new Date;
                date.setMonth( date.getMonth() - 1);
                options.startkey = context.dateAsString(date);  // start with the last months' sales
                options.endkey = context.dateAsString();
            } else {
                options.startkey = context.params.startkey || false;
                options.endkey = context.params.endkey || {};
            }
            if (context.params['order-source']) {
                view = 'sold-count-by-ordersource-selldate';
                options.startkey = [ context.params['order-source'], options.startkey ];
                options.endkey = [ context.params['order-source'], options.endkey ];
            } else {
                view = 'sold-count-by-selldate';
            }

            if (context.params['least-popular']) {
                options['least-popular'] = true;
            }

            this.title((options['least-popular'] ? 'Least' : '')
                        + ' Popular Items Report ' + options.startkey + ' to ' + options.endkey);

            options.success = function(content) {
                context.$element().html(content);
            }
            options.error = errorNotifier("Cannot query popular items");

            // Note - we could also pass along startkey, limit in context.params for paging
            couchapp.list('popular-items-report', view, options);
        });

        this.get('#/shipment-detail-modal/:orderNumber/:shipment', function(context) {
            var show_q = '_show/shipment-detail/order-'
                        + context.params.orderNumber
                        + '?shipment=' + context.params.shipment;
            $.get(show_q,
                    function(content) {
                        var dialog = context.dialogModal('Shipment Detail', $(content), ['Ok']);
                        dialog.always(function() { window.history.back() });
                    },
                    errorNotifier('Cannot get shipment details'),
                    'html');
            //couchapp.show('shipment-detail', 'order-'+context.params.orderNumber, {
            //    shipment: context.params.shipment,
            //    dataType: 'html',
            //    success: function(content) {
            //        context.dialogModal('Shipment Detail', $(content), ['Ok']);
            //    },
            //    error: errorNotifier('Cannot get shipment details')
            //});
        });

    });

    activity.run('#/');

};
