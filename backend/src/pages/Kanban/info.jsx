import React, {useState} from "react";
import {useTheme} from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import InfoIcon from "@mui/icons-material/Info";
import CancelIcon from "@mui/icons-material/Cancel";

const InfoIconButton = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <IconButton onClick={handleOpen} size="large">
        <InfoIcon style={{color: theme.palette.text.primary}}/>
      </IconButton>
      <Modal open={open} onClose={handleClose}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: theme.palette.background.paper,
            padding: "20px",
            borderRadius: "5px",
            outline: "none",
            maxWidth: "80%",
            maxHeight: "80%",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            color: theme.palette.text.primary,
          }}
        >
          <IconButton
            style={{position: "absolute", top: "5px", right: "5px"}}
            onClick={handleClose}
            size="large">
            <CancelIcon/>
          </IconButton>
          <div style={{marginBottom: "20px"}}/>
          <Typography variant="body1" style={{color: theme.palette.text.primary}}>
            🕕 <strong>Horário de Agendamento:</strong> Todos os agendamentos serão enviados entre as 18:00 e
            18:30.
          </Typography>
          <Typography variant="body1" style={{color: theme.palette.text.primary}}>
            🔄 <strong>Agendamento Recorrente:</strong><br/>
            1. Vá para a aba de "Tags de Campanha".<br/>
            2. Crie novas tags, se necessário.<br/>
            3. Siga estes passos:<br/>
            - Vá na engrenagem de configurações.<br/>
            - Selecione um dos quadros disponíveis.<br/>
            - Altere a mensagem que será enviada.<br/>
            - Se necessário, escolha um arquivo a ser enviado.<br/>
            - Escolha a frequência do agendamento (a cada quantos dias).<br/>
            - Clique em "Salvar".
          </Typography>
          <Typography variant="body1" style={{color: theme.palette.text.primary}}>
            📋 <strong>Tickets Sem Campanhas Ativas:</strong><br/>
            - Todos os tickets sem campanhas ativas entrarão no quadro "EM Aberto".
          </Typography>
          <Typography variant="body1" style={{color: theme.palette.text.primary}}>
            🚀 <strong>Criar uma Campanha:</strong><br/>
            - Para criar uma campanha, arraste o ticket para o quadro de campanha de sua escolha.
          </Typography>
          <Typography variant="body1" style={{color: theme.palette.text.primary}}>
            🔄 <strong>Mover Tickets entre Quadros:</strong><br/>
            - Ao mover um ticket para um quadro, os agendamentos serão feitos com base nas configurações do
            quadro.<br/>
            - Ao mover um ticket para outro quadro, os agendamentos existentes serão excluídos e um novo
            agendamento será criado de acordo com o quadro escolhido.<br/>
            - Ao mover um ticket de volta para o quadro "Em Aberto", os agendamentos existentes do ticket
            serão excluídos.
          </Typography>

        </div>
      </Modal>
    </>
  );
};

export default InfoIconButton;
