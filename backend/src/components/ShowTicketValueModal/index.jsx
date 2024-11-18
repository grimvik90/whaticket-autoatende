import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import { i18n } from '../../translate/i18n';

const ShowTicketValueModal = ({ open, onClose, onSave, ticket, ticketValue, ticketSku }) => {
  const [value, setValue] = useState(ticketValue ? Number(ticketValue) : 0); // Ensure initial value is a number
  const [sku, setSku] = useState(ticketSku);

  const handleValueChange = (e) => setValue(e.target.value);
  const handleSkuChange = (e) => setSku(e.target.value);

  const handleSave = () => {
    onSave(value, sku); // Pass the formatted value for saving
    onClose();
  };

  useEffect(() => {
    if (ticketValue) {
      setValue(Number(ticketValue)); // Format initial value
    }
    if(ticketSku) {
      setSku(ticketSku);
    }
  }, [ticketValue, ticketSku]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Valor do Ticket</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="value"
          label="Valor"
          type="text"
          fullWidth
          value={value}
          onChange={handleValueChange}
        />
        <DialogTitle>Código SKU:</DialogTitle>
        <TextField
          margin="dense"
          id="sku"
          label="SKU"
          type="text"
          fullWidth
          value={sku}
          onChange={handleSkuChange}
        />
      </DialogContent>
      <DialogActions>
      <Button
            onClick={onClose}
            color="secondary"
            variant="outlined"
          >
            {i18n.t("newTicketModal.buttons.cancel")}
          </Button>
          <Button
            variant="contained"
            type="button"
            onClick={handleSave}
            color="primary"
          >
            {i18n.t("newTicketModal.buttons.ok")}
          </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ShowTicketValueModal;