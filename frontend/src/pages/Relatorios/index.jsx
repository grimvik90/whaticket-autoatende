import React, {Fragment, useState, useEffect, useContext} from "react";

import {useHistory} from "react-router-dom";

import {Button, Paper, TableRow, TableHead, TableCell, TableBody, Table, Badge, Box} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import * as XLSX from 'xlsx';

import api from "../../services/api";
import TableRowSkeleton from "../../components/TableRowSkeleton";


import {i18n} from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import MainContainer from "../../components/MainContainer";
import toastError from "../../errors/toastError";

import {
    CircularProgress,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Pagination,
    Select,
    TextField,
    Tooltip,
    Typography
} from "@mui/material";
import {UsersFilter} from "../../components/UsersFilter";
import {TagsFilter} from "../../components/TagsFilter";
import {WhatsappsFilter} from "../../components/WhatsappsFilter";
import {StatusFilter} from "../../components/StatusFilter";
import useDashboard from "../../hooks/useDashboard";

import QueueSelectCustom from "../../components/QueueSelectCustom";
import moment from "moment";

import {blue, green} from "@mui/material/colors";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {ChevronLeft, Facebook, Forward, History, Instagram, SaveAlt, Visibility, WhatsApp} from "@mui/icons-material";
import Autocomplete, {createFilterOptions} from '@mui/material/Autocomplete';
import ContactModal from "../../components/ContactModal";
import {red} from "@mui/material/colors";
import {AuthContext} from "../../context/Auth/AuthContext";
import {isArray, capitalize} from "lodash";
import Container from "@mui/material/Container";
import QueueSelect from "../../components/QueueSelect";

const useStyles = makeStyles((theme) => ({
    mainContainer: {
        background: theme.palette.fancyBackground,

    },
    formControl: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainPaper: {
        flex: 1,
        border: '0px !important',
        marginBottom: 20,
        overflow: 'hidden'
    },
    mainPaperTable: {
        flex: 1,
        overflow: 'auto',
        height: '68vh',
        ...theme.scrollbarStylesSoftBig,
    },
    mainPaperFilter: {
        flex: 1,
        overflow: 'auto',
        height: '30vh',
        ...theme.scrollbarStylesSoftBig,
    },
    mainHeaderBlock: {
        [theme.breakpoints.down('xl')]: {
            display: 'flex',
            flexWrap: 'wrap'
        },
    },
    filterItem: {
        width: 200,
        [theme.breakpoints.down('xl')]: {
            width: '45%'
        },
    },
    connectionTag: {
        background: 'green',
        color: '#FFF',
        marginRight: 1,
        padding: 5,
        fontWeight: 'bold',
        paddingLeft: 5,
        paddingRight: 5,
        borderRadius: 3,
        fontSize: '0.8em',
        whiteSpace: 'nowrap',
    },
}));

const Relatorios = () => {
    const classes = useStyles();
    const history = useHistory();

    const initialContact = {
        id: "",
        name: ""
    }

    const [currentContact, setCurrentContact] = useState(initialContact);

    const {getReport} = useDashboard();
    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10); // Defina o tamanho da página
    const [selectedWhatsapp, setSelectedWhatsapp] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState([]);
    const {user} = useContext(AuthContext)

    // const [tagIds, setTagIds] = useState([]);
    const [queueIds, setQueueIds] = useState([]);
    const [ticketId, setTicketId] = useState('')
    const [userIds, setUserIds] = useState([]);
    const [dateFrom, setDateFrom] = useState(moment("1", "D").format("YYYY-MM-DD"));
    const [dateTo, setDateTo] = useState(moment().format("YYYY-MM-DD"));
    const [totalTickets, setTotalTickets] = useState(0);
    const [tickets, setTickets] = useState([]);
    const [contacts, setContacts] = useState([initialContact]);
    const [searchParam, setSearchParam] = useState("");
    const [hasMore, setHasMore] = useState(false)
    const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
    const [ticketOpen, setTicketOpen] = useState(null);


    const StatusCell = ({ticket}) => {
        const green = 'green';
        const red = '#f44336';
        const gray = '#9e9e9e';

        let backgroundColor;

        let status = "";
        switch (ticket?.ticket?.status) {
            case 'open':
                status = "ABERTO";
                backgroundColor = green;
                break;
            case 'group':
                status = "GRUPO";
                backgroundColor = green;
                break;
            case 'closed':
                status = "FECHADO";
                backgroundColor = red;
                break;
            case 'pending':
                status = "PENDENTE";
                backgroundColor = gray;
                break;
            default:
                backgroundColor = 'transparent';
        }

        return (
            <TableCell align="center">
                <span className={classes.connectionTag} style={{backgroundColor}}>{status}</span>
            </TableCell>
        );
    }

    const QueueCell = ({ticket}) => {
        const green = 'green';
        const red = '#f44336';
        const gray = '#9e9e9e';

        let backgroundColor;

        if (ticket.queueColor === null) {
            backgroundColor = gray
        } else {
            backgroundColor = ticket.queueColor
        }

        return (
            <TableCell align="center">
                <span className={classes.connectionTag}
                      style={{backgroundColor}}>{!ticket?.ticket?.queue?.name ? 'SEM FILA' : ticket?.ticket?.queue?.name}</span>
            </TableCell>
        );
    }

    const [reasonId, setReasonId] = useState("");
    const [reasons, setReasons] = useState([]);

    useEffect(() => {
        const fetchReasons = async () => {
            try {
                const {data} = await api.get("/reasons");
                setReasons(data);
            } catch (error) {
                toastError(error);
            }
        };
        fetchReasons();
    }, []);


    useEffect(() => {
        const {companyId} = user;
        try {
            (async () => {
                const {data: contactList} = await api.get('/contacts/list', {params: {companyId: companyId}});
                let customList = contactList.map((c) => ({id: c.id, name: c.name, number: c.number}));
                if (isArray(customList)) {
                    setContacts([{id: "", name: "", number: ""}, ...customList]);
                }
            })()
        } catch (err) {
            toastError(err);
        }

    }, [user]);


    useEffect(() => {
        if (user?.profile === 'user') {
            console.log('entrei4')
            setUserIds([user.id])
        }
    }, [user])


    // const handleSelectedTags = (selecteds) => {
    //   const tags = selecteds.map((t) => t.id);
    //   setTagIds(tags);
    // };

    const exportarGridParaExcel = async () => {
        setLoading(true); // Define o estado de loading como true durante o carregamento

        try {
            const data = await getReport({
                searchParam,
                currentContact,
                whatsappId: JSON.stringify(selectedWhatsapp),
                // tags: JSON.stringify(tagIds),
                users: JSON.stringify(userIds),
                queueIds: JSON.stringify(queueIds),
                status: JSON.stringify(selectedStatus),
                // tags: tagIds,
                dateFrom,
                dateTo,
                reasonId,
                page: 1, // Passa o número da página para a API
                pageSize: 9999999, // Passa o tamanho da página para a API
            });

            const ws = XLSX.utils.json_to_sheet(data.tickets);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'RelatorioDeAtendimentos');
            XLSX.writeFile(wb, 'relatorio-de-atendimentos.xlsx');


            setPageNumber(pageNumber); // Atualiza o estado da página atual
        } catch (error) {
            toastError(error);
        } finally {
            setLoading(false); // Define o estado de loading como false após o carregamento
        }

    };


    const handleFilter = async (pageNumber) => {
        setLoading(true); // Define o estado de loading como true durante o carregamento

        if (user.profile === 'user') {
            console.log('entrei3')
            setUserIds([user.id])
        }

        console.log(userIds)

        try {
            const data = await getReport({
                searchParam,
                ticketId,
                contactId: currentContact?.id,
                whatsappId: JSON.stringify(selectedWhatsapp),
                // tags: JSON.stringify(tagIds),
                users: JSON.stringify(userIds),
                queueIds: JSON.stringify(queueIds),
                status: JSON.stringify(selectedStatus),
                // tags: tagIds,
                dateFrom,
                dateTo,
                reasonId,
                page: pageNumber, // Passa o número da página para a API
                pageSize: pageSize, // Passa o tamanho da página para a API
            });

            if (!data?.totalTickets?.total) {
                setTotalTickets(0);
            } else {
                setTotalTickets(+data.totalTickets.total);
            }
            // Verifica se há mais resultados para definir hasMore
            setHasMore(data.tickets.length === pageSize);

            setTickets(data.tickets); // Se for a primeira página, substitua os tickets


            setPageNumber(pageNumber); // Atualiza o estado da página atual
        } catch (error) {
            toastError(error);
        } finally {
            setLoading(false); // Define o estado de loading como false após o carregamento
        }
    }

    const handleSelectedUsers = (selecteds) => {

        const users = selecteds.map((t) => t.id);
        const userVerify = selecteds.every((t) => t.id === user.id);
        console.log(userVerify);


        try {
            if (user.profile === 'admin' || user.profile === 'supervisor') {
                console.log('entrei')
                const users = selecteds.map((t) => t.id);
                setUserIds(users);

            } else if (!userVerify) {
                toastError('Você não tem permissão para filtrar tickets de outros usuários')
                setUserIds([]);
            } else if (userVerify && user.profile === 'user') {
                console.log('entrei2')
                setUserIds([user.id])
            }

        } catch (error) {

        }

    };

    const handleSelectedWhatsapps = (selecteds) => {
        const whatsapp = selecteds.map((t) => t.id);
        setSelectedWhatsapp(whatsapp);
    };

    const handleSelectedStatus = (selecteds) => {
        setSelectedStatus(selecteds);
    };

    const IconChannel = (channel) => {
        return <WhatsApp style={{color: "#25d366", verticalAlign: "middle"}}/>
    };


    const handleBack = () => {
        history.goBack();
    };

    return (
        <Container className={classes.mainContainer}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    width: '50px',
                }}
            >
                <div className={classes.toolbarIcon}>
                    <IconButton onClick={handleBack} size="large">
                        <ChevronLeft/>
                        <span style={{fontSize: '1rem'}}>Voltar</span>
                    </IconButton>
                </div>
            </Box>
            <Title>{i18n.t("reports.title")}</Title>

            <MainHeader className={classes.mainHeaderFilter} style={{display: 'flex'}}>

            </MainHeader>
            <Paper className={classes.mainPaper} variant="outlined">
                <Grid container spacing={1} className={'p-3'}>
                    <Grid item xs={12} md={3} xl={3}>
                        <FormControl
                            variant="outlined"
                            fullWidth
                        >
                            <Autocomplete
                                fullWidth
                                size="small"
                                value={currentContact}
                                options={contacts}
                                onChange={(e, contact) => {
                                    const contactId = contact ? contact.id : '';
                                    setCurrentContact(contact ? contact : initialContact);
                                }}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) => {
                                    return value.id === option.id
                                }}
                                renderInput={(params) => <TextField {...params} variant="outlined"
                                                                    placeholder="Contato"/>}
                            />
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3} xl={3}>
                        <FormControl
                            variant="outlined"
                            fullWidth
                        >
                            <WhatsappsFilter onFiltered={handleSelectedWhatsapps}/>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3} xl={3}>
                        <StatusFilter onFiltered={handleSelectedStatus}/>
                    </Grid>
                    <Grid item xs={12} md={3} xl={3}>
                        <UsersFilter onFiltered={handleSelectedUsers}/>
                    </Grid>
                    {/* <Grid item xs={12} md={4} xl={4}>
              <TagsFilter onFiltered={handleSelectedTags} />
            </Grid> */}
                    <Grid item xs={12} md={3} xl={3}>
                        <QueueSelect
                            selectedQueueIds={queueIds}
                            onChange={values => setQueueIds(values)}
                        />
                    </Grid>

                    <Grid item xs={12} sm={3} md={3}>
                        <TextField
                            label="Ticket ID"
                            type="text"
                            value={ticketId}
                            variant="outlined"
                            fullWidth
                            size="small"
                            onChange={(e) => {
                                setTicketId(e.target.value)
                            }}
                        />
                    </Grid>
                    {process.env.REACT_APP_REQUIRE_JUSTIFICATION_TO_CLOSE === 'true' && (
                        <Grid item xs={12} md={3} xl={3}>
                            <FormControl variant="outlined" fullWidth size="small">
                                <InputLabel>Motivo de Encerramento</InputLabel>
                                <Select
                                    value={reasonId}
                                    onChange={(e) => setReasonId(e.target.value)}
                                    label="Motivo de Encerramento"
                                >
                                    <MenuItem value="">
                                        <em>Todos</em>
                                    </MenuItem>
                                    {reasons.map((reason) => (
                                        <MenuItem key={reason.id} value={reason.id}>
                                            {reason.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    )}
                    <Grid item xs={12} sm={3} md={3}>
                        <TextField
                            label="Data Inicial"
                            type="date"
                            value={dateFrom}
                            variant="outlined"
                            fullWidth
                            size="small"
                            onChange={(e) => setDateFrom(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={3} md={3}>
                        <TextField
                            label="Data Final"
                            type="date"
                            value={dateTo}
                            variant="outlined"
                            fullWidth
                            size="small"
                            onChange={(e) => setDateTo(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} style={{display: 'flex-end', justifyContent: 'center', textAlign: 'right'}}>
                        <IconButton
                            onClick={exportarGridParaExcel}
                            aria-label="Exportar para Excel"
                            size="large">
                            <SaveAlt/>
                        </IconButton>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleFilter(pageNumber)}
                            size="small"
                        >{i18n.t("reports.buttons.filter")}</Button>
                    </Grid>
                </Grid>


            </Paper>

            <Paper
                className={classes.mainPaperTable}
                variant="outlined"
            >
                <Table size="small" id="grid-attendants">
                    <TableHead>
                        <TableRow>
                            {/* <TableCell padding="checkbox" /> */}
                            <TableCell align="center">{i18n.t("reports.table.id")}</TableCell>
                            <TableCell align="left">{i18n.t("reports.table.whatsapp")}</TableCell>
                            <TableCell align="left">{i18n.t("reports.table.contact")}</TableCell>
                            <TableCell align="left">{i18n.t("reports.table.user")}</TableCell>
                            <TableCell align="left">{i18n.t("reports.table.queue")}</TableCell>
                            <TableCell align="center">{i18n.t("reports.table.status")}</TableCell>
                            {/* <TableCell align="left">{i18n.t("reports.table.lastMessage")}</TableCell> */}
                            <TableCell align="center">{i18n.t("reports.table.dateOpen")}</TableCell>
                            <TableCell align="center">{i18n.t("reports.table.dateClose")}</TableCell>
                            <TableCell align="center">{i18n.t("reports.table.actions")}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <>
                            {tickets.map((tracking) => (
                                <TableRow key={tracking.id}>
                                    <TableCell align="center">{tracking.id}</TableCell>
                                    <TableCell align="left">{tracking?.whatsapp?.name}</TableCell>
                                    <TableCell align="left">{tracking?.ticket?.contact?.name}</TableCell>
                                    <TableCell align="left">{tracking?.user?.name}</TableCell>
                                    <QueueCell ticket={tracking}/>
                                    <StatusCell ticket={tracking}/>
                                    {/* <TableCell align="left">{ticket?.lastMessage}</TableCell> */}
                                    <TableCell
                                        align="center">{new Date(tracking?.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell
                                        align="center">{(tracking?.finishedAt == null && tracking?.updatedAt == null) ?
                                        'Não encerrado' :
                                        new Date(tracking?.finishedAt ?? tracking?.updatedAt).toLocaleDateString()}</TableCell>
                                    <TableCell align="center">
                                        <Typography
                                            noWrap
                                            component="span"
                                            variant="body2"
                                            color="textPrimary"
                                        >
                                            <Tooltip title="Logs do Ticket">
                                                <History
                                                    onClick={() => {
                                                        setOpenTicketMessageDialog(true)
                                                        setTicketOpen(tracking)
                                                    }}
                                                    fontSize="small"
                                                    style={{
                                                        color: blue[700],
                                                        cursor: "pointer",
                                                        marginLeft: 10,
                                                        verticalAlign: "middle"
                                                    }}
                                                />
                                            </Tooltip>

                                            <Tooltip title="Acessar Ticket">
                                                <VisibilityIcon
                                                    onClick={() => {
                                                        history.push(`/tickets/${tracking.uuid}`)
                                                    }}
                                                    fontSize="small"
                                                    color='primary'
                                                    style={{
                                                        cursor: "pointer",
                                                        marginLeft: 10,
                                                        verticalAlign: "middle"
                                                    }}
                                                />
                                            </Tooltip>
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {loading && <TableRowSkeleton avatar columns={3}/>}
                        </>
                    </TableBody>
                </Table>

            </Paper>

            <div>
                <Grid container>
                    <Grid item xs={12} sm={10} md={10}>

                        <Pagination
                            count={Math.ceil(+totalTickets / pageSize)} // Calcula o nmero total de páginas com base no nmero total de tickets e no tamanho da página
                            page={pageNumber} // Define a página atual
                            onChange={(event, value) => handleFilter(value)} // Função de callback para mudanças de página
                        />
                    </Grid>
                    <Grid item xs={12} sm={2} md={2}>

                        <FormControl
                            margin="dense"
                            variant="outlined"
                            fullWidth
                        >
                            <InputLabel>
                                {i18n.t("tickets.search.ticketsPerPage")}
                            </InputLabel>
                            <Select
                                labelId="dialog-select-prompt-label"
                                id="dialog-select-prompt"
                                name="pageSize"
                                size={'small'}
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(e.target.value)
                                }}
                                label={i18n.t("tickets.search.ticketsPerPage")}
                                fullWidth
                                MenuProps={{
                                    anchorOrigin: {
                                        vertical: "center",
                                        horizontal: "left",
                                    },
                                    transformOrigin: {
                                        vertical: "center",
                                        horizontal: "left",
                                    },
                                    getContentAnchorEl: null,
                                }}
                            >
                                <MenuItem value={5}>{"5"}</MenuItem>
                                <MenuItem value={10}>{"10"}</MenuItem>
                                <MenuItem value={20}>{"20"}</MenuItem>
                                <MenuItem value={50}>{"50"}</MenuItem>
                                <MenuItem value={100}>{"100"}</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            </div>
        </Container>
    );
};

export default Relatorios;
