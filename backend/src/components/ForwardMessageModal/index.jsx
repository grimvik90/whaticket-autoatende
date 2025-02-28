import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";

import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Autocomplete, {
	createFilterOptions,
} from '@mui/material/Autocomplete';
import CircularProgress from "@mui/material/CircularProgress";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ContactModal from "../ContactModal";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { Typography } from '@mui/material';

const ForwardMessageModal = ({ messages, onClose, modalOpen }) => {
    const [optionsContacts, setOptionsContacts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [searchParam, setSearchParam] = useState("");
	const [selectedContact, setSelectedContact] = useState(null);
	const [newContact, setNewContact] = useState({});
	const [contactModalOpen, setContactModalOpen] = useState(false);
	const { user } = useContext(AuthContext);
	const [sending, setSending] = useState(false);
	const [messageSending, setMessageSending] = useState('');

    useEffect(async () => {
		if (!modalOpen || searchParam.length < 3) {
			setLoading(false);
			return;
		}
		setLoading(true);

		try {
			const {data} = await api.get("contacts", {
				params: {searchParam},
			});
			console.log('contacts', data.contacts);
			setOptionsContacts(data.contacts);
			setLoading(false);
		} catch (err) {
			setLoading(false);
			toastError(err);
		}
	}, [searchParam, modalOpen]);

	const history = useHistory();

	const sleep = (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	};

    const handleForwardMessage = async(contactL) => {
		const responseList = [];

		const filtered = messages.filter((message, index, self) =>
			index === self.findIndex((t) => (
				t.id === message.id
			)));



		for (const message of filtered) {
			setSending(true);
			try {
				setMessageSending(message.id);
				const response = await api.post('/message/forward', {messageId: message.id, contactId: contactL.id});
				console.log('Enviada mensagem: ', message);
				responseList.push(response);
				await sleep(900);
			} catch (error) {
				toastError(error);
			}
		}
		setSending(false);
		history.push('/tickets');
    }

    const handleSelectOption = (e, newValue) => {
		if (newValue?.number) {
			setSelectedContact(newValue);
		} else if (newValue?.name) {
			setNewContact({ name: newValue.name });
			setContactModalOpen(true);
		}
	};

    const handleClose = () => {
		onClose();
		setSearchParam("");
		setSelectedContact(null);
		setSending(false);
	};

    const handleCloseContactModal = () => {
		setContactModalOpen(false);
	};

    const renderOption = optionL => {
		if (optionL.number) {
			return `${optionL.name} - ${optionL.number}`;
		} else {
			return `Nenhum contato encontrado com o nome ${optionL.name}`;
		}
	};

	const renderOptionLabel = optionL => {
		if (optionL.number) {
			return `${optionL.name} - ${optionL.number}`;
		} else {
			return `${optionL.name}`;
		}
	};

	const filter = createFilterOptions({
		trim: true,
	});

	const createAddContactOption = (filterOptions, params) => {
		const filtered = filter(filterOptions, params);

		if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
			filtered.push({
				name: `${params.inputValue}`,
			});
		}

		return filtered;
	};

    return (
        <>
			<ContactModal
				open={contactModalOpen}
				initialValues={newContact}
				onClose={handleCloseContactModal}
				onSave={() => console.log('save')}
			></ContactModal>
			<Dialog open={modalOpen} onClose={handleClose}>
				<DialogTitle id="form-dialog-title">
					Encaminhar mensagem
				</DialogTitle>
				<DialogContent dividers>
					<Autocomplete
						options={optionsContacts}
						loading={loading}
						style={{ width: 300 }}
						clearOnBlur
						autoHighlight
						freeSolo
						clearOnEscape
						getOptionLabel={renderOptionLabel}
						renderOption={renderOption}
						filterOptions={createAddContactOption}
						onChange={(e, newValue) => handleSelectOption(e, newValue)}
						renderInput={params => (
							<TextField
								{...params}
								label={i18n.t("newTicketModal.fieldLabel")}
								variant="outlined"
								autoFocus
								onChange={e => setSearchParam(e.target.value)}
								onKeyPress={e => {
									if (loading || !selectedContact) return;
									else if (e.key === "Enter") {
										// handleSaveTicket(selectedContact.id);
									}
								}}
								InputProps={{
									...params.InputProps,
									endAdornment: (
										<React.Fragment>
											{loading ? (
												<CircularProgress color="inherit" size={20} />
											) : null}
											{params.InputProps.endAdornment}
										</React.Fragment>
									),
								}}
							/>
						)}
					/>
				</DialogContent>
				<DialogActions>
					{sending && (
						<>
							<CircularProgress color="inherit" size={20} />
							<Typography variant="body1" color="textSecondary">
								Enviando {messageSending}...
							</Typography>
						</>
					)}
					<ButtonWithSpinner
						variant="contained"
						type="button"
						disabled={!selectedContact || sending}
						onClick={() => handleForwardMessage(selectedContact)}
						color="primary"
						loading={loading}
					>
						Encaminhar
					</ButtonWithSpinner>
				</DialogActions>
			</Dialog>
		</>
    );
};

export default ForwardMessageModal;