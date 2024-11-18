import React, {useContext, useEffect, useReducer, useState} from "react";
import {Link as RouterLink, useHistory} from "react-router-dom";

import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Divider from "@mui/material/Divider";
import {Avatar, Badge, Collapse, FormControl, List} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import GroupAddRoundedIcon from '@mui/icons-material/GroupAddRounded';
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import SearchIcon from "@mui/icons-material/Search";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import FlashOnIcon from "@mui/icons-material/FlashOn";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import ViewKanban from "@mui/icons-material/ViewKanban";
import Schedule from "@mui/icons-material/Schedule";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PeopleIcon from "@mui/icons-material/People";
import ListIcon from "@mui/icons-material/ListAlt";
import AnnouncementIcon from "@mui/icons-material/Announcement";
import ForumIcon from "@mui/icons-material/Forum";
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import BusinessIcon from '@mui/icons-material/Business';
import MergeTypeIcon from '@mui/icons-material/MergeType';
import {
    AllInclusive,
    Assignment,
    AttachFile,
    CalendarToday,
    DeviceHubOutlined,
    PhonelinkSetup
} from '@mui/icons-material';
import ImportExportRoundedIcon from '@mui/icons-material/ImportExportRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import EmailRoundedIcon from '@mui/icons-material/EmailRounded';
import RotateRight from "@mui/icons-material/RotateRight";
import MemoryRoundedIcon from '@mui/icons-material/MemoryRounded';
import {i18n} from "../translate/i18n";
import {WhatsAppsContext} from "../context/WhatsApp/WhatsAppsContext";
import {AuthContext} from "../context/Auth/AuthContext";
import {Can} from "../components/Can";
import {SocketContext} from "../context/Socket/SocketContext";
import {isArray} from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import makeStyles from '@mui/styles/makeStyles';
import usePlans from "../hooks/usePlans";

import Typography from "@mui/material/Typography";
import useVersion from "../hooks/useVersion";
import useSettings from "../hooks/useSettings"; // Corrigir o caminho do import
import ColorModeContext from "./themeContext";

const useStyles = makeStyles((theme) => ({
    ListSubheader: {
        height: 26,
        marginTop: "-15px",
        marginBottom: "-10px",
    },
    icons: {
        color: theme.palette.iconColor
    }
}));

function ListItemLink(props) {
    const {icon, primary, to, className} = props;

    const renderLink = React.useMemo(
        () =>
            React.forwardRef((itemProps, ref) => (
                <RouterLink to={to} ref={ref} {...itemProps} />
            )),
        [to]
    );

    return (
        <li>
            <ListItem button dense component={renderLink} className={className}>
                {icon ? <ListItemIcon>{icon}</ListItemIcon> : null}
                <ListItemText primary={primary}/>
            </ListItem>
        </li>
    );
}

const reducer = (state, action) => {
    if (action.type === "LOAD_CHATS") {
        const chats = action.payload;
        const newChats = [];

        if (isArray(chats)) {
            chats.forEach((chat) => {
                const chatIndex = state.findIndex((u) => u.id === chat.id);
                if (chatIndex !== -1) {
                    state[chatIndex] = chat;
                } else {
                    newChats.push(chat);
                }
            });
        }

        return [...state, ...newChats];
    }

    if (action.type === "UPDATE_CHATS") {
        const chat = action.payload;
        const chatIndex = state.findIndex((u) => u.id === chat.id);

        if (chatIndex !== -1) {
            state[chatIndex] = chat;
            return [...state];
        } else {
            return [chat, ...state];
        }
    }

    if (action.type === "DELETE_CHAT") {
        const chatId = action.payload;

        const chatIndex = state.findIndex((u) => u.id === chatId);
        if (chatIndex !== -1) {
            state.splice(chatIndex, 1);
        }
        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }

    if (action.type === "CHANGE_CHAT") {
        const changedChats = state.map((chat) => {
            if (chat.id === action.payload.chat.id) {
                return action.payload.chat;
            }
            return chat;
        });
        return changedChats;
    }
};

const MainListItems = (props) => {
    const classes = useStyles();
    const {drawerClose, collapsed} = props;
    const {whatsApps} = useContext(WhatsAppsContext);
    const {user, handleLogout} = useContext(AuthContext);
    const {toggleColorMode, iconColorLight, iconColorDark} = useContext(ColorModeContext);
    const [connectionWarning, setConnectionWarning] = useState(false);
    const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
    const [showCampaigns, setShowCampaigns] = useState(false);
    const [showEmail, setShowEmail] = useState(false);

    const [showOpenAi, setShowOpenAi] = useState(false);
    const [showIntegrations, setShowIntegrations] = useState(false);
    const history = useHistory();
    const [showSchedules, setShowSchedules] = useState(false);
    const [showInternalChat, setShowInternalChat] = useState(false);
    const [showExternalApi, setShowExternalApi] = useState(false);
    const [showKanban, setShowKanban] = useState(false);
    const [openKanbanSubmenu, setOpenKanbanSubmenu] = useState(false);
    const [showTypeBotInMainMenu, setShowTypeBotInMainMenu] = useState(false);
    const [showAllConnections, setShowAllConnections] = useState(false);

    const [invisible, setInvisible] = useState(true);
    const [pageNumber, setPageNumber] = useState(1);
    const [searchParam] = useState("");
    const [chats, dispatch] = useReducer(reducer, []);
    //const [openKanbanSubmenu, setOpenKanbanSubmenu] = useState(false);
    const [openEmailSubmenu, setOpenEmailSubmenu] = useState(false);
    const [openIntegrationsSubmenu, setOpenIntegrationsSubmenu] = useState(false);
    const [version, setVersion] = useState(false);
    const {getPlanCompany} = usePlans();
    const {getVersion} = useVersion();
    const {settings} = useSettings();

    const isDarkMode = toggleColorMode;

    const socketManager = useContext(SocketContext);

    useEffect(async () => {
        async function fetchVersion() {
            const _version = await getVersion();
            setVersion(_version.version);
        }

        await fetchVersion();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        api.get(`/settings`).then(({data}) => {
            if (Array.isArray(data)) {
                const showTypeBotInMainMenu = data.find((d) => d.key === "showTypeBotInMainMenu");
                if (showTypeBotInMainMenu) {
                    setShowTypeBotInMainMenu(showTypeBotInMainMenu.value);
                }
                const showAllConnections = data.find((d) => d.key === "enableAllConnections");
                if (showAllConnections) {
                    setShowAllConnections(showAllConnections.value);
                }
            }
        });
    }, []);

    useEffect(() => {
        dispatch({type: "RESET"});
        setPageNumber(1);
    }, [searchParam]);

    useEffect(async () => {
        await fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    useEffect(async () => {
        await fetchChats();
    }, [searchParam, pageNumber]);

    useEffect(() => {
        const companyId = localStorage.getItem("companyId");
        const socket = socketManager.GetSocket(companyId);

        const onCompanyChatMainListItems = (data) => {
            if (data.action === "new-message") {
                dispatch({type: "CHANGE_CHAT", payload: data});
            }
            if (data.action === "update") {
                dispatch({type: "CHANGE_CHAT", payload: data});
            }
        }

        socket.on(`company-${companyId}-chat`, onCompanyChatMainListItems);
        return () => {
            socket.off(`company-${companyId}-chat`, onCompanyChatMainListItems);
        };
    }, []);

    useEffect(() => {
        let unreadsCount = 0;
        if (chats.length > 0) {
            for (let chat of chats) {
                for (let chatUser of chat.users) {
                    if (chatUser.userId === user.id) {
                        unreadsCount += chatUser.unreads;
                    }
                }
            }
        }
        if (unreadsCount > 0) {
            setInvisible(false);
        } else {
            setInvisible(true);
        }
    }, [chats, user.id]);

    useEffect(() => {
        if (localStorage.getItem("cshow")) {
            setShowCampaigns(true);
        }
    }, []);

    useEffect(() => {
        if (localStorage.getItem("eshow")) {
            setShowEmail(true);
        }
    }, []);

    useEffect(() => {
        if (whatsApps.length > 0) {
            const offlineWhats = whatsApps.filter((whats) => {
                return (
                    whats.status === "qrcode" ||
                    whats.status === "PAIRING" ||
                    whats.status === "DISCONNECTED" ||
                    whats.status === "TIMEOUT" ||
                    whats.status === "OPENING"
                );
            });
            if (offlineWhats.length > 0) {
                setConnectionWarning(true);
            } else {
                setConnectionWarning(false);
            }
        }
    }, [whatsApps]);

    useEffect(() => {
        if (collapsed) {
            setOpenCampaignSubmenu(false)
            setOpenEmailSubmenu(false)
            setOpenIntegrationsSubmenu(false)
            setOpenKanbanSubmenu(false)
        }
    }, [collapsed]);

    async function fetchData() {
        if (window.location.pathname === "/login") return;

        const companyId = user.companyId;
        const planConfigs = await getPlanCompany(undefined, companyId);

        setShowCampaigns(planConfigs.plan.useCampaigns);
        setShowKanban(planConfigs.plan.useKanban)
        setShowOpenAi(planConfigs.plan.useOpenAi);
        setShowIntegrations(planConfigs.plan.useIntegrations);
        setShowSchedules(planConfigs.plan.useSchedules);
        setShowInternalChat(planConfigs.plan.useInternalChat);
        setShowExternalApi(planConfigs.plan.useExternalApi);
        setShowEmail(planConfigs.plan.useEmail);
    }

    const fetchChats = async () => {
        try {
            const {data} = await api.get("/chats/", {
                params: {searchParam, pageNumber},
            });
            dispatch({type: "LOAD_CHATS", payload: data.records});
        } catch (err) {
            toastError(err);
        }
    };

    const handleClickLogout = () => {
        //handleCloseMenu();
        handleLogout();
    };

    const handleOpenIntegrationsSubmenu = () => {
        setOpenIntegrationsSubmenu(!openIntegrationsSubmenu);
    };

    return (
      <div>
        <Can
          role={user.profile}
          perform={"dashboard:view"}
          yes={() => (
            <>
              <ListSubheader
                hidden={collapsed}
                style={{
                  position: "relative",
                  fontSize: "17px",
                  textAlign: "left",
                  paddingLeft: 20
                }}
                inset
                color="inherit">
                {i18n.t("mainDrawer.listTitle.management")}
              </ListSubheader>
              <div>
                <ListItemLink
                  small
                  to="/"
                  primary="Dashboard"
                  icon={<DashboardOutlinedIcon className={classes.icons}/>}
                />
                <ListItemLink
                  to="/export"
                  primary={i18n.t("mainDrawer.listItems.export")}
                  icon={<ImportExportRoundedIcon className={classes.icons}/>}
                />
                <ListItemLink
                  to="/relatorios"
                  primary={i18n.t("Relátorios")}
                  icon={<SearchIcon className={classes.icons}/>}
                />
              </div>
            </>
          )}
        />
        <Can
          role={user.profile}
          perform={"drawer-service-items:view"}
          style={{
            overflowY: "scroll",
          }}
          no={() => (
            <>
              <ListSubheader
                hidden={collapsed}
                style={{
                  position: "relative",
                  fontSize: "17px",
                  textAlign: "left",
                  paddingLeft: 20
                }}
                inset
                color="inherit">
                {i18n.t("mainDrawer.listTitle.service")}
              </ListSubheader>
              <>
                <div>
                  <ListItemLink
                    to="/tickets"
                    primary={i18n.t("mainDrawer.listItems.tickets")}
                    icon={<WhatsAppIcon className={classes.icons}/>}
                  />
                  {/*
                                    <ListItemLink
                                        to="/moments"
                                        primary={i18n.t("mainDrawer.listItems.chatsTempoReal")}
                                        icon={<Assignment />}
                                    />
                                */}
                  <ListItemLink
                    to="/quick-messages"
                    primary={i18n.t("mainDrawer.listItems.quickMessages")}
                    icon={<FlashOnIcon className={classes.icons}/>}
                  />
                  {showKanban && (
                    <>
                      <ListItem button onClick={() => setOpenKanbanSubmenu((prev) => !prev)}
                                className={classes.listItem}>
                        <ListItemIcon>
                          <DashboardOutlinedIcon className={classes.icons}/>
                        </ListItemIcon>
                        <ListItemText primary={i18n.t("Kanban")}/>
                        {openKanbanSubmenu ? <ExpandLessIcon className={classes.icons}/> :
                          <ExpandMoreIcon className={classes.icons}/>}
                      </ListItem>
                      <Collapse
                        style={{paddingLeft: 15}}
                        in={openKanbanSubmenu} timeout="auto" unmountOnExit>
                        <List component="div" disablePadding>
                          <ListItemLink
                            to="/kanban"
                            primary={i18n.t("Painel")}
                            icon={<ListIcon className={classes.icons}/>}
                            className={classes.nested}
                          />
                          {/*<ListItemLink
                                          to="/tagsKanban"
                                          primary={i18n.t("Tags")}
                                          icon={<CalendarToday />}
                                          className={classes.nested}
                                        />*/}
                          <ListItemLink
                            to="/kanban-schedules"
                            primary={i18n.t("Em Andamento")}
                            icon={<EventAvailableIcon className={classes.icons}/>}
                            className={classes.nested}
                          />
                        </List>
                      </Collapse>
                    </>
                  )}
                </div>
                {showEmail && (
                  <>
                    <ListItem
                      button dense onClick={() => setOpenEmailSubmenu((prev) => !prev)}
                    >
                      <ListItemIcon>
                        <EmailRoundedIcon className={classes.icons}/>
                      </ListItemIcon>
                      <ListItemText primary={i18n.t('mainDrawer.listItems.email')}/>
                      {openEmailSubmenu ? <ExpandLessIcon className={classes.icons}/> :
                        <ExpandMoreIcon className={classes.icons}/>}
                    </ListItem>

                    <Collapse
                      style={{paddingLeft: 15}}
                      in={openEmailSubmenu} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        <ListItemLink to={"/Email"} primary={i18n.t("email.subMenus.send")}
                                      icon={<SendRoundedIcon className={classes.icons}/>}/>
                        <ListItemLink to={"/EmailLis"} primary={i18n.t("email.subMenus.sent")}
                                      icon={<SendRoundedIcon className={classes.icons}/>}/>
                        <ListItemLink to={"/EmailScheduler"}
                                      primary={i18n.t("email.subMenus.schedule")}
                                      icon={<EventRoundedIcon className={classes.icons}/>}/>
                        <ListItemLink to={"/EmailsAgendado"}
                                      primary={i18n.t("email.subMenus.scheduled")}
                                      icon={<ScheduleRoundedIcon className={classes.icons}/>}/>

                      </List>
                    </Collapse>
                  </>
                )}
                <div>
                  <ListItemLink
                    to="/todolist"

                    primary={i18n.t("mainDrawer.listItems.tasks")}
                    icon={<EventAvailableIcon className={classes.icons}/>}
                  />
                  <ListItemLink
                    to="/contacts"
                    primary={i18n.t("mainDrawer.listItems.contacts")}
                    icon={<ContactPhoneOutlinedIcon className={classes.icons}/>}
                  />
                  {showSchedules && (
                    <>
                      <ListItemLink
                        to="/schedules"
                        primary={i18n.t("mainDrawer.listItems.schedules")}
                        icon={<Schedule className={classes.icons}/>}
                      />
                    </>
                  )}
                  <ListItemLink
                    to="/tags"
                    primary={i18n.t("mainDrawer.listItems.tags")}
                    icon={<LocalOfferIcon className={classes.icons}/>}
                  />
                  {showInternalChat && (
                    <>
                      <ListItemLink
                        to="/chats"
                        primary={i18n.t("mainDrawer.listItems.chats")}
                        icon={
                          <Badge color="secondary" variant="dot" invisible={invisible}>
                            <ForumIcon className={classes.icons}/>
                          </Badge>
                        }
                      />
                    </>
                  )}
                  {showTypeBotInMainMenu === "enabled" && (
                    <ListItemLink
                      to="/typebot"
                      primary={i18n.t("mainDrawer.listItems.typebot")}
                      icon={<MergeTypeIcon className={classes.icons}/>}
                    />
                  )}
                  <ListItemLink
                    to="/helps"
                    primary={i18n.t("mainDrawer.listItems.helps")}
                    icon={<HelpOutlineIcon className={classes.icons}/>}
                  />
                </div>
              </>
            </>
          )}
        />
        <Can
          role={user.profile}
          perform="drawer-admin-items:view"
          yes={() => (
            <>
              <Divider/>
              <ListSubheader
                hidden={collapsed}
                style={{
                  position: "relative",
                  fontSize: "17px",
                  textAlign: "left",
                  paddingLeft: 20
                }}
                inset
                color="inherit">
                {i18n.t("mainDrawer.listTitle.administration")}
              </ListSubheader>

              {showCampaigns && (
                <>
                  <ListItem
                    button dense
                    onClick={() => setOpenCampaignSubmenu((prev) => !prev)}
                  >
                    <ListItemIcon>
                      <EventAvailableIcon className={classes.icons}/>
                    </ListItemIcon>
                    <ListItemText
                      primary={i18n.t("mainDrawer.listItems.campaigns.menu")}
                    />
                    {openCampaignSubmenu ? (
                      <ExpandLessIcon className={classes.icons}/>
                    ) : (
                      <ExpandMoreIcon className={classes.icons}/>
                    )}
                  </ListItem>
                  <Collapse
                    style={{paddingLeft: 15}}
                    in={openCampaignSubmenu}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding>
                      <ListItemLink to="/campaigns"
                                    primary={i18n.t("mainDrawer.listItems.campaigns.listing")}
                                    icon={<ListIcon className={classes.icons}/>}/>
                      <ListItemLink to="/contact-lists"
                                    primary={i18n.t("mainDrawer.listItems.campaigns.contactList")}
                                    icon={<PeopleIcon className={classes.icons}/>}/>
                      <ListItemLink to="/files" primary={i18n.t("mainDrawer.listItems.files")}
                                    icon={<AttachFile className={classes.icons}/>}/>
                      <ListItemLink to="/campaigns-config"
                                    primary={i18n.t("mainDrawer.listItems.campaigns.config")}
                                    icon={<SettingsOutlinedIcon className={classes.icons}/>}/>
                    </List>
                  </Collapse>
                </>
              )}
              <div>
                {user.super && (
                  <ListItemLink
                    to="/announcements"
                    primary={i18n.t("mainDrawer.listItems.annoucements")}
                    icon={<AnnouncementIcon className={classes.icons}/>}
                  />
                )}
                {showIntegrations && (
                  <>
                    <ListItem
                      button dense
                      onClick={handleOpenIntegrationsSubmenu}
                    >
                      <ListItemIcon>
                        <DeviceHubOutlined className={classes.icons}/>
                      </ListItemIcon>
                      <ListItemText primary={i18n.t("mainDrawer.listItems.integrations.menu")}/>
                      {openIntegrationsSubmenu ? <ExpandLessIcon className={classes.icons}/> :
                        <ExpandMoreIcon className={classes.icons}/>}
                    </ListItem>
                    <Collapse
                      style={{paddingLeft: 15}}
                      in={openIntegrationsSubmenu}
                      timeout="auto"
                      unmountOnExit
                    >
                      <List component="div" disablePadding>
                        <ListItemLink to={"/prompts"}
                                      primary={i18n.t("mainDrawer.listItems.prompts")}
                                      icon={<AllInclusive className={classes.icons}/>}/>
                        <ListItemLink to={"/messages-api"}
                                      primary={i18n.t("mainDrawer.listItems.messagesAPI")}
                                      icon={<CodeRoundedIcon className={classes.icons}/>}/>
                        <ListItemLink to={"/queue-integration"}
                                      primary={i18n.t("mainDrawer.listItems.queueIntegration")}
                                      icon={<DeviceHubOutlined className={classes.icons}/>}/>
                      </List>
                    </Collapse>
                  </>
                )}
                <ListItemLink
                  to="/connections"
                  primary={i18n.t("mainDrawer.listItems.connections")}
                  icon={
                    <Badge badgeContent={connectionWarning ? "!" : 0} color="error">
                      <SyncAltIcon className={classes.icons}/>
                    </Badge>
                  }
                />
                {showAllConnections === "enabled" && user.super && (
                  <ListItemLink
                    to="/allConnections"
                    primary={i18n.t("mainDrawer.listItems.allConnections")}
                    icon={<PhonelinkSetup className={classes.icons}/>}
                  />
                )}
                <ListItemLink
                  to="/queues"
                  primary={i18n.t("mainDrawer.listItems.queues")}
                  icon={<AccountTreeOutlinedIcon className={classes.icons}/>}
                />
                <ListItemLink
                  to="/users"
                  primary={i18n.t("mainDrawer.listItems.users")}
                  icon={<PeopleAltOutlinedIcon className={classes.icons}/>}
                />
                <ListItemLink
                  to="/financeiro"
                  primary={i18n.t("mainDrawer.listItems.financeiro")}
                  icon={<LocalAtmIcon className={classes.icons}/>}
                />

                <ListItemLink
                  to="/settings"
                  primary={i18n.t("mainDrawer.listItems.settings")}
                  icon={<SettingsOutlinedIcon className={classes.icons}/>}
                />

                {user.super && (
                  <ListItemLink
                    to="/companies"
                    primary={i18n.t("mainDrawer.listItems.companies")}
                    icon={<BusinessIcon className={classes.icons}/>}
                  />)}
                {}
              </div>
            </>
          )}
        />
        <Can
          role={user.profile}
          perform="drawer-superv-items:view"
          yes={() => (
            <>
              <Divider/>
              <ListSubheader
                hidden={collapsed}
                style={{
                  position: "relative",
                  fontSize: "17px",
                  textAlign: "left",
                  paddingLeft: 20
                }}
                inset
                color="inherit"
              >
                {i18n.t("mainDrawer.listTitle.administration")}
              </ListSubheader>

              <ListItemLink to="/connections" primary={i18n.t("mainDrawer.listItems.connections")}
                            icon={<SyncAltIcon className={classes.icons}/>}/>

              <ListItemLink to="/users" primary={i18n.t("mainDrawer.listItems.users")}
                            icon={<PeopleAltOutlinedIcon className={classes.icons}/>}/>
            </>
          )}
        />
        <Divider/>

        <li>
          <ListItem
            button
            dense
            onClick={handleClickLogout}>
            <ListItemIcon><RotateRight className={classes.icons}/></ListItemIcon>
            <ListItemText primary={i18n.t("mainDrawer.listItems.exit")}/>
          </ListItem>
        </li>
        {!collapsed && <React.Fragment>
          <Typography style={{fontSize: "12px", padding: "10px", textAlign: "left", fontWeight: "bold"}}>
            {i18n.t("mainDrawer.listItems.version")}: {version}
          </Typography>
        </React.Fragment>
        }

      </div>
    );
};

export default MainListItems;
