import React, {useContext, useState, useRef, useEffect} from "react";
import { useHistory } from "react-router-dom";
import { Can } from "../Can";

import { createTheme, ThemeProvider, StyledEngineProvider, adaptV4Theme } from "@mui/material/styles";
import makeStyles from '@mui/styles/makeStyles';
import { Menu, IconButton } from "@mui/material";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import TicketOptionsMenu from "../TicketOptionsMenu";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import { Snackbar, Button } from "@mui/material";
import Tooltip from '@mui/material/Tooltip';
import { green } from '@mui/material/colors';
import { BiSend, BiTransfer } from 'react-icons/bi';
import { ToastContainer, toast } from "react-toastify";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import ScheduleModal from "../ScheduleModal";
import ConfirmationModal from "../ConfirmationModal";
import usePlans from "../../hooks/usePlans";
import TicketMessagesExportDialog from "../TicketMessagesExportDialog";
import ShowTicketValueModal from "../ShowTicketValueModal";
import MenuItem from "@mui/material/MenuItem";

import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'; // abrir menu de icones
import PaidRoundedIcon from '@mui/icons-material/PaidRounded'; // showvaluemodal
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'; // marcar como resolvido
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded'; // salvar como pdf
import KeyboardReturnRoundedIcon from '@mui/icons-material/KeyboardReturnRounded'; // retomar ticket
import SyncAltRoundedIcon from '@mui/icons-material/SyncAltRounded'; // transferir ticket
import ReplayCircleFilledRoundedIcon from '@mui/icons-material/ReplayCircleFilledRounded'; // retomar conversa
import EventRoundedIcon from '@mui/icons-material/EventRounded'; // fazer agendamento
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import useSettings from "../../hooks/useSettings";
const useStyles = makeStyles(theme => ({
	actionButtons: {
		marginRight: 6,
		[theme.breakpoints.down('lg')]: {
			marginRight: 0,
		},

		flex: "none",
		alignSelf: "center",
		marginLeft: "auto",
		"& > *": {
			margin: theme.spacing(0.5),
		},
	},
	snackbar: {
        display: "flex",
        justifyContent: "space-between",
        backgroundColor: theme.palette.primary.main,
        color: "white",
        borderRadius: 30,
        [theme.breakpoints.down('md')]: {
            fontSize: "0.8em",
        },
        [theme.breakpoints.up("md")]: {
            fontSize: "1em",
        },
    },
	icons: {
        color: theme.palette.iconColor
    }
}));

const TicketActionButtonsCustom = ({ 
	ticket, 
	showSelectMessageCheckbox, 
	selectedMessages, 
	forwardMessageModalOpen,
	setForwardMessageModalOpen,
    handleCloseTicket
 }) => {
	const classes = useStyles();
	const history = useHistory();
	const isMounted = useRef(true);
	const [anchorEl, setAnchorEl] = useState(null);
	const [loading, setLoading] = useState(false);
	const ticketOptionsMenuOpen = Boolean(anchorEl);
	const { user } = useContext(AuthContext);
	const { setCurrentTicket } = useContext(TicketsContext);	
	const [confirmationOpen, setConfirmationOpen] = useState(false);
	const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);
	const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
	const [contactId, setContactId] = useState(null);
	const [open, setOpen] = React.useState(false);
	const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
	const [showSchedules, setShowSchedules] = useState(false);
	const [showTicketLogOpen, setShowTicketLogOpen] = useState(false);
	const [setValueModalOpen, setSetValueModalOpen] = useState(false); // Estado para controlar a visibilidade do modal
	const [ticketValue, setTicketValue] = useState(ticket.value || '');
	const [ticketSku, setTicketSku] = useState(ticket.sku || ''); 
    const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [enableTicketValueAndSku, setEnableTicketValueAndSku] = useState(false);
 	const { getPlanCompany } = usePlans();
	 const {getCachedSetting} = useSettings();


	useEffect(async () => {
		async function fetchData() {
			const companyId = user.companyId;
			const planConfigs = await getPlanCompany(undefined, companyId);
			setShowSchedules(planConfigs.plan.useSchedules);
			setOpenTicketMessageDialog(false);
		}

		await fetchData();
		setShowTicketLogOpen(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(async () => {

		const enableTicketValueAndSku = await getCachedSetting("enableTicketValueAndSku");
		if (enableTicketValueAndSku) {
			setEnableTicketValueAndSku(enableTicketValueAndSku?.value || "enabled");
		}


	}, []);

	const customTheme = createTheme(adaptV4Theme({
		palette: {
		  	primary: green,
		}
	}));

	const handleOpenTicketOptionsMenu = e => {
		setAnchorEl(e.currentTarget);
	};

	const handleCloseTicketOptionsMenu = e => {
		setAnchorEl(null);
	};

	const handleClose = () => {
		//formRef.current.resetForm();
		setOpen(false);
	  };

	  const handleOpenSetValueModal = () => {
		setTicketValue(ticketValue);  // Garante que o valor atual do ticket seja carregado no estado
		setTicketSku(ticketSku);       // Garante que o SKU atual do ticket seja carregado no estado
		setSetValueModalOpen(true);
	};

	const handleOpenScheduleModal = () => {
		if (typeof handleClose == "function") handleClose();
		setContactId(ticket.contact.id);
		setScheduleModalOpen(true);
	  };
	
	  const handleCloseScheduleModal = () => {
		setScheduleModalOpen(false);
		setContactId(null);
	  };

	  const handleOpenTransferModal = (e) => {
		setTransferTicketModalOpen(true);
		if (typeof handleClose == "function") handleClose();
	  };

	  const handleCloseTransferTicketModal = () => {
		if (isMounted.current) {
		  setTransferTicketModalOpen(false);
		}
	  };

	  const handleOpenConfirmationModal = (e) => {
		setConfirmationOpen(true);
		if (typeof handleClose == "function") handleClose();
	  };

	  const handleDeleteTicket = async () => {
		try {
		  await api.delete(`/tickets/${ticket.id}`);
		} catch (err) {
		  toastError(err);
		}
	  };

	const handleUpdateTicketValueAndSKu = async (ticketValue, ticketSku) => {
		try {
			setLoading(true);
			console.log("Value: %S", ticketValue);
			console.log("SKU: %S", ticketSku);
			await api.put(`/tickets/value/${ticket.id}`, {
				value: ticketValue,				
                sku: ticketSku
			});
			toast.success('Valor atualizado com sucesso!');
			setLoading(false);
		} catch (err) {
			setLoading(false);
			toastError(err);
		} finally {
			setSetValueModalOpen(false);
		}
	};

	const handleOpenModalForward = () => {
		if (selectedMessages.length === 0) {
			toastError({response: {data: {message: "Nenhuma mensagem selecionada"}}});
			return;
		}
		setForwardMessageModalOpen(true);
	}

	const handleUpdateTicketStatus = async (e, status, userId) => {
		setLoading(true);
		setSnackbarOpen(false);
		try {
			await api.put(`/tickets/${ticket.id}`, {
				status: status,
				userId: userId || null,				
                sendFarewellMessage: true,
				useIntegration: status === "closed" ? false : ticket.useIntegration,
				promptId: status === "closed" ? false : ticket.promptId,
				integrationId: status === "closed" ? false : ticket.integrationId
			});

			setLoading(false);
			if (status === "open") {
				setCurrentTicket({ ...ticket, code: "#open" });
			} else {
				setCurrentTicket({ id: null, code: null })
				history.push("/tickets");
			}
		} catch (err) {
			setLoading(false);
			toastError(err);
		}
	};

	const handleClick = (event) => {
		setAnchorEl(event.currentTarget);
	};

	const handleCloseTicketWithoutFarewellMsg = async (e, status, userId) => {
        setLoading(true);
		setSnackbarOpen(false);
        try {
            await api.put(`/tickets/${ticket.id}`, {
                status: status,
                userId: userId || null,
                sendFarewellMessage: false,
            });

            setLoading(false);
            history.push("/tickets");
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
    };

	const handleResolveClick = () => {
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbarOpen(false);
    };

	return <>
        {openTicketMessageDialog && (
            <TicketMessagesExportDialog
                open={openTicketMessageDialog}
                handleClose={() => setOpenTicketMessageDialog(false)}
                ticketId={ticket.id}
            />
        )}

        <div className={classes.actionButtons}>
            <IconButton onClick={handleClick} size="large">
                <MoreVertRoundedIcon />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                keepMounted
                open={Boolean(anchorEl)}
                onClose={handleCloseTicketOptionsMenu}
            >
                <MenuItem onClick={() => { handleClose(); setOpenTicketMessageDialog(true); }}>
                    <Tooltip title={i18n.t("ticketsList.buttons.exportAsPdf")}>
                        <PictureAsPdfRoundedIcon className={classes.icons}/>
                    </Tooltip>
                </MenuItem>
                {enableTicketValueAndSku === "enabled" && (
                <MenuItem onClick={() => { handleClose(); handleOpenSetValueModal(); }}>
                    <Tooltip title="Definir Valor e SKU do Ticket">
                        <PaidRoundedIcon className={classes.icons}/>
                    </Tooltip>
                </MenuItem>
                )}
                {ticket.status === "closed" && (
                    <MenuItem onClick={e => { handleClose(); handleUpdateTicketStatus(e, "open", user?.id); }}>
                        <ButtonWithSpinner
                            loading={loading}
                            startIcon={<ReplayCircleFilledRoundedIcon />}
                            size="small"
                        >
                            {i18n.t("messagesList.header.buttons.reopen")}
                        </ButtonWithSpinner>
                    </MenuItem>
                )}
                {(ticket.status === "open" || ticket.status === "group") && (
                    <>
                        {!showSelectMessageCheckbox ? (
                            <>
                                <MenuItem onClick={e => { handleClose(); handleUpdateTicketStatus(e, "pending", null); }}>
                                    <Tooltip title={i18n.t("messagesList.header.buttons.return")}>
                                        <KeyboardReturnRoundedIcon className={classes.icons}/>
                                    </Tooltip>
                                </MenuItem>
                                <MenuItem onClick={() => { handleClose(); handleCloseTicket(); }}>
                                    <Tooltip title={i18n.t("messagesList.header.buttons.resolve")}>
                                        <CheckCircleRoundedIcon className={classes.icons}/>
                                    </Tooltip>
                                </MenuItem>
                                <MenuItem onClick={() => { handleClose(); handleOpenTransferModal(); }}>
                                    <Tooltip title="Transferir Atendimento">
                                        <SyncAltRoundedIcon className={classes.icons}/>
                                    </Tooltip>
                                </MenuItem>

                                <MenuItem onClick={() => { handleClose(); handleOpenScheduleModal(); }}>
                                    <Tooltip title="Agendamento">
                                        <EventRoundedIcon className={classes.icons}/>
                                    </Tooltip>
                                </MenuItem>
                                <Can
                                    role={user.profile}
                                    perform="ticket-options:deleteTicket"
                                    yes={() => (
                                        <MenuItem onClick={() => { handleClose(); handleOpenConfirmationModal(); }}>
                                            <Tooltip title="Deletar Ticket">
                                                <HighlightOffRoundedIcon className={classes.icons}/>
                                            </Tooltip>
                                        </MenuItem>
                                    )}
                                />
                            </>
                        ) : (
                            <MenuItem onClick={() => { handleClose(); handleOpenModalForward(); }}>
                                <ButtonWithSpinner
                                    loading={loading}
                                    startIcon={<BiSend />}
                                    size="small"
                                >
                                    {i18n.t("messageOptionsMenu.forwardbutton")}
                                </ButtonWithSpinner>
                            </MenuItem>
                        )}
                    </>
                )}
            </Menu>
            {ticket.status === "pending" && (
                <ButtonWithSpinner
                    loading={loading}
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={e => handleUpdateTicketStatus(e, "open", user?.id)}
                >
                    {i18n.t("messagesList.header.buttons.accept")}
                </ButtonWithSpinner>
            )}
        </div>

        <ConfirmationModal
            title={`${i18n.t("ticketOptionsMenu.confirmationModal.title")} #${ticket.id}?`}
            open={confirmationOpen}
            onClose={setConfirmationOpen}
            onConfirm={handleDeleteTicket}
        >
            {i18n.t("ticketOptionsMenu.confirmationModal.message")}
        </ConfirmationModal>

        <ShowTicketValueModal
            open={setValueModalOpen}
            onClose={() => setSetValueModalOpen(false)}
            onSave={(ticketValue, ticketSku) => {
                handleUpdateTicketValueAndSKu(ticketValue, ticketSku);
            }}
            ticket={ticket}
            ticketValue={ticketValue}
            ticketSku={ticketSku}
        />

        <TransferTicketModalCustom
            modalOpen={transferTicketModalOpen}
            onClose={handleCloseTransferTicketModal}
            ticketid={ticket.id}
        />

        <ScheduleModal
            open={scheduleModalOpen}
            onClose={handleCloseScheduleModal}
            aria-labelledby="form-dialog-title"
            contactId={contactId}
        />

        <Snackbar
            open={snackbarOpen}
            autoHideDuration={6000}
            onClose={handleSnackbarClose}
            message={i18n.t("messagesList.confirm.resolveWithMessage")}
            ContentProps={{
                className: classes.snackbar,
            }}
            action={
                <>
                    <Button color="secondary" size="small" onClick={e => handleUpdateTicketStatus(e, "closed", user?.id)}>
                        {i18n.t("messagesList.confirm.yes")}
                    </Button>
                    <Button color="secondary" size="small" onClick={e => handleCloseTicketWithoutFarewellMsg(e, "closed", user?.id)}>
                        {i18n.t("messagesList.confirm.no")}
                    </Button>
                </>
            }
            className={classes.snackbar}
        />
    </>;
};

export default TicketActionButtonsCustom;