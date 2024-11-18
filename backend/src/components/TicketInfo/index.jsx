import React, { useState, useEffect } from "react";
import { Avatar, CardHeader, IconButton, Tooltip, TextField } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import { getInitials } from "../../helpers/getInitials";
import { generateColor } from "../../helpers/colorGenerator";
import makeStyles from '@mui/styles/makeStyles';
import useSettings from "../../hooks/useSettings";

const useStyles = makeStyles(theme => ({
    ticketInfo: {
        cursor: "pointer",
        [theme.breakpoints.down('lg')]: {
            paddingRight: 0,
            paddingLeft: 4,
            paddingBottom: 6,
            paddingTop: 6,
        },
        display: 'flex',
        alignItems: 'center',
    },
    editIcon: {
        marginLeft: theme.spacing(0.5),
        cursor: "pointer",
        fontSize: '1rem',
    },
    inputField: {
        fontSize: '1rem',
        padding: '2px 4px',
    }
}));

const TicketInfo = ({ contact, ticket, onClick, onEditClick }) => {
    const { user } = ticket;
    const [userName, setUserName] = useState('');
    const [contactName, setContactName] = useState('');
    const [editing, setEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [enableTicketValueAndSku, setEnableTicketValueAndSku] = useState(false);
    const { getCachedSetting } = useSettings();

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                const response = await api.get(`/tickets/${ticket.id}`);
                const ticketName = response.data.name || contact.name;
                setContactName(ticketName);
                setEditedName(ticketName);
            } catch (error) {
                console.error("Erro ao buscar o ticket:", error);
                setContactName(contact.name);
                setEditedName(contact.name);
            }
        };

        fetchTicket();

        if (user && contact) {
            setUserName(`${i18n.t("messagesList.header.assignedTo")} ${user.name}`);

            if (document.body.offsetWidth < 600) {
                setUserName(`${user.name}`);
            }
        }
    }, [ticket.id, contact.name, user]);

    useEffect(async () => {
        const enableTicketValueAndSku = await getCachedSetting("enableTicketValueAndSku");
        if (enableTicketValueAndSku) {
            setEnableTicketValueAndSku(enableTicketValueAndSku?.value || "disabled");
        }
    }, []);

    const classes = useStyles();

    const handleEditClick = () => {
        setEditing(true);
    };

    const handleInputChange = (event) => {
        setEditedName(event.target.value);
    };

    const handleBlur = async () => {
        setEditing(false);

        setContactName(editedName);

        try {
            await api.put(`/tickets/${ticket.id}/name`, { name: editedName });
            console.log("Nome editado e salvo:", editedName);
        } catch (error) {
            console.error("Erro ao salvar o nome:", error);

            setContactName(contact.name);
            setEditedName(contact.name);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleBlur();
        }
    };

    return (
        <CardHeader
            onClick={onClick}
            style={{ cursor: "pointer" }}
            titleTypographyProps={{ noWrap: true }}
            className={classes.ticketInfo}
            subheaderTypographyProps={{ noWrap: true, style: { marginTop: '-2px', marginBottom: '-4px' } }}
            avatar={
                <Avatar
                    imgProps={{ loading: "lazy" }}
                    style={{ backgroundColor: generateColor(contact?.number), color: "white", fontWeight: "bold" }}
                    src={contact.profilePicUrl}
                    alt="contact_image"
                >
                    {getInitials(contact?.name)}
                </Avatar>
            }
            title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {editing ? (
                        <TextField
                            value={editedName}
                            onChange={handleInputChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className={classes.inputField}
                            inputProps={{ className: classes.inputField }}
                        />
                    ) : (
                        <>
                            {`${contactName} #${ticket.id}`}
                            <Tooltip title="Editar título do ticket">
                                <IconButton
                                    className={classes.editIcon}
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        handleEditClick();
                                    }}
                                    size="large">
                                    <EditIcon style={{ fontSize: '1rem' }} />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                </div>
            }
            subheader={
                ticket.user && (
                    <>
                        {userName} | {ticket.queue ? `Setor: ${ticket.queue.name}` : 'Setor: Nenhum'}
                        <br />
                        {enableTicketValueAndSku === "enable" && !ticket.isGroup && (
                            <>
                                <b>Valor:</b> {ticket.value ? `R$${Number(ticket.value).toFixed(2).replace('.', ',')}` : 'R$0,00'}
                                {ticket.sku && (
                                    <>
                                        {' - '}
                                        <b>SKU:</b> {ticket.sku}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )
            }
        />
    );
};

export default TicketInfo;
