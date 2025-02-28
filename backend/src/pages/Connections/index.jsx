import React, {useState, useCallback, useContext, useEffect} from "react";
import {toast} from "react-toastify";
import {format, parseISO} from "date-fns";

import makeStyles from '@mui/styles/makeStyles';
import {green} from "@mui/material/colors";
import {
    Button,
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    Table,
    TableHead,
    Paper,
    Tooltip,
    Typography,
    CircularProgress, Box,
} from "@mui/material";
import {
    Edit,
    CheckCircle,
    SignalCellularConnectedNoInternet2Bar,
    SignalCellularConnectedNoInternet0Bar,
    SignalCellular4Bar,
    CropFree,
    DeleteOutline,
    DeleteForever,
  Refresh
} from "@mui/icons-material";

import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import {add} from "date-fns";

import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModalCustom";
import {i18n} from "../../translate/i18n";
import {WhatsAppsContext} from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import formatSerializedId from '../../utils/formatSerializedId';
import {AuthContext} from "../../context/Auth/AuthContext";
import {Can} from "../../components/Can";
import {SocketContext} from "../../context/Socket/SocketContext";
import CardContent from "@mui/material/CardContent";
import Card from "@mui/material/Card";
import useSettings from "../../hooks/useSettings";

const useStyles = makeStyles(theme => ({
    mainPaper: {
        flex: 1,
        padding: theme.spacing(1),
        overflowY: "scroll",
        ...theme.scrollbarStyles,
    },
    customTableCell: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    },
    tooltip: {
        backgroundColor: "#f5f5f9",
        color: "rgba(0, 0, 0, 0.87)",
        fontSize: theme.typography.pxToRem(14),
        border: "1px solid #dadde9",
        maxWidth: 450,
    },
    tooltipPopper: {
        textAlign: "center",
    },
    buttonProgress: {
        color: green[500],
    },
}));

function CircularProgressWithLabel(props) {
    return (
        <Box position="relative" display="inline-flex">
            <CircularProgress variant="determinate" {...props} />
            <Box
                top={0}
                left={0}
                bottom={0}
                right={0}
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
            >
                <Typography
                    variant="caption"
                    component="div"
                    color="textSecondary"
                >{`${Math.round(props.value)}%`}</Typography>
            </Box>
        </Box>
    );
}

const CustomToolTip = ({title, content, children}) => {
    const classes = useStyles();

    return (
        <Tooltip
            arrow
            classes={{
                tooltip: classes.tooltip,
                popper: classes.tooltipPopper,
            }}
            title={
                <React.Fragment>
                    <Typography gutterBottom color="inherit">
                        {title}
                    </Typography>
                    {content && <Typography>{content}</Typography>}
                </React.Fragment>
            }
        >
            {children}
        </Tooltip>
    );
};

const openInNewTab = url => {
    window.open(url, '_blank', 'noopener,noreferrer');
};

const Connections = () => {
    const classes = useStyles();

    const {user} = useContext(AuthContext);
    const {whatsApps, loading} = useContext(WhatsAppsContext);
    const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
    const [qrModalOpen, setQrModalOpen] = useState(false);
    const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [statusImport, setStatusImport] = useState([]);
    const {settings} = useSettings();
    const [callSuport, setCallSuport] = useState("enabled");
    const [waSuport, setWaSuport] = useState(null);
    const [msgSuport, setMsgSuport] = useState(null);


    useEffect(() => {
        api.get(`/settings`).then(({data}) => {
            if (Array.isArray(data)) {
                const callSuport = data.find((d) => d.key === "callSuport");
                if (callSuport) {
                    setCallSuport(callSuport.value);
                }

                const waSuportSetting = data.find((d) => d.key === "wasuport");
                if (waSuportSetting) {
                    setWaSuport(waSuportSetting.value);
                }

                const msgSuportSetting = data.find((d) => d.key === "msgsuport");
                if (msgSuportSetting) {
                    setMsgSuport(msgSuportSetting.value);
                }
            }
        });
    }, []);

    const companyId = user.companyId;
    const confirmationModalInitialState = {
        action: "",
        title: "",
        message: "",
        whatsAppId: "",
        open: false,
    };
    const [confirmModalInfo, setConfirmModalInfo] = useState(
        confirmationModalInitialState
    );
    const socketManager = useContext(SocketContext);

    useEffect(() => {

        const socket = socketManager.GetSocket(companyId);

        socket.on(`importMessages-${user.companyId}`, (data) => {
            if (data.action === "refresh") {
                setStatusImport([]);
                history.go(0);
            }
            if (data.action === "update") {
                setStatusImport(data.status);
                console.log("Importação concluida com exito", data);
            }
        });

        return () => {
            socket.off(`importMessages-${user.companyId}`);
        };
    }, [whatsApps]);

    const handleStartWhatsAppSession = async whatsAppId => {
        try {
            await api.post(`/whatsappsession/${whatsAppId}`);
        } catch (err) {
            toastError(err);
        }
    };

    const handleRequestNewQrCode = async whatsAppId => {
        try {
            await api.put(`/whatsappsession/${whatsAppId}`);
        } catch (err) {
            toastError(err);
        }
    };

    const handleOpenWhatsAppModal = () => {
        setSelectedWhatsApp(null);
        setWhatsAppModalOpen(true);
    };

    const handleCloseWhatsAppModal = useCallback(() => {
        setWhatsAppModalOpen(false);
        setSelectedWhatsApp(null);
    }, [setSelectedWhatsApp, setWhatsAppModalOpen]);

    const handleOpenQrModal = whatsApp => {
        setSelectedWhatsApp(whatsApp);
        setQrModalOpen(true);
    };

    const handleCloseQrModal = useCallback(() => {
        setSelectedWhatsApp(null);
        setQrModalOpen(false);
    }, [setQrModalOpen, setSelectedWhatsApp]);

    const handleEditWhatsApp = whatsApp => {
        setSelectedWhatsApp(whatsApp);
        setWhatsAppModalOpen(true);
    };

    const handleOpenConfirmationModal = (action, whatsAppId) => {
        if (action === "disconnect") {
            setConfirmModalInfo({
                action: action,
                title: i18n.t("connections.confirmationModal.disconnectTitle"),
                message: i18n.t("connections.confirmationModal.disconnectMessage"),
                whatsAppId: whatsAppId,
            });
        }

        if (action === "delete") {
            setConfirmModalInfo({
                action: action,
                title: i18n.t("connections.confirmationModal.deleteTitle"),
                message: i18n.t("connections.confirmationModal.deleteMessage"),
                whatsAppId: whatsAppId,
            });
        }

        if (action === "forceDelete") {
            setConfirmModalInfo({
                action: action,
                title: i18n.t("connections.confirmationModal.deleteTitle"),
                message: i18n.t("connections.confirmationModal.deleteMessage"),
                whatsAppId: whatsAppId,
            });
        }

        if (action === "closedImported") {
            setConfirmModalInfo({
                action: action,
                title: i18n.t("connections.confirmationModal.closedImportedTitle"),
                message: i18n.t("connections.confirmationModal.closedImportedMessage"),
                whatsAppId: whatsAppId,
            });
        }
        setConfirmModalOpen(true);
    };

    const handleSubmitConfirmationModal = async () => {
        if (confirmModalInfo.action === "disconnect") {
            try {
                await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`);
            } catch (err) {
                toastError(err);
            }
        }

        if (confirmModalInfo.action === "delete") {
            try {
                await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`);
                toast.success(i18n.t("connections.toasts.deleted"));
            } catch (err) {
                toastError(err);
            }
        }

        if (confirmModalInfo.action === "forceDelete") {
            try {
                await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}?force=true`);
                toast.success(i18n.t("connections.toasts.deleted"));
            } catch (err) {
                toastError(err);
            }
        }

        if (confirmModalInfo.action === "closedImported") {
            try {
                await api.post(`/closedimported/${confirmModalInfo.whatsAppId}`);
                toast.success(i18n.t("connections.toasts.closedimported"));
            } catch (err) {
                toastError(err);
            }
        }

        setConfirmModalInfo(confirmationModalInitialState);
    };
    const renderImportButton = (whatsApp) => {
        if (whatsApp?.statusImportMessages === "renderButtonCloseTickets") {
            return (
                <Button
                    style={{marginLeft: 12}}
                    size="small"
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                        handleOpenConfirmationModal("closedImported", whatsApp.id);
                    }}
                >
                    {i18n.t("connections.buttons.closedImported")}
                </Button>
            );
        }

        if (whatsApp?.importOldMessages) {
            let isTimeStamp = !isNaN(
                new Date(Math.floor(whatsApp?.statusImportMessages)).getTime()
            );

            if (isTimeStamp) {
                const ultimoStatus = new Date(
                    Math.floor(whatsApp?.statusImportMessages)
                ).getTime();
                const dataLimite = +add(ultimoStatus, {seconds: +35}).getTime();
                if (dataLimite > new Date().getTime()) {
                    return (
                        <>
                            <Button
                                disabled
                                style={{marginLeft: 12}}
                                size="small"
                                endIcon={
                                    <CircularProgress
                                        size={12}
                                        className={classes.buttonProgress}
                                    />
                                }
                                variant="outlined"
                                color="primary"
                            >
                                {i18n.t("connections.buttons.preparing")}
                            </Button>
                        </>
                    );
                }
            }
        }
    };
    const renderActionButtons = whatsApp => {
        return <>
            {whatsApp.status === "qrcode" && (
                <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenQrModal(whatsApp)}
                >
                    {i18n.t("connections.buttons.qrcode")}
                </Button>
            )}
            {whatsApp.status === "DISCONNECTED" && (
                <>
                    <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        onClick={() => handleStartWhatsAppSession(whatsApp.id)}
                    >
                        {i18n.t("connections.buttons.tryAgain")}
                    </Button>{" "}
                    <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => handleRequestNewQrCode(whatsApp.id)}
                    >
                        {i18n.t("connections.buttons.newQr")}
                    </Button>
                </>
            )}
            {(whatsApp.status === "CONNECTED" ||
                whatsApp.status === "PAIRING" ||
                whatsApp.status === "TIMEOUT") && (
                <>
                    <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        onClick={() => {
                            handleOpenConfirmationModal("disconnect", whatsApp.id);
                        }}
                    >
                        {i18n.t("connections.buttons.disconnect")}
                    </Button>
                    {renderImportButton(whatsApp)}
                </>)}
            {whatsApp.status === "OPENING" && (
                <Button size="small" variant="outlined" disabled>
                    {i18n.t("connections.buttons.connecting")}
                </Button>
            )}
        </>;
    };

    const renderStatusToolTips = whatsApp => {
        return (
            <div className={classes.customTableCell}>
                {whatsApp.status === "DISCONNECTED" && (
                    <CustomToolTip
                        title={i18n.t("connections.toolTips.disconnected.title")}
                        content={i18n.t("connections.toolTips.disconnected.content")}
                    >
                        <SignalCellularConnectedNoInternet0Bar color="secondary"/>
                    </CustomToolTip>
                )}
                {whatsApp.status === "OPENING" && (
                    <CircularProgress size={24} className={classes.buttonProgress}/>
                )}
                {whatsApp.status === "qrcode" && (
                    <CustomToolTip
                        title={i18n.t("connections.toolTips.qrcode.title")}
                        content={i18n.t("connections.toolTips.qrcode.content")}
                    >
                        <CropFree/>
                    </CustomToolTip>
                )}
                {whatsApp.status === "CONNECTED" && (
                    <CustomToolTip title={i18n.t("connections.toolTips.connected.title")}>
                        <SignalCellular4Bar style={{color: green[500]}}/>
                    </CustomToolTip>
                )}
                {(whatsApp.status === "TIMEOUT" || whatsApp.status === "PAIRING") && (
                    <CustomToolTip
                        title={i18n.t("connections.toolTips.timeout.title")}
                        content={i18n.t("connections.toolTips.timeout.content")}
                    >
                        <SignalCellularConnectedNoInternet2Bar color="secondary"/>
                    </CustomToolTip>
                )}
            </div>
        );
    };

    const restartWhatsapps = async () => {
        try {
            await api.post(`/whatsapp-restart/`);
            toast.success(i18n.t("Aguarde... Suas conexões serão reiniciadas!"));
        } catch (err) {
            toastError(err);
        }
    }

    return (
        <MainContainer>
            <ConfirmationModal
                title={confirmModalInfo.title}
                open={confirmModalOpen}
                onClose={setConfirmModalOpen}
                onConfirm={handleSubmitConfirmationModal}
            >
                {confirmModalInfo.message}
            </ConfirmationModal>
            <QrcodeModal
                open={qrModalOpen}
                onClose={handleCloseQrModal}
                whatsAppId={!whatsAppModalOpen && selectedWhatsApp?.id}
            />
            <WhatsAppModal
                open={whatsAppModalOpen}
                onClose={handleCloseWhatsAppModal}
                whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
            />
            <MainHeader>
                <Title>{i18n.t("connections.title")}</Title>
                <MainHeaderButtonsWrapper>
                    <Can
                        role={user.profile}
                        perform="connections-page:restartConnection"
                        yes={() => (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={restartWhatsapps}
                            >
                                {i18n.t("Reiniciar Conexões")}
                            </Button>
                        )}
                    />
                    {callSuport === "enabled" && (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => openInNewTab(`https://wa.me/${waSuport}?text=${msgSuport}`)}
                        >
                            {i18n.t("connections.buttons.support")}
                        </Button>
                    )}
                    <Can
                        role={user.profile}
                        perform="connections-page:addConnection"
                        yes={() => (
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleOpenWhatsAppModal}
                            >
                                {i18n.t("connections.buttons.add")}
                            </Button>
                        )}
                    />
                </MainHeaderButtonsWrapper>
            </MainHeader>

            {statusImport?.all ? (
                <>
                    <div style={{margin: "auto", marginBottom: 12}}>
                        <Card className={classes.root}>
                            <CardContent className={classes.content}>
                                <Typography component="h5" variant="h5">

                                    {statusImport?.this === -1 ? i18n.t("connections.buttons.preparing") : i18n.t("connections.buttons.importing")}

                                </Typography>
                                {statusImport?.this === -1 ?
                                    <Typography component="h6" variant="h6" align="center">

                                        <CircularProgress
                                            size={24}
                                        />

                                    </Typography>


                                    :
                                    <>

                                        <Typography component="h6" variant="h6" align="center">
                                            {`${i18n.t(`connections.typography.processed`)} ${statusImport?.this} ${i18n.t(`connections.typography.in`)} ${statusImport?.all}  ${i18n.t(`connections.typography.date`)}: ${statusImport?.date} `}
                                        </Typography>
                                        <Typography align="center">
                                            <CircularProgressWithLabel
                                                style={{margin: "auto"}}
                                                value={(statusImport?.this / statusImport?.all) * 100}
                                            />
                                        </Typography>
                                    </>


                                }

                            </CardContent>
                        </Card>
                    </div>
                </>
            ) : null}

            <Paper className={classes.mainPaper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">
                                {i18n.t("connections.table.name")}
                            </TableCell>
                            <TableCell align="center">
                                {i18n.t("connections.table.status")}
                            </TableCell>
                            <TableCell align="center">{i18n.t("connections.table.number")}</TableCell>
                            <Can
                                role={user.profile}
                                perform="connections-page:actionButtons"
                                yes={() => (
                                    <TableCell align="center">
                                        {i18n.t("connections.table.session")}
                                    </TableCell>
                                )}
                            />
                            <TableCell align="center">
                                {i18n.t("connections.table.lastUpdate")}
                            </TableCell>
                            <TableCell align="center">
                                {i18n.t("connections.table.default")}
                            </TableCell>
                            <Can
                                role={user.profile}
                                perform="connections-page:editOrDeleteConnection"
                                yes={() => (
                                    <TableCell align="center">
                                        {i18n.t("connections.table.actions")}
                                    </TableCell>
                                )}
                            />
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRowSkeleton/>
                        ) : (
                            <>
                                {whatsApps?.length > 0 &&
                                    whatsApps.map(whatsApp => (
                                        <TableRow key={whatsApp.id}>
                                            <TableCell align="center">{whatsApp.name}</TableCell>
                                            <TableCell align="center">
                                                {renderStatusToolTips(whatsApp)}
                                            </TableCell>
                                            <TableCell
                                                align="center">{whatsApp.number ? (<>{formatSerializedId(whatsApp.number)}</>) : "-"}</TableCell>
                                            <Can
                                                role={user.profile}
                                                perform="connections-page:actionButtons"
                                                yes={() => (
                                                    <TableCell align="center">
                                                        {renderActionButtons(whatsApp)}
                                                    </TableCell>
                                                )}
                                            />
                                            <TableCell align="center">
                                                {format(parseISO(whatsApp.updatedAt), "dd/MM/yy HH:mm")}
                                            </TableCell>
                                            <TableCell align="center">
                                                {whatsApp.isDefault && (
                                                    <div className={classes.customTableCell}>
                                                        <CheckCircle style={{color: green[500]}}/>
                                                    </div>
                                                )}
                                            </TableCell>
                                            <Can
                                                role={user.profile}
                                                perform="connections-page:editOrDeleteConnection"
                                                yes={() => (
                                                    <TableCell align="center">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditWhatsApp(whatsApp)}
                                                        >
                                                            <Tooltip title={i18n.t("connections.toolTips.edit")}>
                                                                <Edit/>
                                                            </Tooltip>
                                                        </IconButton>

                                                        <IconButton
                                                            size="small"
                                                            onClick={e => {
                                                                handleOpenConfirmationModal("delete", whatsApp.id);
                                                            }}
                                                        >
                                                            <Tooltip
                                                                title={i18n.t("connections.toolTips.delete")}>
                                                                <DeleteOutline/>
                                                            </Tooltip>
                                                        </IconButton>
                                                        <IconButton
                                                            size="small"
                                                            onClick={e => {
                                                                handleOpenConfirmationModal("forceDelete", whatsApp.id);
                                                            }}
                                                        >
                                                            <Tooltip
                                                                title={i18n.t("connections.toolTips.forceDelete")}>
                                                                <DeleteForever/>
                                                            </Tooltip>
                                                        </IconButton>
                                                      <IconButton
                                                      size={'small'}
                                                      onClick={async e => {
                                                        //delete session
                                                        await api.delete(`/whatsappsession/${whatsApp.id}`);
                                                      }}
                                                      >

                                                        <Tooltip
                                                          title={i18n.t("connections.toolTips.restartSession")}>
                                                          <Refresh/>
                                                        </Tooltip>
                                                      </IconButton>
                                                    </TableCell>
                                                )}
                                            />
                                        </TableRow>
                                    ))}
                            </>
                        )}
                    </TableBody>
                </Table>
            </Paper>
        </MainContainer>
    );
};

export default Connections;
