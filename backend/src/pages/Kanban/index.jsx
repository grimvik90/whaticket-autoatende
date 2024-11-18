import React, {useState, useEffect, useReducer, useContext, useCallback} from "react";
import makeStyles from '@mui/styles/makeStyles';
import api from "../../services/api";
import {AuthContext} from "../../context/Auth/AuthContext";
import Board from 'react-trello';
import {toast} from "react-toastify";
import {i18n} from "../../translate/i18n";
import {useHistory} from 'react-router-dom';
import usePlans from '../../hooks/usePlans';
import useTickets from '../../hooks/useTickets';
import {DatePickerMoment} from '../../components/DatePickerMoment';
import {UsersFilter} from '../../components/UsersFilter';
import {KanbanSearch} from '../../components/KanbanSearch/KanbanSearch';
import moment from 'moment';
import SearchIcon from "@mui/icons-material/Search";
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SettingsIcon from "@mui/icons-material/Settings";
import InstructionsModal from "./info"
import BoardSettingsModal from "../../components/kanbanModal";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import "./style.css";
import FormControl from "@mui/material/FormControl";
import TextField from "@mui/material/TextField"; // Importe o arquivo CSS
const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(1),
  },
  button: {
    background: "#10a110",
    border: "none",
    padding: "10px",
    color: "white",
    fontWeight: "bold",
    borderRadius: "5px",
  },
  bottomButtonVisibilityIcon: {
    position: 'relative',
    bottom: '-10px',
  },
}));

const Kanban = () => {
  const classes = useStyles();
  const history = useHistory();

  const {user} = useContext(AuthContext);
  const {profile, queues} = user;
  const jsonString = user.queues.map(queue => queue.UserQueue.queueId);

  const [tags, setTags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [reloadData, setReloadData] = useState(false);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [enableTicketValueAndSku, setEnableTicketValueAndSku] = useState(false);
  const [searchParams, setSearchParams] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedDate, setSelectedDate] = useState({
    from: '',
    until: '',
  });

  const {getPlanCompany} = usePlans();

  useEffect(() => {
    async function fetchData() {
      const companyId = user?.companyId
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useKanban) {
        toast.error(
          'Você não possui acesso a este recurso! Faça um upgrade em sua assinatura ou contate o suporte!'
        );
        setTimeout(() => {
          history.push(`/`);
        }, 1000);
      }
    }

    fetchData();
  }, []);
  useEffect(() => {
    api.get(`/settings`).then(({data}) => {
      if (Array.isArray(data)) {
        const enableTicketValueAndSku = data.find((d) => d.key === "enableTicketValueAndSku");
        if (enableTicketValueAndSku) {
          setEnableTicketValueAndSku(enableTicketValueAndSku?.value || "disabled");
        }
      }
    });
  }, []);

  const handleOpenBoardSettings = () => {
    setSettingsModalOpen(true);
  };

  const fetchTags = async () => {
    try {
      const response = await api.get("/tags/kanban");
      const fetchedTags = response.data.lista || [];

      setTags(fetchedTags);

      // Fetch tickets after fetching tags
      await fetchTickets(jsonString);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(async () => {
    await fetchTags();

  }, [selectedUsers, selectedDate, searchParams]);

  const [file, setFile] = useState({
    lanes: []
  });


  const fetchTickets = async (jsonString) => {
    try {

      const {data} = await api.get("/ticket/kanban", {
        params: {
          showAll: profile === 'admin' || profile === 'supervisor',
          searchParam: searchParams,
          users: JSON.stringify(selectedUsers),
          queueIds: JSON.stringify(jsonString),
          dateFrom: selectedDate.from,
          dateUntil: selectedDate.until,
        },
      });
      setTickets(data.tickets);
    } catch (err) {
      console.log(err);
      setTickets([]);
    }
  };


  const popularCards = async (jsonString) => {
    const lanes = [{
      id: 0,
      title: enableTicketValueAndSku === "enable"
          ? i18n.t("Em aberto") + " " + tickets.length.toString() + " (R$ " +
          tickets.reduce((acc, ticket) => {
            const value = Number(ticket.value || 0);
            return acc + value;
          }, 0).toFixed(2).replace('.', ',') + ")"
          : i18n.t("Em aberto") + " " + tickets.length.toString(),
      cards: await Promise.all(tickets.filter(ticket => ticket.tags.length === 0 && ticketMatchesSearchQuery(ticket)).map(async (ticket) => {
        let ticketName = ticket.name;
        if (!ticketName) {
          try {
            const response = await api.get(`/tickets/${ticket.id}`);
            ticketName = response.data.name || 'Sem título';
          } catch (error) {
            console.error("Erro ao buscar o nome do ticket:", error);
            ticketName = 'Sem título';
          }
        }

        return {
          id: ticket.id.toString(),
          label: "Ticket nº " + ticket.id.toString(),
          description: (
              <div>
                <p>
                  <strong>{ticket.contact.name || ticket.contact.number}</strong>
                  <br/>
                  {ticket.contact.number !== ticket.contact.name && ticket.contact.number}
                  <br/>
                  {ticket.lastMessage}
                  <br/>
                  {enableTicketValueAndSku === "enable" && (
                      <>
                        <b>SKU: {ticket.sku || 'N/D'}</b> -
                        <b>VALOR: R${(Number(ticket.value) || 0).toFixed(2).replace('.', ',')}</b>
                      </>
                  )}
                </p>
                <IconButton
                    edge="start"
                    onClick={() => {
                      handleCardClick(ticket.uuid)
                    }}
                    size="large">
                  <WhatsAppIcon style={{color: "#10a110"}}/>
                </IconButton>
              </div>),
          title: ticketName,
          draggable: true,
          href: "/tickets/" + ticket.uuid,
        };
      })),
      style: {
        backgroundColor: "#30A0F9",
        color: "white"
      }
    }, ...(await Promise.all(tags.map(async (tag) => {
      const tagTickets = tickets.filter(ticket => {
        const tagIds = ticket.tags.map(t => t.id);
        return tagIds.includes(tag.id) && ticketMatchesSearchQuery(ticket);
      });

      return {
        id: tag.id.toString(),
        title: enableTicketValueAndSku === "enable"
            ? tag.name + " " + tagTickets.length.toString() + " (R$ " +
            tagTickets.reduce((acc, ticket) => acc + (Number(ticket.value) || 0), 0).toFixed(2).replace('.', ',') + ")"
            : tag.name + " " + tagTickets.length.toString(),
        cards: await Promise.all(tagTickets.map(async (ticket) => {
          let ticketName = ticket.name;
          if (!ticketName) {
            try {
              const response = await api.get(`/tickets/${ticket.id}`);
              ticketName = response.data.name || 'Sem título';
            } catch (error) {
              console.error("Erro ao buscar o nome do ticket:", error);
              ticketName = 'Sem título';
            }
          }

          return {
            id: ticket.id.toString(),
            label: "Ticket nº " + ticket.id.toString(),
            description: (
                <div>
                  <p>
                    <strong>{ticket.contact.name || ticket.contact.number}</strong>
                    <br/>
                    {ticket.contact.number !== ticket.contact.name && ticket.contact.number}
                    <br/>
                    {ticket.lastMessage}
                    <br/>
                    {enableTicketValueAndSku === "enable" && (
                        <>
                          <b>SKU: {ticket.sku || 'N/D'}</b> -
                          <b>VALOR: R${(Number(ticket.value) || 0).toFixed(2).replace('.', ',')}</b>
                        </>
                    )}
                  </p>
                  <IconButton
                      edge="start"
                      onClick={() => {
                        handleCardClick(ticket.uuid)
                      }}
                      size="large">
                    <WhatsAppIcon style={{color: "#10a110"}}/>
                  </IconButton>
                </div>),
            title: ticketName,
            draggable: true,
            href: "/tickets/" + ticket.uuid,
          };
        })),
        style: {
          backgroundColor: tag.color,
          color: "white"
        }
      };
    })))];

    setFile({lanes});
  };

  const handleCardClick = (uuid) => {
    console.log("Clicked on card with UUID:", uuid);
    history.push('/tickets/' + uuid);
  };

  const onFiltered = (value) => {
    const users = value.map((t) => t.id);
    setSelectedUsers(users);
  };

  useEffect(() => {
    popularCards(jsonString);
  }, [tags, tickets, searchQuery]);


  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {
      if (sourceLaneId === targetLaneId) {
        return;
      }
      const movedTicket = tickets.find(
        (ticket) => ticket.id.toString() === targetLaneId
      );

      console.log(
        `Lane de entrada ${sourceLaneId}, Lane de saída ${targetLaneId}`
      );

      if (sourceLaneId === targetLaneId) {
        console.log(`Mesma lane de entrada e saída: ${sourceLaneId}`);
      }

      const response = await api.get("/schedules", {
        params: {contactId: movedTicket.contact.id},
      });

      const schedules = response.data.schedules;

      if (schedules.length === 0) {
        try {
          const tagResponse = await api.get(`/tags/${sourceLaneId}`);
          if (tagResponse.data.actCamp === 1) {
            await handleEmptySchedules(sourceLaneId, movedTicket);
          }

        } catch (error) {
          console.error("Erro ao buscar tag:", error);
          await handleEmptySchedules(sourceLaneId, movedTicket);
        }

      } else {
        try {
          const tagResponse = await api.get(`/tags/${sourceLaneId}`);
          if (tagResponse.data.actCamp === 1) {
            await handleNonEmptySchedules(sourceLaneId, schedules, movedTicket);
          }

        } catch (error) {
          console.error("Erro ao buscar tag:", error);
          await handleNonEmptySchedules(sourceLaneId, schedules, movedTicket);
        }

      }

      await api.delete(`/ticket-tags/${targetLaneId}`);
      await api.put(`/ticket-tags/${targetLaneId}/${sourceLaneId}`);

      // Busque os tickets atualizados apenas quando necessário
    } catch (err) {
      console.log(err);
    }
    await fetchTickets(jsonString);
    await popularCards(jsonString);
  };

  const handleEmptySchedules = async (sourceLaneId, movedTicket) => {
    if (String(sourceLaneId) !== 0) {
      toast.success(
        `Campanha nº ${sourceLaneId} iniciada para ${movedTicket.contact.name}. Horario de envio as 18h`,
        {
          autoClose: 10000,
        }
      );
      await campanhaInit(movedTicket, sourceLaneId);
    } else {
      toast.success(`Campanhas zeradas para ${movedTicket.contact.name}.`, {
        autoClose: 10000,
      });
    }
  };

  const handleNonEmptySchedules = async (sourceLaneId, schedules, movedTicket) => {
    const campIdInSchedules = schedules[0].campId;

    if (String(sourceLaneId) === String(campIdInSchedules)) {
      toast.success(
        `Campanha nº ${sourceLaneId} já está em andamento para ${movedTicket.contact.name}.`,
        {
          autoClose: 10000,
        }
      );
    } else {
      const scheduleIdToDelete = schedules[0].id;

      if (String(sourceLaneId) !== 0) {
        await handleDeleteScheduleAndInit(
          sourceLaneId,
          scheduleIdToDelete,
          campIdInSchedules,
          movedTicket
        );
      } else {
        await handleDeleteSchedule(sourceLaneId, scheduleIdToDelete, movedTicket);
      }
    }
  };

  const handleDeleteScheduleAndInit = async (
    sourceLaneId,
    scheduleIdToDelete,
    campIdInSchedules,
    movedTicket
  ) => {
    try {
      await api.delete(`/schedules/${scheduleIdToDelete}`);
      toast.error(
        `Campanha nº ${campIdInSchedules} excluída para ${movedTicket.contact.name}.`,
        {
          autoClose: 10000,
        }
      );
      await campanhaInit(movedTicket, sourceLaneId);
      toast.success(
        `Campanha nº ${sourceLaneId} iniciada para ${movedTicket.contact.name}. Horario de envio as 18h`,
        {
          autoClose: 10000,
        }
      );
    } catch (deleteError) {
      console.error("Erro ao excluir campanha:", deleteError);
      // Lógica adicional em caso de erro ao excluir
    }
  };

  const handleDeleteSchedule = async (
    sourceLaneId,
    scheduleIdToDelete,
    movedTicket
  ) => {
    try {
      await api.delete(`/schedules/${scheduleIdToDelete}`);
      toast.success(`Campanhas zeradas para ${movedTicket.contact.name}.`, {
        autoClose: 10000,
      });
    } catch (deleteError) {
      console.error("Erro ao excluir campanha:", deleteError);
      // Lógica adicional em caso de erro ao excluir
    }
  };

  const campanhaInit = async (ticket, campId) => {
    try {
      const tagResponse = await api.get(`/tags/${campId}`);
      const tagMsg = tagResponse.data.msgR;
      const rptDays = tagResponse.data.rptDays;
      const pathFile = tagResponse.data.mediaPath;
      const nameMedia = tagResponse.data.mediaName;
      console.log(tagMsg);

      const getRandomNumber = (min, max) => {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      };
      // Função para obter a data de hoje às 18:00
      const getToday18h = () => {
        const today18h = new Date();
        today18h.setHours(18, 0, 0, 0);
        return today18h;
      };

      // Função para obter a data de amanhã às 18:00
      const getNextDay18h = () => {
        const nextDay18h = new Date();
        nextDay18h.setDate(nextDay18h.getDate() + 1);
        nextDay18h.setHours(18, 0, 0, 0);
        return nextDay18h;
      };

      // Obter a data de hoje às 18:00 e a data de amanhã às 18:00
      const today18h = getToday18h();
      const nextDay18h = getNextDay18h();

      // Gerar segundos aleatórios entre 1 e 60
      const randomSeconds = getRandomNumber(1, 60);

      // Gerar minutos aleatórios entre 1 e 30
      const randomMinutes = getRandomNumber(1, 30);

      // Construir a data com a hora fixa de 18:00 e os segundos e minutos aleatórios
      const currentDate = new Date();
      currentDate.setSeconds(randomSeconds);
      currentDate.setMinutes(randomMinutes);
      currentDate.setHours(18, 0, 0, 0);


      const getToday18hRandom = () => {
        const today18h = new Date();
        today18h.setHours(18);
        today18h.setMinutes(getRandomNumber(1, 30)); // Adiciona minutos aleatórios
        today18h.setSeconds(getRandomNumber(1, 60)); // Adiciona segundos aleatórios
        return today18h;
      };

      // Obter a data de hoje às 18:00 com minutos e segundos aleatórios
      const campDay = getToday18hRandom();

      const currentTime = new Date();
      if (currentTime.getHours() >= 18) {
        // Se já passou das 18:00, definir o horário para amanhã
        campDay.setDate(campDay.getDate() + 1);
      }

      const scheduleData = {
        body: tagMsg,
        sendAt: campDay,
        contactId: ticket.contact.id,
        userId: user.id,
        daysR: rptDays,
        campId: campId,
        mediaPath: pathFile,
        mediaName: nameMedia
      };

      try {
        const response = await api.post("/schedules", scheduleData);

        if (response.status === 200) {
          console.log("Agendamento criado com sucesso:", response.data);
        } else {
          console.error("Erro ao criar agendamento:", response.data);
        }
      } catch (error) {
        console.error("Erro ao criar agendamento:", error);
      }
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
    }
  };

  const ticketMatchesSearchQuery = (ticket) => {
    if (searchQuery.trim() === "") {

      if (selectedUsers.length > 0) {
        return !ticket.user?.id || selectedUsers.includes(ticket.user.id);
      }

      return true;
    }

    const query = searchQuery.toLowerCase();
    var match = (ticket.contact.number.toLowerCase().includes(query) || (ticket.lastMessage && ticket.lastMessage.toLowerCase().includes(query)) || ticket.contact?.name?.toLowerCase().includes(query) || ticket.value?.includes(query) || ticket.sku?.includes(query));

    if (selectedUsers.length > 0) {
      return match && selectedUsers.includes(ticket.userId);
    }

    return match;
  };

  const handleSelectedDate = (value, range) => {
    setSelectedDate({...selectedDate, [range]: value});
  };

  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };


  return (
    <div className={'flex flex-column'}>
      <Paper className={'align-center w-full p-1 flex m-2'}>
        <Grid container spacing={1} className={'p-3 items-center'}>
          <Grid item xs={12} md={3} xl={3}>

            <FormControl
              variant="outlined"
              fullWidth
            >

              <TextField
                placeholder="Pesquisar..."
                size={'small'}
                classes={{
                  root: classes.inputRoot, input: classes.inputInput,
                }}
                inputProps={{"aria-label": "search"}}
                value={searchQuery}
                onChange={handleSearchQueryChange}
              />
            </FormControl>
          </Grid>


          {(profile === 'admin' || profile === 'supervisor') && (
            <Grid item xs={12} md={3} xl={3}>

              <FormControl
                variant="outlined"
                fullWidth
              >
                <UsersFilter onFiltered={onFiltered}/>
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} md={3} xl={3}>

            <FormControl
              variant="outlined"
              fullWidth
            >
              <div style={{display: 'flex', gap: 10}}>
                <DatePickerMoment
                  label={'De'}
                  getDate={(value) => handleSelectedDate(value, 'from')}
                />
                <DatePickerMoment
                  label={'Até'}
                  getDate={(value) => handleSelectedDate(value, 'until')}
                />
              </div>
            </FormControl>

          </Grid>
          <Grid item xs={12} md={3} xl={3}>
            <div>
              <IconButton
                color="primary"
                className={classes.button}
                onClick={handleOpenBoardSettings}
                size="large">
                <SettingsIcon/>
              </IconButton>
              <InstructionsModal/>
            </div>
          </Grid>
        </Grid>
      </Paper>
      {/* IconButton com o ícone de engrenagem */}


      {/* Modal de configurações do quadro */}
      {settingsModalOpen && (<BoardSettingsModal
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />)}

      <Board
        data={file}
        onCardMoveAcrossLanes={handleCardMove}
        style={{
          backgroundColor: "rgba(252, 252, 252, 0.03)", width: "100%", height: "700px",
        }}
      />
    </div>
  );
};


export default Kanban;
