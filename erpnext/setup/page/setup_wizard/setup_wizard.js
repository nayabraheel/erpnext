frappe.pages['setup-wizard'].onload = function(wrapper) {
	if(sys_defaults.company) {
		frappe.set_route("desktop");
		return;
	}
	$(".navbar:first").toggle(false);
	$("body").css({"padding-top":"30px"});

	var wizard_settings = {
		page_name: "setup-wizard",
		parent: wrapper,
		on_complete: function(wiz) {
			var values = wiz.get_values();
			wiz.show_working();
			frappe.call({
				method: "erpnext.setup.page.setup_wizard.setup_wizard.setup_account",
				args: values,
				callback: function(r) {
					wiz.show_complete();
					setTimeout(function() {
						if(user==="Administrator") {
							msgprint(__("Login with your new User ID") + ":" + values.email);
							setTimeout(function() {
								frappe.app.logout();
							}, 2000);
						} else {
							window.location = "/desk";
						}
					}, 2000);
				},
				error: function(r) {
					var d = msgprint(__("There were errors."));
					d.custom_onhide = function() {
						frappe.set_route(erpnext.wiz.page_name, "0");
					}
				}
			})
		},
		title: __("Welcome"),
		welcome_html: '<h1 class="text-muted text-center"><i class="icon-magic"></i></h1>\
			<h2 class="text-center">'+__('ERPNext Setup')+'</h2>\
			<p class="text-center" style="margin: 0px 100px">' +
			__('Welcome to ERPNext. Over the next few minutes we will help you setup your ERPNext account. Try and fill in as much information as you have even if it takes a bit longer. It will save you a lot of time later. Good Luck!') +
			'</p>',
		working_html: '<h3 class="text-muted text-center"><i class="icon-refresh icon-spin"></i></h3>\
			<h2 class="text-center">'+__('Setting up...')+'</h2>\
			<p class="text-center">' +
			__('Sit tight while your system is being setup. This may take a few moments.') +
			'</p>',
		complete_html: '<h1 class="text-muted text-center"><i class="icon-thumbs-up"></i></h1>\
			<h2 class="text-center">'+__('Setup Complete!')+'</h2>\
			<p class="text-center">' +
			__('Your setup is complete. Refreshing...') +
			'</p>',
		slides: [
			// User
			{
				title: __("Select Your Language"),
				icon: "icon-globe",
				fields: [
					{"fieldname": "language", "label": __("Language"), "fieldtype": "Select",
						options: ["english", "العربية", "deutsch", "ελληνικά", "español", "français", "हिंदी", "hrvatski",
						"italiano", "nederlands", "português brasileiro", "português", "српски", "தமிழ்",
						"ไทย", "中国（简体", "中國（繁體"], reqd:1},
				],
				help: __("Welcome to ERPNext. Please select your language to begin the Setup Wizard."),
				onload: function(slide) {
					slide.get_input("language").on("change", function() {
						var lang = $(this).val();
						frappe.call({
							method: "erpnext.setup.page.setup_wizard.setup_wizard.load_messages",
							args: {
								language: lang
							},
							callback: function(r) {
								// re-render all slides
								$.each(slide.wiz.slide_dict, function(key, s) {
									s.make();
								});
								slide.get_input("language").val(lang);
							}
						})
					});
				}
			},
			{
				title: __("The First User: You"),
				icon: "icon-user",
				fields: [
					{"fieldname": "first_name", "label": __("First Name"), "fieldtype": "Data",
						reqd:1},
					{"fieldname": "last_name", "label": __("Last Name"), "fieldtype": "Data",
						reqd:1},
					{"fieldname": "email", "label": __("Email Id"), "fieldtype": "Data",
						reqd:1, "description":"Your Login Id", "options":"Email"},
					{"fieldname": "password", "label": __("Password"), "fieldtype": "Password",
						reqd:1},
					{fieldtype:"Attach Image", fieldname:"attach_user",
						label: __("Attach Your Picture")},
				],
				help: __('The first user will become the System Manager (you can change that later).'),
				onload: function(slide) {
					if(user!=="Administrator") {
						slide.form.fields_dict.password.$wrapper.toggle(false);
						slide.form.fields_dict.email.$wrapper.toggle(false);
						slide.form.fields_dict.first_name.set_input(frappe.boot.user.first_name);
						slide.form.fields_dict.last_name.set_input(frappe.boot.user.last_name);

						delete slide.form.fields_dict.email;
						delete slide.form.fields_dict.password;
					}
				}
			},

			// Organization
			{
				title: __("The Organization"),
				icon: "icon-building",
				fields: [
					{fieldname:'company_name', label: __('Company Name'), fieldtype:'Data', reqd:1,
						placeholder: __('e.g. "My Company LLC"')},
					{fieldname:'company_abbr', label: __('Company Abbreviation'), fieldtype:'Data',
						placeholder: __('e.g. "MC"'),reqd:1},
					{fieldname:'fy_start_date', label:__('Financial Year Start Date'), fieldtype:'Date',
						description: __('Your financial year begins on'), reqd:1},
					{fieldname:'fy_end_date', label:__('Financial Year End Date'), fieldtype:'Date',
						description: __('Your financial year ends on'), reqd:1},
					{fieldname:'company_tagline', label: __('What does it do?'), fieldtype:'Data',
						placeholder:__('e.g. "Build tools for builders"'), reqd:1},
				],
				help: __('The name of your company for which you are setting up this system.'),
				onload: function(slide) {
					slide.get_input("company_name").on("change", function() {
						var parts = slide.get_input("company_name").val().split(" ");
						var abbr = $.map(parts, function(p) { return p ? p.substr(0,1) : null }).join("");
						slide.get_input("company_abbr").val(abbr.toUpperCase());
					}).val(frappe.boot.sysdefaults.company_name || "").trigger("change");

					slide.get_input("fy_start_date").on("change", function() {
						var year_end_date =
							frappe.datetime.add_days(frappe.datetime.add_months(
								frappe.datetime.user_to_obj(slide.get_input("fy_start_date").val()), 12), -1);
						slide.get_input("fy_end_date").val(frappe.datetime.obj_to_user(year_end_date));

					});
				}
			},

			// Country
			{
				title: __("Country, Timezone and Currency"),
				icon: "icon-flag",
				fields: [
					{fieldname:'country', label: __('Country'), reqd:1,
						options: "", fieldtype: 'Select'},
					{fieldname:'currency', label: __('Default Currency'), reqd:1,
						options: "", fieldtype: 'Select'},
					{fieldname:'timezone', label: __('Time Zone'), reqd:1,
						options: "", fieldtype: 'Select'},
					// {fieldname:'chart_of_accounts', label: __('Chart of Accounts'),
					// 	options: "", fieldtype: 'Select'}
				],
				help: __('Select your home country and check the timezone and currency.'),
				onload: function(slide, form) {
					frappe.call({
						method:"frappe.country_info.get_country_timezone_info",
						callback: function(data) {
							frappe.country_info = data.message.country_info;
							frappe.all_timezones = data.message.all_timezones;
							slide.get_input("country").empty()
								.add_options([""].concat(keys(frappe.country_info).sort()));
							slide.get_input("currency").empty()
								.add_options(frappe.utils.unique([""].concat($.map(frappe.country_info,
									function(opts, country) { return opts.currency; }))).sort());
							slide.get_input("timezone").empty()
								.add_options([""].concat(frappe.all_timezones));
						}
					})

					slide.get_input("country").on("change", function() {
						var country = slide.get_input("country").val();
						var $timezone = slide.get_input("timezone");
						$timezone.empty();
						// add country specific timezones first
						if(country){
							var timezone_list = frappe.country_info[country].timezones || [];
							$timezone.add_options(timezone_list.sort());
							slide.get_input("currency").val(frappe.country_info[country].currency);
						}
						// add all timezones at the end, so that user has the option to change it to any timezone
						$timezone.add_options([""].concat(frappe.all_timezones));

						// get country specific chart of accounts
						// frappe.call({
						// 	method: "erpnext.accounts.doctype.chart_of_accounts.chart_of_accounts.get_charts_for_country",
						// 	args: {"country": country},
						// 	callback: function(r) {
						// 		if(r.message)
						// 			slide.get_input("chart_of_accounts").empty()
						// 				.add_options([""].concat(r.message));
						// 	}
						// })
					});
				}
			},

			// Logo
			{
				icon: "icon-bookmark",
				title: __("Logo and Letter Heads"),
				help: __('Upload your letter head and logo - you can edit them later.'),
				fields: [
					{fieldtype:"Attach Image", fieldname:"attach_letterhead", label: __("Attach Letterhead")},
					{fieldtype:"Attach Image", fieldname:"attach_logo", label:__("Attach Logo")},
				],
			},

			// Taxes
			{
				icon: "icon-money",
				"title": __("Add Taxes"),
				"help": __("List your tax heads (e.g. VAT, Excise) (upto 3) and their standard rates. This will create a standard template, you can edit and add more later."),
				"fields": [],
			},

			// Customers
			{
				icon: "icon-group",
				"title": __("Your Customers"),
				"help": __("List a few of your customers. They could be organizations or individuals."),
				"fields": [],
			},

			// Items to Sell
			{
				icon: "icon-barcode",
				"title": __("Your Products or Services"),
				"help": __("List your products or services that you sell to your customers. Make sure to check the Item Group, Unit of Measure and other properties when you start."),
				"fields": [],
			},

			// Suppliers
			{
				icon: "icon-group",
				"title": __("Your Suppliers"),
				"help": __("List a few of your suppliers. They could be organizations or individuals."),
				"fields": [],
			},

			// Items to Buy
			{
				icon: "icon-barcode",
				"title": __("Products or Services You Buy"),
				"help": __("List a few products or services you buy from your suppliers or vendors. If these are same as your products, then do not add them."),
				"fields": [],
			},

		]
	}

	// taxes
	for(var i=1; i<4; i++) {
		wizard_settings.slides[5].fields = wizard_settings.slides[5].fields.concat([
			{fieldtype:"Data", fieldname:"tax_"+ i, label:__("Tax") + " " + i, placeholder:__("e.g. VAT")},
			{fieldtype:"Column Break"},
			{fieldtype:"Data", fieldname:"tax_rate_i", label:__("Rate (%)"), placeholder:__("e.g. 5")},
			{fieldtype:"Section Break"},
		])
	}

	// customers
	for(var i=1; i<6; i++) {
		wizard_settings.slides[6].fields = wizard_settings.slides[6].fields.concat([
			{fieldtype:"Data", fieldname:"customer_" + i, label:__("Customer") + " " + i,
				placeholder:__("Customer Name")},
			{fieldtype:"Column Break"},
			{fieldtype:"Data", fieldname:"customer_contact_" + i,
				label:__("Contact"), placeholder:__("Contact Name")},
			{fieldtype:"Section Break"}
		])
	}

	// products
	for(var i=1; i<6; i++) {
		wizard_settings.slides[7].fields = wizard_settings.slides[7].fields.concat([
			{fieldtype:"Data", fieldname:"item_" + i, label:__("Item") + " " + i,
				placeholder:__("A Product or Service")},
			{fieldtype:"Column Break"},
			{fieldtype:"Attach", fieldname:"item_img_" + i, label:__("Attach Image")},
			{fieldtype:"Section Break"},
			{fieldtype:"Column Break"},
			{fieldtype:"Select", label:"Group", fieldname:"item_group_" + i,
				options:["Products", "Services", "Raw Material", "Sub Assemblies"]},
			{fieldtype:"Column Break"},
			{fieldtype:"Select", fieldname:"item_uom_" + i, label:"UOM",
				options:["Unit", "Nos", "Box", "Pair", "Kg", "Set", "Hour", "Minute"]},
			{fieldtype:"Section Break"}
		])
	}

	for(var i=1; i<6; i++) {
		wizard_settings.slides[8].fields = wizard_settings.slides[8].fields.concat([
			{fieldtype:"Data", fieldname:"supplier_" + i, label:__("Supplier")+" " + i,
				placeholder:"Supplier Name"},
			{fieldtype:"Column Break"},
			{fieldtype:"Data", fieldname:"supplier_contact_" + i,
				label:"Contact", placeholder:__("Contact Name")},
			{fieldtype:"Section Break"}
		])
	}

	for(var i=1; i<6; i++) {
		wizard_settings.slides[9].fields = wizard_settings.slides[9].fields.concat([
			{fieldtype:"Data", fieldname:"item_buy_" + i, label: __("Item") + " " + i,
				placeholder:__("A Product or Service")},
			{fieldtype:"Column Break"},
			{fieldtype:"Section Break"},
			{fieldtype:"Column Break"},
			{fieldtype:"Select", fieldname:"item_buy_group_" + i, label: __("Group"),
				options:["Raw Material", "Consumable", "Sub Assemblies", "Services", "Products"]},
			{fieldtype:"Column Break"},
			{fieldtype:"Select", fieldname:"item_buy_uom_" + i, label: __("UOM"),
				options:["Unit", "Nos", "Box", "Pair", "Kg", "Set", "Hour", "Minute"]},
			{fieldtype:"Section Break"},
		])
	}

	erpnext.wiz = new frappe.wiz.Wizard(wizard_settings)
}

frappe.pages['setup-wizard'].onshow = function(wrapper) {
	if(frappe.get_route()[1])
		erpnext.wiz.show(frappe.get_route()[1]);
}

frappe.provide("frappe.wiz");

frappe.wiz.Wizard = Class.extend({
	init: function(opts) {
		$.extend(this, opts);
		this.make();
		this.slides = this.slides;
		this.slide_dict = {};
		//this.show_welcome();
		this.welcomed = true;
		frappe.set_route(this.page_name, "0");
	},
	make: function() {
		frappe.ui.set_user_background(null, "#page-setup-wizard");
		this.parent = $('<div class="setup-wizard-wrapper">').appendTo(this.parent);
	},
	get_message: function(html) {
		return $(repl('<div class="panel panel-default">\
			<div class="panel-body" style="padding: 40px;">%(html)s</div>\
		</div>', {html:html}))
	},
	show_welcome: function() {
		if(this.$welcome)
			return;
		var me = this;
		this.$welcome = this.get_message(this.welcome_html +
			'<br><p class="text-center"><button class="btn btn-primary">'+__("Start")+'</button></p>')
			.appendTo(this.parent);

		this.$welcome.find(".btn").click(function() {
			me.$welcome.toggle(false);
			me.welcomed = true;
			frappe.set_route(me.page_name, "0");
		})

		this.current_slide = {"$wrapper": this.$welcome};
	},
	show_working: function() {
		this.hide_current_slide();
		frappe.set_route(this.page_name);
		this.current_slide = {"$wrapper": this.get_message(this.working_html).appendTo(this.parent)};
	},
	show_complete: function() {
		this.hide_current_slide();
		this.current_slide = {"$wrapper": this.get_message(this.complete_html).appendTo(this.parent)};
	},
	show: function(id) {
		if(!this.welcomed) {
			frappe.set_route(this.page_name);
			return;
		}
		id = cint(id);
		if(this.current_slide && this.current_slide.id===id)
			return;
		if(!this.slide_dict[id]) {
			this.slide_dict[id] = new frappe.wiz.WizardSlide($.extend(this.slides[id], {wiz:this, id:id}));
			this.slide_dict[id].make();
		}

		this.hide_current_slide();

		this.current_slide = this.slide_dict[id];
		this.current_slide.$wrapper.toggle(true);
	},
	hide_current_slide: function() {
		if(this.current_slide) {
			this.current_slide.$wrapper.toggle(false);
			this.current_slide = null;
		}
	},
	get_values: function() {
		var values = {};
		$.each(this.slide_dict, function(id, slide) {
			$.extend(values, slide.values)
		})
		return values;
	}
});

frappe.wiz.WizardSlide = Class.extend({
	init: function(opts) {
		$.extend(this, opts);
		this.$wrapper = $("<div>").appendTo(this.wiz.parent);
	},
	make: function() {
		var me = this;
		if(this.$body) this.$body.remove();
		this.$body = $(repl('<div class="panel panel-default">\
			<div class="panel-heading">\
				<div class="panel-title row">\
					<div class="col-sm-12"><h3 style="margin: 0px;">\
						<i class="%(icon)s text-muted"></i> %(title)s</h3></div>\
				</div>\
			</div>\
			<div class="panel-body">\
				<div class="progress">\
					<div class="progress-bar" style="width: %(width)s%"></div>\
				</div>\
				<div class="row">\
					<div class="col-sm-12">\
						<p class="text-muted">%(help)s</p><br>\
						<div class="form"></div>\
					</div>\
				</div>\
				<hr>\
				<div class="footer">\
					<div class="text-right"><a class="prev-btn hide btn btn-default">Previous</a> \
						<a class="next-btn hide btn btn-primary">'+__("Next")+'</a> \
						<a class="complete-btn hide btn btn-primary"><b>'+__("Complete Setup")+'</b></a>\
					</div>\
				</div>\
			</div>\
		</div>', {help: __(this.help), title:__(this.title), main_title:__(this.wiz.title), step: this.id + 1,
				width: (flt(this.id + 1) / (this.wiz.slides.length+1)) * 100, icon:this.icon}))
			.appendTo(this.$wrapper);

		this.body = this.$body.find(".form")[0];

		if(this.fields) {
			this.form = new frappe.ui.FieldGroup({
				fields: this.fields,
				body: this.body,
				no_submit_on_enter: true
			});
			this.form.make();
		} else {
			$(this.body).html(this.html)
		}

		if(this.id > 0) {
			this.$prev = this.$body.find('.prev-btn').removeClass("hide")
				.click(function() {
					frappe.set_route(me.wiz.page_name, me.id-1 + "");
				})
				.css({"margin-right": "10px"});
			}
		if(this.id+1 < this.wiz.slides.length) {
			this.$next = this.$body.find('.next-btn').removeClass("hide")
				.click(function() {
					me.values = me.form.get_values();
					if(me.values===null)
						return;
					frappe.set_route(me.wiz.page_name, me.id+1 + "");
				})
		} else {
			this.$complete = this.$body.find('.complete-btn').removeClass("hide")
				.click(function() {
					me.values = me.form.get_values();
					if(me.values===null)
						return;
					me.wiz.on_complete(me.wiz);
				})
		}

		if(this.onload) {
			this.onload(this);
		}

	},
	get_input: function(fn) {
		return this.form.get_input(fn);
	}
})