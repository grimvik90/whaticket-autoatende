const rules = {
	user: {
		static: [
			"user-modal:editPassword",
			"ticket-options:spy",
			"contacts-page:createContact",
			"contacts-page:deleteContact",
			"contacts-page:editContact",
		],
	},

	superv: {
		static: [
			"dashboard:view",
			"drawer-superv-items:view",
			"tickets-manager:showall",
			"user-modal:editWhatsApp",
			"user-modal:editDetails",
			"user-modal:editPassword",
			"user-modal:editQueues",
			"user-modal:editSpy",
			"user-modal:editIsTricked",
			"user-modal:editViewAllTicket",
			"ticket-options:deleteTicket",
			"ticket-options:spy",
			"ticket-options:reject",
			"contacts-page:createContact",
			"contacts-page:deleteContact",
			"contacts-page:editContact",
			"contacts-page:deleteAllContacts",
			"connections-page:restartConnection",
		],
	},

	admin: {
		static: [
			"dashboard:view",
			"drawer-admin-items:view",
			"tickets-manager:showall",
			"user-modal:editProfile",
			"user-modal:editWhatsApp",
			"user-modal:editDetails",
			"user-modal:editPassword",
			"user-modal:editQueues",
			"user-modal:editSpy",
			"user-modal:editIsTricked",
			"user-modal:editViewAllTicket",
			"ticket-options:deleteTicket",
			"ticket-options:spy",
			"ticket-options:reject",
			"contacts-page:createContact",
			"contacts-page:editContact",
			"contacts-page:deleteContact",
			"contacts-page:deleteAllContacts",
			"connections-page:actionButtons",
			"connections-page:addConnection",
			"connections-page:editOrDeleteConnection",
			"connections-page:restartConnection"
		],
	},
};

export default rules;