import React, {useState, useEffect, useReducer, useRef, useContext} from "react";
import { Document, Page } from 'react-pdf';
import {isSameDay, parseISO, format} from "date-fns";
import cx from "classix";

import {green, blue, red} from "@mui/material/colors";
import { Button, CircularProgress, Divider, IconButton, Badge } from "@mui/material";

import makeStyles from '@mui/styles/makeStyles';

import {
    AccessTime,
    Block,
    Done,
    DoneAll,
    ExpandMore,
    GetApp,
} from "@mui/icons-material";

import MarkdownWrapper from "../MarkdownWrapper";
import ModalImageCors from "../ModalImageCors";
import MessageOptionsMenu from "../MessageOptionsMenu";
import whatsBackground from "../../assets/wa-background.png";
import LocationPreview from "../LocationPreview";
import {Checkbox} from "@mui/material";

import whatsBackgroundDark from "../../assets/wa-background-dark.png";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import {SocketContext} from "../../context/Socket/SocketContext";
import {i18n} from "../../translate/i18n";
import {ReplyMessageContext} from "../../context/ReplyingMessage/ReplyingMessageContext";
import VcardPreview from "../VcardPreview";
import YouTubePreview from "../ModalYoutubeCors";
import {QueueSelectedContext} from "../../context/QueuesSelected/QueuesSelectedContext";

import CustomAudioPlayer from "../Audio/CustomAudioPlayer";

// Outside of React component
const options = {
    standardFontDataUrl: '/standard_fonts/',
};

const useStyles = makeStyles((theme) => ({
    messagesListWrapper: {
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        width: "100%",
        minWidth: 300,
        minHeight: 200,
    },

    messagesList: {
        backgroundImage:
            theme.mode === "light"
                ? `url(${whatsBackground})`
                : `url(${whatsBackgroundDark})`, display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        padding: "10px",
        overflowY: "scroll",
        overflowX: "hidden",

        breakBefore: 'always',
        pageBreakInside: 'avoid',
        ...theme.scrollbarStyles,
    },

    circleLoading: {
        color: green[500],
        position: "absolute",
        opacity: "70%",
        top: 0,
        left: "50%",
        marginTop: 12,
    },

    messageLeft: {
        marginRight: 20,
        marginTop: 2,
        breakBefore: 'always',
        pageBreakInside: 'avoid',
        minWidth: 100,
        maxWidth: 600,
        height: "auto",
        display: "block",
        position: "relative",
        "&:hover #messageActionsButton": {
            display: "flex",
            position: "absolute",
            top: 0,
            right: 0,
        },

        whiteSpace: "pre-wrap",
        backgroundColor: "#ffffff",
        color: "#303030",
        alignSelf: "flex-start",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 5,
        paddingBottom: 0,
        boxShadow: "0 1px 1px #b3b3b3",
    },

    quotedContainerLeft: {
        margin: "-3px -80px 6px -6px",
        overflow: "hidden",
        backgroundColor: "#f0f0f0",
        borderRadius: "7.5px",
        display: "flex",
        position: "relative",
    },

    quotedMsg: {
        padding: 10,
        maxWidth: 300,
        height: "auto",
        display: "block",
        whiteSpace: "pre-wrap",
        overflow: "hidden",
    },

    quotedSideColorLeft: {
        flex: "none",
        width: "4px",
        backgroundColor: "#6bcbef",
    },

    messageRight: {
        marginLeft: 20,
        marginTop: 2,
        minWidth: 100,
        maxWidth: 600,
        breakBefore: 'always',
        pageBreakInside: 'avoid',
        height: "auto",
        display: "block",
        position: "relative",
        "&:hover #messageActionsButton": {
            display: "flex",
            position: "absolute",
            top: 0,
            right: 0,
        },

        whiteSpace: "pre-wrap",
        backgroundColor: "#dcf8c6",
        color: "#303030",
        alignSelf: "flex-end",
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 0,
        paddingLeft: 5,
        paddingRight: 5,
        paddingTop: 5,
        paddingBottom: 0,
        boxShadow: "0 1px 1px #b3b3b3",
    },

    quotedContainerRight: {
        margin: "-3px -80px 6px -6px",
        overflowY: "hidden",
        backgroundColor: "#cfe9ba",
        borderRadius: "7.5px",
        display: "flex",
        position: "relative",
    },

    quotedMsgRight: {
        padding: 10,
        maxWidth: 300,
        height: "auto",
        whiteSpace: "pre-wrap",
    },


    quotedSideColorRight: {
        flex: "none",
        width: "4px",
        backgroundColor: "#35cd96",
    },

    messageActionsButton: {
        display: "none",
        position: "relative",
        color: "#999",
        zIndex: 1,
        backgroundColor: "inherit",
        opacity: "90%",
        "&:hover, &.Mui-focusVisible": {backgroundColor: "inherit"},
    },

    messageContactName: {
        display: "flex",
        color: "#6bcbef",
        fontWeight: 500,
    },

    textContentItem: {
        overflowWrap: "break-word",
        padding: "3px 80px 6px 6px",
    },

    textContentItemDeleted: {
        fontStyle: "italic",
        color: "rgba(0, 0, 0, 0.36)",
        overflowWrap: "break-word",
        padding: "3px 80px 6px 6px",
    },

    textContentItemEdited: {
        overflowWrap: "break-word",
        padding: "3px 120px 6px 6px",
    },

    messageMedia: {
        objectFit: "cover",
        width: 250,
        height: 200,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },

    messageVideo: {
        width: 250,
        maxHeight: 445,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },

    timestamp: {
        fontSize: 11,
        position: "absolute",
        bottom: 0,
        right: 5,
        color: "#999",
    },

    dailyTimestamp: {
        alignItems: "center",
        textAlign: "center",
        alignSelf: "center",
        width: "110px",
        backgroundColor: "#e1f3fb",
        margin: "10px",
        borderRadius: "10px",
        boxShadow: "0 1px 1px #b3b3b3",
    },

    dailyTimestampText: {
        color: "#808888",
        padding: 8,
        alignSelf: "center",
        marginLeft: "0px",
    },

    ackIcons: {
        fontSize: 18,
        verticalAlign: "middle",
        marginLeft: 4,
    },

    ackDoneReadIcon: {
        color: blue[500],
        fontSize: 18,
        verticalAlign: "middle",
        marginLeft: 4,
    },

    deletedIcon: {
        fontSize: 18,
        verticalAlign: "middle",
        marginRight: 4,
    },

    deletedMessage: {
        color: red[200],
        fontStyle: "italic",
        overflowWrap: "break-word",
        padding: "3px 80px 6px 6px",
    },


    ackDoneAllIcon: {
        color: green[500],
        fontSize: 18,
        verticalAlign: "middle",
        marginLeft: 4,
    },

    downloadMedia: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "inherit",
        padding: 10,
    },

    previewMedia: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "inherit",
        padding: 10,
    }
}));

const reducer = (state, action) => {
    if (action.type === "LOAD_MESSAGES") {
        const messages = action.payload;
        const newMessages = [];

        messages.forEach((message) => {
            const messageIndex = state.findIndex((m) => m.id === message.id);
            if (messageIndex !== -1) {
                state[messageIndex] = message;
            } else {
                newMessages.push(message);
            }
        });

        return [...newMessages, ...state];
    }

    if (action.type === "ADD_MESSAGE") {
        const newMessage = action.payload;
        const messageIndex = state.findIndex((m) => m.id === newMessage.id);

        if (messageIndex !== -1) {
            state[messageIndex] = newMessage;
        } else {
            state.push(newMessage);
        }

        return [...state];
    }

    if (action.type === "UPDATE_MESSAGE") {
        const messageToUpdate = action.payload;
        const messageIndex = state.findIndex((m) => m.id === messageToUpdate.id);

        if (messageIndex !== -1) {
            state[messageIndex] = messageToUpdate;
        }

        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }
};

const MessagesList = ({
                          ticket,
                          ticketId,
                          isGroup,
                          showSelectMessageCheckbox,
                          setShowSelectMessageCheckbox,
                          setSelectedMessagesList,
                          selectedMessagesList,
                          forwardMessageModalOpen,
                          setForwardMessageModalOpen
                      }) => {
    const classes = useStyles();

    const [messagesList, dispatch] = useReducer(reducer, []);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const lastMessageRef = useRef();

    const [selectedMessage, setSelectedMessage] = useState({});
    const {setReplyingMessage} = useContext(ReplyMessageContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const messageOptionsMenuOpen = Boolean(anchorEl);
    const currentTicketId = useRef(ticketId);
    const {selectedQueuesMessage} = useContext(QueueSelectedContext);

    const socketManager = useContext(SocketContext);

    useEffect(() => {
        dispatch({type: "RESET"});
        setPageNumber(1);

        currentTicketId.current = ticketId;
    }, [ticketId, selectedQueuesMessage]);

    useEffect(async () => {
        setLoading(true);

        if (ticketId === undefined) return;
        try {
            const {data} = await api.get("/messages/" + ticketId, {
                params: {pageNumber, selectedQueues: JSON.stringify(selectedQueuesMessage)},
            });

            if (currentTicketId.current === ticketId) {
                dispatch({type: "LOAD_MESSAGES", payload: data.messages});
                setHasMore(data.hasMore);
                setLoading(false);
            }

            if (pageNumber === 1 && data.messages.length > 1) {
                scrollToBottom();
            }
        } catch (err) {
            setLoading(false);
            toastError(err);
        }

    }, [pageNumber, ticketId, selectedQueuesMessage]);

    useEffect(() => {
        const companyId = localStorage.getItem("companyId");
        const socket = socketManager.GetSocket(companyId);

        const onConnect = () => {
            socket.emit("joinChatBox", `${ticket.id}`);
        }

        socketManager.onConnect(onConnect);

        const onAppMessage = (data) => {
            if (data.action === "create" && data.message.ticketId === currentTicketId.current) {
                dispatch({type: "ADD_MESSAGE", payload: data.message});
                scrollToBottom();
            }

            if (data.action === "update" && data.message.ticketId === currentTicketId.current) {
                dispatch({type: "UPDATE_MESSAGE", payload: data.message});
            }
        }

        socket.on(`company-${companyId}-appMessage`, onAppMessage);

        return () => {
            socket.off(`company-${companyId}-appMessage`, onAppMessage);
        };
    }, [ticketId, ticket]);

    const handleSelectMessage = (e, message) => {
        const list = selectedMessagesList;
        //check if message is already in list
        const index = list.findIndex((m) => m.id === message.id);
        if (index >= 0)
            return;

        if (e.target.checked) {
            list.push(message);
        } else {
            if (list.length >= 4) {
                toastError({response: {data: {message: "Não é possível selecionar mais de 4 mensagens para encaminhar."}}});
                return;
            }
            const index = list.findIndex((m) => m.id === message.id);
            list.splice(index, 1);
        }
        setSelectedMessagesList(list);
    }

    const SelectMessageCheckbox = ({message, showSelectMessageCheckbox}) => {
        if (showSelectMessageCheckbox) {
            return <Checkbox aria-label="" color="primary" onChange={(e) => handleSelectMessage(e, message)}/>;
        } else {
            return null;
        }
    };

    const loadMore = () => {
        setPageNumber((prevPageNumber) => prevPageNumber + 1);
    };

    const scrollToBottom = () => {
        if (lastMessageRef.current) {
            lastMessageRef.current.scrollIntoView({});
        }
    };

    const handleScroll = (e) => {
        if (!hasMore) return;
        const {scrollTop} = e.currentTarget;

        if (scrollTop === 0) {
            document.getElementById("messagesList").scrollTop = 1;
        }

        if (loading) {
            return;
        }

        if (scrollTop < 50) {
            loadMore();
        }
    };

    const handleOpenMessageOptionsMenu = (e, message) => {
        setAnchorEl(e.currentTarget);
        setSelectedMessage(message);
    };

    const handleCloseMessageOptionsMenu = (e) => {
        setAnchorEl(null);
    };

    const checkMessageMedia = (message) => {
        const data = JSON.parse(message.dataJson);
        const document =
          data?.message?.documentMessage
          || data?.message?.documentWithCaptionMessage?.message?.documentMessage;

        if (message.mediaType === 'contactsArrayMessage') {

            var body = JSON.parse(message.dataJson);
            var contacts = body.message.contactsArrayMessage.contacts;

            return (
                <div>
                    {contacts.map((contact, index) => {
                        // Nome do contato
                        var nome_contato = contact.displayName;

                        // Todos os dados de Vcard
                        var vcard = contact.vcard;

                        // Usar regex para encontrar o número de telefone
                        var regex = /TEL(;waid=\d+)?:(\+?\d[\d\s\-]+)/;
                        var match = vcard.match(regex);

                        if (match) {
                            // Formatar o número de telefone
                            var numero_completo = match[2].replace(/[\s\-\+]/g, '');

                            return <VcardPreview key={index} contact={nome_contato} numbers={numero_completo} comandoAdicional={"<br>"}/>;
                        } else {
                            return <VcardPreview key={index} contact={"Sem_Numero"} numbers={''} comandoAdicional={"<br>"}/>;
                        }
                    })}
                </div>
            );

        }else if (
            message.mediaType === "locationMessage" &&
            message.body.split("|").length >= 2
        ) {
            let locationParts = message.body.split("|");
            let imageLocation = locationParts[0];
            let linkLocation = locationParts[1];

            let descriptionLocation = null;

            if (locationParts.length > 2)
                descriptionLocation = message.body.split("|")[2];

            return (
                <LocationPreview
                    image={imageLocation}
                    link={linkLocation}
                    description={descriptionLocation}
                />
            );
        } else if (!document && message.mediaType === "image") {
            return <ModalImageCors imageUrl={message.mediaUrl} isDeleted={message.isDeleted}/>;
        } else if (message.mediaType === "contactMessage") {

            var body = JSON.parse(message.dataJson);

            let array = body.message.contactMessage.vcard.split("\n");

            console.log(array);
            // Separo o numero e o nome do dontato
            let dados_nome_completo = array[3] || "";
            let dados_numero_completo = array[4] || "";

            // Extrai apenas o nome do contato
            let matchNome = dados_nome_completo.match(/(?<=:).*$/);
            let nome_contato = matchNome ? matchNome[0] : "";

            // Extrai apenas o número de telefone
            let matchNumero = dados_numero_completo.match(/(?:waid=)?(\d+)(?=:)/);
            let numero_completo = matchNumero ? matchNumero[1] : "";

            return <VcardPreview contact={nome_contato} numbers={numero_completo}/>

        } else if (!document && message.mediaType === "audio") {
           return (
                <>
                    <CustomAudioPlayer src={message.mediaUrl} ></CustomAudioPlayer>

                </>
            );
        } else if (!document && message.mediaType === "video") {
            return (
                <video
                    className={classes.messageMedia}
                    src={message.mediaUrl}
                    controls
                />
            );
        } else if (message.mediaType === "docummentMessage") {
            return (
                <>
                <div className={classes.previewMedia}>
                    <Document file={message.mediaUrl} options={options}>
                        <Page pageNumber={1}/>
                    </Document>
                    <Button
                        startIcon={<GetApp/>}
                        color="primary"
                        variant="outlined"
                        target="_blank"
                        href={message.mediaUrl}
                    >
                        Download
                    </Button>
                </div>
                          {document?.caption && document.caption !== document?.fileName &&
                            <>
                              <Divider />
                              <div className={[cx({
                                [classes.textContentItemDeleted]: message.isDeleted,
                              }),]}>
                                <MarkdownWrapper >
                                  {document.caption}
                                </MarkdownWrapper>
                              </div>
                            </>
                          }
                </>
            );
        } else {
            return (
                <>
                    <div className={classes.downloadMedia}>
                        <Button
                            startIcon={<GetApp/>}
                            color="primary"
                            variant="outlined"
                            target="_blank"
                            href={message.mediaUrl}
                        >
                            Download
                        </Button>
                    </div>
                    {document?.caption && document.caption !== document?.fileName &&
                        <>
                          <Divider />
                              <div className={[cx({
                                [classes.textContentItemDeleted]: message.isDeleted,
                              }),]}>
                                <MarkdownWrapper >
                                  document.caption
                                </MarkdownWrapper>
                              </div>
                        </>
                    }
                </>
            );
        }
    };

    const renderMessageAck = (message) => {
        if (message.ack === 1) {
            return <AccessTime fontSize="small" className={classes.ackIcons}/>;
        }
        if (message.ack === 2) {
            return <Done fontSize="small" className={classes.ackIcons}/>;
        }
        if (message.ack === 3) {
            return <DoneAll fontSize="small" className={classes.ackDoneAllIcon}/>;
        }
        if (message.ack === 4 || message.ack === 5) {
            return <DoneAll fontSize="small" className={classes.ackDoneReadIcon}/>;
        }
    };

    const renderDailyTimestamps = (message, index) => {
        if (index === 0) {
            return (
                <span
                    className={classes.dailyTimestamp}
                    key={`timestamp-${message.id}`}
                >
          <div className={classes.dailyTimestampText}>
            {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
          </div>
        </span>
            );
        }
        if (index < messagesList.length - 1) {
            let messageDay = parseISO(messagesList[index].createdAt);
            let previousMessageDay = parseISO(messagesList[index - 1].createdAt);

            if (!isSameDay(messageDay, previousMessageDay)) {
                return (
                    <span
                        className={classes.dailyTimestamp}
                        key={`timestamp-${message.id}`}
                    >
            <div className={classes.dailyTimestampText}>
              {format(parseISO(messagesList[index].createdAt), "dd/MM/yyyy")}
            </div>
          </span>
                );
            }
        }
        if (index === messagesList.length - 1) {
            return (
                <div
                    key={`ref-${message.createdAt}`}
                    ref={lastMessageRef}
                    style={{float: "left", clear: "both"}}
                />
            );
        }
    };

    const renderNumberTicket = (message, index) => {
        if (index < messagesList.length && index > 0) {

            let messageTicket = message.ticketId;
            let previousMessageTicket = messagesList[index - 1].ticketId;

            if (messageTicket !== previousMessageTicket) {
                return (
                    <center>
                        <div className={classes.ticketNunberClosed}>
                            Conversa encerrada:{" "}
                            {format(
                                parseISO(messagesList[index - 1].createdAt),
                                "dd/MM/yyyy HH:mm:ss"
                            )}
                        </div>

                        <div className={classes.ticketNunberOpen}>
                            Conversa iniciada:{" "}
                            {format(parseISO(message.createdAt), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                    </center>
                );
            }
        }
    };

    const renderMessageDivider = (message, index) => {
        if (index < messagesList.length && index > 0) {
            let messageUser = messagesList[index].fromMe;
            let previousMessageUser = messagesList[index - 1].fromMe;

            if (messageUser !== previousMessageUser) {
                return (
                    <span style={{marginTop: 16}} key={`divider-${message.id}`}></span>
                );
            }
        }
    };

    const renderQuotedMessage = (message) => {
        return (
            <div
                className={cx(classes.quotedContainerLeft, {
                    [classes.quotedContainerRight]: message.fromMe,
                })}
            >
        <span
            className={cx(classes.quotedSideColorLeft, {
                [classes.quotedSideColorRight]: message.quotedMsg?.fromMe,
            })}
        ></span>
                <div className={classes.quotedMsg}>
                    {!message.quotedMsg?.fromMe && (
                        <span className={classes.messageContactName}>
              {message.quotedMsg?.contact?.name}
            </span>
                    )}

                    {message.quotedMsg.mediaType === "audio" && (
                        <div className={classes.downloadMedia}>
                            <CustomAudioPlayer src={message.mediaUrl} onPlay={() => handlePlay(message.mediaUrl)}></CustomAudioPlayer>

                        </div>
                    )}
                    {message.quotedMsg.mediaType === "video" && (
                        <video
                            className={classes.messageVideo}
                            src={message.quotedMsg.mediaUrl}
                            controls
                        />
                    )}
                    {message.quotedMsg.mediaType === "application" && (
                        <div className={classes.downloadMedia}>
                            <Button
                                startIcon={<GetApp/>}
                                color="primary"
                                variant="outlined"
                                target="_blank"
                                href={message.quotedMsg.mediaUrl}
                            >
                                Download
                            </Button>
                        </div>
                    )}

                    {(message.quotedMsg.mediaType === "image" && (
                            <ModalImageCors imageUrl={message.quotedMsg.mediaUrl}/>
                        )) ||
                        message.quotedMsg?.body}

                </div>
            </div>

        );
    };

    const isYouTubeLink = (url) => {
        const youtubeRegex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        return youtubeRegex.test(url);
    };

    const renderMessages = () => {

        const viewMessagesList = messagesList.map((message, index) => {

            if (message.mediaType === "call_log") {
                return (
                    <React.Fragment key={message.id}>
                        {renderDailyTimestamps(message, index)}
                        {renderNumberTicket(message, index)}
                        {renderMessageDivider(message, index)}
                        <div className={classes.messageCenter}
                             onDoubleClick={(e) => handleReplyMessage(message)}
                        >
                            <SelectMessageCheckbox showSelectMessageCheckbox={showSelectMessageCheckbox}
                                                   message={message}/>
                            <IconButton
                                variant="contained"
                                size="small"
                                id="messageActionsButton"
                                disabled={message.isDeleted}
                                className={classes.messageActionsButton}
                                onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                            >
                                <ExpandMore/>
                            </IconButton>
                            {isGroup && (
                                <span className={classes.messageContactName}>
                                    {message.contact?.name}
                            </span>
                            )}
                            <div>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 17" width="20" height="17">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 17"
                                        width="20"
                                        height="17"
                                    >
                                        <path
                                            fill="#df3333"
                                            d="M18.2 12.1c-1.5-1.8-5-2.7-8.2-2.7s-6.7 1-8.2 2.7c-.7.8-.3 2.3.2 2.8.2.2.3.3.5.3 1.4 0 3.6-.7 3.6-.7.5-.2.8-.5.8-1v-1.3c.7-1.2 5.4-1.2 6.4-.1l.1.1v1.3c0 .2.1.4.2.6.1.2.3.3.5.4 0 0 2.2.7 3.6.7.2 0 1.4-2 .5-3.1zM5.4 3.2l4.7 4.6 5.8-5.7-.9-.8L10.1 6 6.4 2.3h2.5V1H4.1v4.8h1.3V3.2z"
                                        ></path>
                                    </svg>
                                    {" "}
                                    <span>
                    Chamada de voz/vídeo perdida às{" "}
                                        {format(parseISO(message.createdAt), "HH:mm")}
                  </span>

                                </svg>
                            </div>
                        </div>
                    </React.Fragment>
                );
            }

            if (!message.fromMe) {
                return (
                    <React.Fragment key={message.id}>
                        {renderDailyTimestamps(message, index)}
                        {renderNumberTicket(message, index)}
                        {renderMessageDivider(message, index)}
                        <div className={classes.messageLeft}>
                            <SelectMessageCheckbox showSelectMessageCheckbox={showSelectMessageCheckbox}
                                                   message={message}/>
                            <IconButton
                                variant="contained"
                                size="small"
                                id="messageActionsButton"
                                disabled={message.isDeleted}
                                className={classes.messageActionsButton}
                                onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                            >
                                <ExpandMore/>
                            </IconButton>
                            {isGroup && (
                                <span className={classes.messageContactName}>
                                {message.contact?.name}
                                </span>
                            )}

                            {isYouTubeLink(message.body) && (
                                <>
                                    <YouTubePreview videoUrl={message.body}/>
                                </>
                            )}

                            {/* aviso de mensagem apagado pelo contato */}
                            {message.isDeleted && (
                                <div>
                  <span className={classes.deletedMessage}>
                    🚫 {i18n.t("message.deleted")} &nbsp;
                  </span>
                                </div>
                            )}

                            {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === 'contactMessage' || message.mediaType === 'contactsArrayMessage') && checkMessageMedia(message)}

                            <div className={[cx(classes.textContentItem, {
                                [classes.textContentItemEdited]: message.isEdited
                            }),
                            ]}
                            >
                                {message.quotedMsg && renderQuotedMessage(message)}

                                {message.mediaType !== "reactionMessage" && (
                                    <MarkdownWrapper>
                                        {message.mediaType === "locationMessage" || message.mediaType === "contactMessage" || message.mediaType === 'contactsArrayMessage'
                                            ? null
                                            : message.body}
                                    </MarkdownWrapper>
                                )}

                                {message.quotedMsg && message.mediaType === "reactionMessage" && (
                                    <>
                                        <Badge className={classes.badge}
                                               overlap="circular"
                                               anchorOrigin={{
                                                   vertical: 'bottom',
                                                   horizontal: 'right',
                                               }}
                                               badgeContent={<span
                                                   style={{fontSize: "4em", marginTop: "-95px", marginLeft: "340px"}}>
                          {message.body}
                        </span>}
                                        >
                                        </Badge>
                                        <span
                                            style={{marginLeft: "0px"}}><MarkdownWrapper>{"_*" + (message.fromMe ? 'Você' : (message?.contact?.name ?? 'Contato')) + "*_ reagiu..."}</MarkdownWrapper></span>
                                    </>
                                )}

                                <span className={classes.timestamp}>
                {message.isEdited && <span>{i18n.t("message.edited")} </span>}
                                    {format(parseISO(message.createdAt), "HH:mm")}
                </span>
                            </div>
                        </div>
                    </React.Fragment>
                );
            } else {
                return (
                    <React.Fragment key={message.id}>
                        {renderDailyTimestamps(message, index)}
                        {renderNumberTicket(message, index)}
                        {renderMessageDivider(message, index)}
                        <div className={classes.messageRight}>
                            <IconButton
                                variant="contained"
                                size="small"
                                id="messageActionsButton"
                                disabled={message.isDeleted}
                                className={classes.messageActionsButton}
                                onClick={(e) => handleOpenMessageOptionsMenu(e, message)}
                            >
                                <ExpandMore/>
                            </IconButton>
                            {isYouTubeLink(message.body) && (
                                <>
                                    <YouTubePreview videoUrl={message.body}/>
                                </>
                            )}

                            {(message.mediaUrl || message.mediaType === "locationMessage" || message.mediaType === 'contactMessage' || message.mediaType === "contactsArrayMessage") && checkMessageMedia(message)}

                            <div
                                className={cx(classes.textContentItem, {
                                    [classes.textContentItemDeleted]: message.isDeleted,
                                    [classes.textContentItemEdited]: message.isEdited
                                })}
                            >
                                {message.isDeleted && (
                                    <Block
                                        color="disabled"
                                        fontSize="small"
                                        className={classes.deletedIcon}
                                    />
                                )}
                                {message.quotedMsg && renderQuotedMessage(message)}

                                {message.mediaType !== "reactionMessage" && message.mediaType !== "locationMessage" && (
                                    <MarkdownWrapper>{message.body}</MarkdownWrapper>
                                )}

                                {message.quotedMsg && message.mediaType === "reactionMessage" && (
                                    <>
                                        <Badge className={classes.badge}
                                               overlap="circular"
                                               anchorOrigin={{
                                                   vertical: 'bottom',
                                                   horizontal: 'right',
                                               }}
                                               badgeContent={<span
                                                   style={{fontSize: "2em", marginTop: "0", marginLeft: "240px"}}>
                          {message.body}
                        </span>}
                                        >
                                        </Badge>
                                        <span
                                            style={{marginLeft: "0px"}}><MarkdownWrapper>{"_*" + (message.fromMe ? 'Você' : (message?.contact?.name ?? 'Contato')) + "*_ reagiu..."}</MarkdownWrapper></span>
                                    </>
                                )}

                                <span className={classes.timestamp}>
                {message.isEdited && <span>{i18n.t("message.edited")} </span>}
                                    {format(parseISO(message.createdAt), "HH:mm")}
                                    {renderMessageAck(message)}
                </span>
                            </div>
                        </div>
                    </React.Fragment>
                );
            }
        });
        return viewMessagesList;
    };

    return (
        <div className={classes.messagesListWrapper}>
            <MessageOptionsMenu
                message={selectedMessage}
                anchorEl={anchorEl}
                menuOpen={messageOptionsMenuOpen}
                handleClose={handleCloseMessageOptionsMenu}
                showSelectCheckBox={showSelectMessageCheckbox}
                setShowSelectCheckbox={setShowSelectMessageCheckbox}
                forwardMessageModalOpen={forwardMessageModalOpen}
                setForwardMessageModalOpen={setForwardMessageModalOpen}
                selectedMessages={selectedMessagesList}
            />
            <div
                id="messagesList"
                className={classes.messagesList}
                onScroll={handleScroll}
            >
                {messagesList.length > 0 ? renderMessages() : []}
            </div>
            {loading && (
                <div>
                    <CircularProgress className={classes.circleLoading}/>
                </div>
            )}
        </div>
    );
};

export default MessagesList;
