import React, { useState, useEffect, useContext } from "react";

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
import makeStyles from '@mui/styles/makeStyles';
import { AuthContext } from "../../context/Auth/AuthContext";
import {  WhatsApp } from "@mui/icons-material";
import { Grid, ListItemText, MenuItem, Select } from "@mui/material";
import Typography from "@mui/material/Typography";
import { toast } from "react-toastify";
//import ShowTicketOpen from "../ShowTicketOpenModal";

const useStyles = makeStyles((theme) => ({
  online: {
    fontSize: 11,
    color: "#25d366"
  },
  offline: {
    fontSize: 11,
    color: "#e1306c"
  }
}));

const filter = createFilterOptions({
  trim: true,
});

const NewTicketModal = ({ modalOpen, onClose, initialContact }) => {
  const classes = useStyles();
  const [options, setOptions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedQueue, setSelectedQueue] = useState("");
  const [selectedWhatsapp, setSelectedWhatsapp] = useState("");
  const [newContact, setNewContact] = useState({});
  const [whatsapps, setWhatsapps] = useState([]);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { user } = useContext(AuthContext);
  const { companyId, whatsappId } = user;

  const [ openAlert, setOpenAlert ] = useState(false);
	const [ userTicketOpen, setUserTicketOpen] = useState("");
	const [ queueTicketOpen, setQueueTicketOpen] = useState("");

  useEffect(() => {
    if (initialContact?.id !== undefined) {
      setOptions([initialContact]);
      setSelectedContact(initialContact);
    }
  }, [initialContact]);


  useEffect(() => {
    setLoading(true);

    if (whatsappId !== null && whatsappId!== undefined) {
      setSelectedWhatsapp(whatsappId)
    }

    if (user.queues.length === 1) {
      setSelectedQueue(user.queues[0].id)
    }

    api
        .get(`/whatsapp`, { params: { companyId, session: 0 } })
        .then(({ data }) => setWhatsapps(data));

    setLoading(false);

  }, [])

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
      setOptions(data.contacts);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastError(err);
    }

  }, [searchParam, modalOpen]);

  const IconChannel = (channel) => {
   switch (channel) {
       case "facebook":
         //return <Facebook style={{ color: "#3b5998", verticalAlign: "middle" }} />;
       case "instagram":
         //return <Instagram style={{ color: "#e1306c", verticalAlign: "middle" }} />;
       case "whatsapp":
         return <WhatsApp style={{ color: "#25d366", verticalAlign: "middle" }} />
       default:
         return "error";
     }
   };

  const handleClose = () => {
    onClose();
    setSearchParam("");
    setOpenAlert(false);
    setUserTicketOpen("");
    setQueueTicketOpen("");
    setSelectedContact(null);
  };

  const handleCloseAlert = () => {
    setOpenAlert(false);
    setLoading(false);
    setOpenAlert(false);
    setUserTicketOpen("");
    setQueueTicketOpen("");
  };

  const handleSaveTicket = async contactId => {
    if (!contactId) return;
    if (selectedWhatsapp === "") {
      toast.error("Selecione uma Conexão");
      return;
    }

    setLoading(true);
    try {
      const queueId = selectedQueue !== "" ? selectedQueue : null;
      const whatsappId = selectedWhatsapp !== "" ? selectedWhatsapp : null;
      const { data: ticket } = await api.post("/tickets", {
        contactId: contactId,
        queueId,
        whatsappId,
        userId: user.id,
        status: "open",
      });

      onClose(ticket);
    } catch (err) {
      setLoading(false);

      // Identificar o erro específico e exibir a mensagem adequada
      if (err.response && err.response.data && err.response.data.error) {
        const errorData = err.response.data.error;

        try {
          const ticket = JSON.parse(errorData);

          if (ticket.userId !== user?.id) {
            setOpenAlert(true);
            setUserTicketOpen(ticket.user.name);
            setQueueTicketOpen(ticket.queue.name);
          } else {
            setOpenAlert(false);
            setUserTicketOpen("");
            setQueueTicketOpen("");
            onClose(ticket);
          }
        } catch (parseError) {
            toast.error("Já existe um atendimento aberto para este contato! 😎");
        }
      } else {
        toast.error("Ocorreu um erro ao salvar o ticket! 🤔");
      }
    }
  };

  const handleSelectOption = (e, newValue) => {
    if (newValue?.number) {
      setSelectedContact(newValue);
    } else if (newValue?.name) {
      setNewContact({ name: newValue.name });
      setContactModalOpen(true);
    }
  };

  const handleCloseContactModal = () => {
    setContactModalOpen(false);
  };

  const handleAddNewContactTicket = contact => {
    handleSaveTicket(contact.id);
  };

  const createAddContactOption = (filterOptions, params) => {
    const filtered = filter(filterOptions, params);
    if (params.inputValue !== "" && !loading && searchParam.length >= 3) {
      filtered.push({
        name: `${params.inputValue}`,
      });
    }
    return filtered;
  };


  const renderOptionLabel = option => {
    if (option.number) {
      return `${option.name} - ${option.number}`;
    } else {
      return `${i18n.t("newTicketModal.add")} ${option.name}`;
    }
  };

  const renderContactAutocomplete = () => {
    if (initialContact === undefined || initialContact.id === undefined) {
      return (
        <Grid xs={12} item>
          <Autocomplete
            fullWidth
            options={options}
            loading={loading}
            clearOnBlur
            autoHighlight
            freeSolo
            clearOnEscape
            getOptionLabel={renderOptionLabel}
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
                    handleSaveTicket(selectedContact.id);
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
        </Grid>
      )
    }
    return null;
  }

  return (
    <>
      <ContactModal
        open={contactModalOpen}
        initialValues={newContact}
        onClose={handleCloseContactModal}
        onSave={handleAddNewContactTicket}
      ></ContactModal>
      <Dialog open={modalOpen} onClose={handleClose}>
        <DialogTitle id="form-dialog-title">
          {i18n.t("newTicketModal.title")}
        </DialogTitle>
        <DialogContent dividers>
          <Grid style={{ width: 300 }} container spacing={2}>
            {/* CONTATO */}
            {renderContactAutocomplete()}
            {/* FILA */}
            <Grid xs={12} item>
              <Select
                required
                fullWidth
                displayEmpty
                variant="outlined"
                value={selectedQueue}
                onChange={(e) => {
                  setSelectedQueue(e.target.value)
                }}
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
                renderValue={() => {
                  if (selectedQueue === "") {
                    return i18n.t("newTicketModal.queue");
                  }
                  const queue = user.queues.find(q => q.id === selectedQueue)
                  return queue.name
                }}
              >
                {user.queues?.length > 0 &&
                  user.queues.map((queue, key) => (
                    <MenuItem dense key={key} value={queue.id}>
                      <ListItemText primary={queue.name} />
                    </MenuItem>
                  ))
                }
              </Select>
            </Grid>
            {/* CONEXAO */}
            <Grid xs={12} item>
              <Select
                fullWidth
                displayEmpty
                variant="outlined"
                value={selectedWhatsapp}
                onChange={(e) => {
                  setSelectedWhatsapp(e.target.value)
                }}
                MenuProps={{
                  anchorOrigin: {
                    vertical: "bottom",
                    horizontal: "left",
                  },
                  transformOrigin: {
                    vertical: "top",
                    horizontal: "left",
                  },
                  getContentAnchorEl: null,
                }}
                renderValue={() => {
                  if (selectedWhatsapp === "") {
                    return i18n.t("newTicketModal.conn")
                  }
                  const whatsapp = whatsapps.find(w => w.id === selectedWhatsapp)
                  return whatsapp.name
                }}
              >
                {whatsapps?.length > 0
                  &&
                  whatsapps.map((whatsapp, key) => (
                    <MenuItem dense key={key} value={whatsapp.id}>
                      <ListItemText
                        primary={
                          <>
                            <Typography component="span" style={{ fontSize: 14, marginLeft: "10px", display: "inline-flex", alignItems: "center", lineHeight: "2" }}>
                              {whatsapp.name} &nbsp; <p className={(whatsapp.status) === 'CONNECTED' ? classes.online : classes.offline} >({whatsapp.status})</p>
                            </Typography>
                          </>
                        }
                      />
                    </MenuItem>
                  ))}
              </Select>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            color="secondary"
            disabled={loading}
            variant="outlined"
          >
            {i18n.t("newTicketModal.buttons.cancel")}
          </Button>
          <ButtonWithSpinner
            variant="contained"
            type="button"
            disabled={!selectedContact}
            onClick={() => handleSaveTicket(selectedContact.id)}
            color="primary"
            loading={loading}
          >
            {i18n.t("newTicketModal.buttons.ok")}
          </ButtonWithSpinner>
        </DialogActions>
      </Dialog >
    </>
  );
};
export default NewTicketModal;
