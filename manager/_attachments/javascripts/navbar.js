(function($) {
    var $navbar = $.sammy('#navbar', function() {
        var $navbar = this;
        //this.use('Template');

        var $account = $.sammy('#account', function() {
            this.use('Template');
            var $account = this;
            //this.$element.removeClass('open'); // Close the username dropdown if it's open

            this.get('#/', function(context) {
                $.couch.session({
                    success: function(r) {
                        var userCtx = r.userCtx;
                        if (userCtx.name) {
                            context.render('templates/account-loggedIn.template', { item: userCtx }).swap();
                            $navbar.trigger('loggedIn');
                        } else if (userCtx.roles.indexOf('_admin') != -1) {
                            context.render('templates/account-adminParty.template').swap();
                            $navbar.trigger('loggedOut');
                        } else {
                            context.render('templates/account-loggedOut.template').swap();
                            $navbar.trigger('loggedOut');
                        }
                    }
                });
            });

            this.get('#profile', function(context) {

            });

            this.get('#logout', function(context) {
                $.couch.logout({
                    success: function() {
                        context.redirect('#/');
                    }
                });
            });

            this.get('#login', function(context) {
                context.render('templates/account-loginForm.template').swap();
            });
            this.post('#doLogin', function(context) {
                var name = this.params['name'];
                var pass = this.params['password'];
                $.couch.login({
                    name: name,
                    password: pass,
                    success: function(r) {
                        context.redirect('#/');
                    }
                });
            });

            this.get('#signup', function(context) {
                context.render('templates/account-signupForm.template').swap();
            });
            this.post('#doSignup', function(context) {
                var name = this.params['name'];
                var pass = this.params['password'];
                $.couch.signup({
                    name : name
                }, pass, {
                    success : function() {
                        context.redirect('#doLogin');
                    }
                });
            });
            
        });

        this.get('#/', function(context) {
            context.log('in navbar #/');
            $('#navbar-menus').load('templates/navbar.template');
            //$account.run('#account-init');
            $account.run();
        });

        this.bind('loggedIn', function(context) {
            $navbar.$element().find('li.dropdown').show();

        });

        this.bind('loggedOut', function(context) {
            $navbar.$element().find('li.dropdown').hide();
        });

        this.bind('closeMenu', function(context) {
             //$('.dropdown.open',this).removeClass('open'); // Close the dropdown menu
        });

    });
    $(function() {
        $navbar.run('#/');
    });

})(jQuery);
