import React, {useState, useEffect, useReducer, useContext, useRef} from "react";

import {toast} from "react-toastify";
import {useHistory} from "react-router-dom";

import {CSVLink} from "react-csv";

import makeStyles from '@mui/styles/makeStyles';
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import SearchIcon from "@mui/icons-material/Search";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

import IconButton from "@mui/material/IconButton";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";

import ImportIcon from '@mui/icons-material/GetApp';
import DeleteForever from '@mui/icons-material/DeleteForeverOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import ExportIcon from '@mui/icons-material/ImportExport';

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import ContactModal from "../../components/ContactModal";
import ConfirmationModal from "../../components/ConfirmationModal/";

import {i18n} from "../../translate/i18n";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";
import {AuthContext} from "../../context/Auth/AuthContext";
import {Can} from "../../components/Can";
import NewTicketModal from "../../components/NewTicketModal";
import {SocketContext} from "../../context/Socket/SocketContext";

import {Menu, MenuItem, Tooltip} from "@mui/material";
import {ArrowDropDown, Backup, ContactPhone} from "@mui/icons-material";

import PopupState, {bindTrigger, bindMenu} from "material-ui-popup-state";
import formatSerializedId from '../../utils/formatSerializedId';

const reducer = (state, action) => {
    if (action.type === "LOAD_CONTACTS") {
        const contacts = action.payload;
        const newContacts = [];

        contacts.forEach((contact) => {
            const contactIndex = state.findIndex((c) => c.id === contact.id);
            if (contactIndex !== -1) {
                state[contactIndex] = contact;
            } else {
                newContacts.push(contact);
            }
        });

        return [...state, ...newContacts];
    }

    if (action.type === "UPDATE_CONTACTS") {
        const contact = action.payload;
        const contactIndex = state.findIndex((c) => c.id === contact.id);

        if (contactIndex !== -1) {
            state[contactIndex] = contact;
            return [...state];
        } else {
            return [contact, ...state];
        }
    }

    if (action.type === "DELETE_CONTACT") {
        const contactId = action.payload;

        const contactIndex = state.findIndex((c) => c.id === contactId);
        if (contactIndex !== -1) {
            state.splice(contactIndex, 1);
        }
        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }
};

const useStyles = makeStyles((theme) => ({
    mainPaper: {
        flex: 1,
        padding: theme.spacing(1),
        overflowY: "scroll",
        ...theme.scrollbarStyles,
    },
    CSVLink: {
        color: "white"
    },
    iconButton: {
        paddingRight: 0,
    },
}));

const Contacts = () => {
    const classes = useStyles();
    const history = useHistory();

    const {user} = useContext(AuthContext);

    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [searchParam, setSearchParam] = useState("");
    const [contacts, dispatch] = useReducer(reducer, []);
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
    const [contactTicket, setContactTicket] = useState({});
    const [deletingContact, setDeletingContact] = useState(null);
    const [deletingAllContact, setDeletingAllContact] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [hasMore, setHasMore] = useState(false);

    const socketManager = useContext(SocketContext);
    const fileUploadRef = useRef(null);

    useEffect(() => {
        dispatch({type: "RESET"});
        setPageNumber(1);
    }, [searchParam]);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            const fetchContacts = async () => {
                try {
                    const {data} = await api.get("/contacts/", {
                        params: {searchParam, pageNumber},
                    });
                    dispatch({type: "LOAD_CONTACTS", payload: Array.isArray(data.contacts) ? data.contacts : []});
                    setHasMore(data.hasMore);
                    setLoading(false);
                } catch (err) {
                    toastError(err);
                }
            };
            fetchContacts();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber]);

    useEffect(() => {
        const companyId = localStorage.getItem("companyId");
        const socket = socketManager.GetSocket(companyId);

        const onContact = (data) => {
            if (data.action === "update" || data.action === "create") {
                dispatch({type: "UPDATE_CONTACTS", payload: data.contact});
            }

            if (data.action === "delete") {
                dispatch({type: "DELETE_CONTACT", payload: +data.contactId});
            }
        }

        socket.on(`company-${companyId}-contact`, onContact);

        return () => {
            socket.off(`company-${companyId}-contact`, onContact);
        };
    }, []);

    const handleSearch = (event) => {
        setSearchParam(event.target.value.toLowerCase());
    };

    const handleOpenContactModal = () => {
        setSelectedContactId(null);
        setContactModalOpen(true);
    };

    const handleCloseContactModal = () => {
        setSelectedContactId(null);
        setContactModalOpen(false);
    };

    // const handleSaveTicket = async contactId => {
    // 	if (!contactId) return;
    // 	setLoading(true);
    // 	try {
    // 		const { data: ticket } = await api.post("/tickets", {
    // 			contactId: contactId,
    // 			userId: user?.id,
    // 			status: "open",
    // 		});
    // 		history.push(`/tickets/${ticket.id}`);
    // 	} catch (err) {
    // 		toastError(err);
    // 	}
    // 	setLoading(false);
    // };

    const handleCloseOrOpenTicket = (ticket) => {
        setNewTicketModalOpen(false);
        if (ticket !== undefined && ticket.uuid !== undefined) {
            history.push(`/tickets/${ticket.uuid}`);
        }
    };

    const hadleEditContact = (contactId) => {
        setSelectedContactId(contactId);
        setContactModalOpen(true);
    };

    const handleDeleteContact = async (contactId) => {
        try {
            await api.delete(`/contacts/${contactId}`);
            toast.success(i18n.t("contacts.toasts.deleted"));
        } catch (err) {
            toastError(err);
        }
        setDeletingContact(null);
        setSearchParam("");
        setPageNumber(1);
    };

    const handleDeleteAllContact = async () => {
        try {
            await api.delete("/contacts");
            toast.success(i18n.t("contacts.toasts.deletedAll"));
            history.go(0);
        } catch (err) {
            toastError(err);
        }
        setDeletingAllContact(null);
        setSearchParam("");
        setPageNumber();
    };

    const handleimportContact = async () => {
        try {
            await api.post("/contacts/import");
            history.go(0);
        } catch (err) {
            toastError(err);
        }
    };

    const loadMore = () => {
        setPageNumber((prevState) => prevState + 1);
    };

    const handleScroll = (e) => {
        if (!hasMore || loading) return;
        const {scrollTop, scrollHeight, clientHeight} = e.currentTarget;
        if (scrollHeight - (scrollTop + 100) < clientHeight) {
            loadMore();
        }
    };

    console.log("USER", user.profile)

    return (
        <MainContainer className={classes.mainContainer}>
            <NewTicketModal
                modalOpen={newTicketModalOpen}
                initialContact={contactTicket}
                onClose={(ticket) => {
                    handleCloseOrOpenTicket(ticket);
                }}
            />
            <ContactModal
                open={contactModalOpen}
                onClose={handleCloseContactModal}
                aria-labelledby="form-dialog-title"
                contactId={selectedContactId}
            ></ContactModal>
            <ConfirmationModal
                title={
                    deletingContact
                        ? `${i18n.t("contacts.confirmationModal.deleteTitle")} ${
                            deletingContact.name
                        }?`
                        : deletingAllContact ? `${i18n.t("contacts.confirmationModal.deleteAllTitle")}`
                            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
                }
                open={confirmOpen}
                onClose={setConfirmOpen}
                onConfirm={(e) =>
                    deletingContact
                        ? handleDeleteContact(deletingContact.id)
                        : deletingAllContact ? handleDeleteAllContact(deletingAllContact)
                            : handleimportContact()
                }
            >
                {deletingContact
                    ? `${i18n.t("contacts.confirmationModal.deleteMessage")}`
                    : deletingAllContact ? `${i18n.t("contacts.confirmationModal.deleteAllMessage")}`
                        : `${i18n.t("contacts.confirmationModal.importMessage")}`}
            </ConfirmationModal>
            <MainHeader>
                <Title>{i18n.t("contacts.title")} ({contacts.length || 0})</Title>
                <MainHeaderButtonsWrapper>
                    <TextField
                        placeholder={i18n.t("contacts.searchPlaceholder")}
                        type="search"
                        value={searchParam}
                        onChange={handleSearch}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon style={{color: "gray"}}/>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Tooltip title={i18n.t("contacts.buttons.add")}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleOpenContactModal}
                        >
                            <AddBoxOutlinedIcon
                                className={classes.iconButton}
                            />
                        </Button>
                    </Tooltip>


                    <PopupState variant="popover" popupId="demo-popup-menu">
                        {(popupState) => (
                            <React.Fragment>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    {...bindTrigger(popupState)}
                                >
                                    {i18n.t("contacts.buttons.importExport")}
                                    <ArrowDropDown/>
                                </Button>
                                <Menu {...bindMenu(popupState)}>
                                    <MenuItem
                                        onClick={() => {
                                            setConfirmOpen(true);
                                            //setImportContacts(true);
                                            popupState.close();
                                        }}
                                    >
                                        <ContactPhone
                                            fontSize="small"
                                            color="primary"
                                            style={{
                                                marginRight: 10,
                                            }}
                                        />
                                        {i18n.t("contacts.buttons.import")}
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            fileUploadRef.current.value = null;
                                            fileUploadRef.current.click();
                                        }}
                                    >
                                        <Backup
                                            fontSize="small"
                                            color="primary"
                                            style={{
                                                marginRight: 10,
                                            }}
                                        />
                                        {i18n.t("contacts.buttons.importCsv")}
                                    </MenuItem>
                                    <MenuItem>
                                        <CSVLink style={{textDecoration: 'none'}} separator=";"
                                                 filename={'contatos.csv'} data={contacts.map((contact) => ({
                                            name: contact.name,
                                            number: contact.number,
                                            email: contact.email
                                        }))}>

                                            <ExportIcon
                                                color="primary"
                                                style={{
                                                    marginRight: 10,
                                                }}
                                            />
                                            {i18n.t("contacts.buttons.export")}
                                        </CSVLink>

                                    </MenuItem>


                                </Menu>
                            </React.Fragment>
                        )}
                    </PopupState>



                    <Can
                        role={user.profile}
                        perform="contacts-page:deleteAllContacts"
                        yes={() => (
                            <>
                                <Tooltip title={i18n.t("contacts.buttons.delete")}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={(e) => {
                                            setConfirmOpen(true);
                                            setDeletingAllContact(contacts);
                                        }}
                                    >
                                        <DeleteForever
                                            className={classes.iconButton}
                                        />
                                    </Button>
                                </Tooltip>
                            </>
                        )}
                    />

                </MainHeaderButtonsWrapper>
            </MainHeader>
            <Paper
                className={classes.mainPaper}
                variant="outlined"
                onScroll={handleScroll}
            >

                <>
                    <input
                        style={{display: "none"}}
                        id="upload"
                        name="file"
                        type="file"
                        accept=".xls,.xlsx"
                        onChange={() => {
                            setConfirmOpen(true);
                        }}
                        ref={fileUploadRef}
                    />
                </>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell padding="checkbox"/>
                            <TableCell>{i18n.t("contacts.table.id")}</TableCell>
                            <TableCell>{i18n.t("contacts.table.name")}</TableCell>
                            <TableCell align="center">
                                {i18n.t("contacts.table.whatsapp")}
                            </TableCell>
                            <TableCell align="center">
                                {i18n.t("contacts.table.email")}
                            </TableCell>
                            <TableCell align="center">
                                {i18n.t("contacts.table.actions")}
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <>
                        {contacts.map((contact) => (
                        <TableRow key={contact.id}>
                            <TableCell style={{paddingRight: 0}}>
                                {contact ? (
                                    <Avatar style={{ backgroundColor: generateColor(contact?.number), fontWeight: "bold", color: "white" }} src={contact.profilePicUrl}>
                                        {getInitials(contact?.name)}
                                    </Avatar>
                                ) : null}
                            </TableCell>
                            <TableCell>{contact ? contact.id : 'N/A'}</TableCell>
                            <TableCell>{contact ? contact.name : 'N/A'}</TableCell>
                            <TableCell align="center">
                                {contact && user.isTricked === "enabled" 
                                    ? formatSerializedId(contact?.number)
                                    : contact ? contact.number.slice(0, -4) + "****" : 'N/A'}
                            </TableCell>
                            <TableCell align="center">{contact ? contact.email : 'N/A'}</TableCell>
                            <TableCell align="center">
                                <Can
                                    role={user.profile}
                                    perform="contacts-page:createContact"
                                    yes={() => (
                                        <IconButton
                                            size="small"
                                            onClick={() => {
                                                setContactTicket(contact);
                                                setNewTicketModalOpen(true);
                                            }}
                                        >
                                            <WhatsAppIcon/>
                                        </IconButton>
                                    )}
                                />
                                <Can
                                    role={user.profile}
                                    perform="contacts-page:editContact"
                                    yes={() => (
                                        <IconButton
                                            size="small"
                                            onClick={() => hadleEditContact(contact.id)}
                                        >
                                            <EditIcon/>
                                        </IconButton>
                                    )}
                                />
                                <Can
                                    role={user.profile}
                                    perform="contacts-page:deleteContact"
                                    yes={() => (
                                        <IconButton
                                            size="small"
                                            onClick={(e) => {
                                                setConfirmOpen(true);
                                                setDeletingContact(contact);
                                            }}
                                        >
                                            <DeleteOutlineIcon/>
                                        </IconButton>
                                    )}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                    {loading && <TableRowSkeleton avatar columns={3}/>}
                        </>
                    </TableBody>
                </Table>
            </Paper>
        </MainContainer>
    );
};

export default Contacts;