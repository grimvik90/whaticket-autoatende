import React, {useContext, useEffect, useRef, useState} from "react";
import {useHistory} from "react-router-dom";

import makeStyles from '@mui/styles/makeStyles';
import Paper from "@mui/material/Paper";
import InputBase from "@mui/material/InputBase";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Badge from "@mui/material/Badge";
import GroupIcon from "@mui/icons-material/Group";
import {
    Group,
    MoveToInbox as MoveToInboxIcon,
    CheckBox as CheckBoxIcon,
    MessageSharp as MessageSharpIcon,
    PlaylistAddCheckOutlined as PlaylistAddCheckOutlinedIcon,
    AccessTime as ClockIcon,
    Search as SearchIcon,
    Add as AddIcon,
} from "@mui/icons-material";
import {Snackbar} from "@mui/material";

import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import Divider from "@mui/material/Divider";
import ListSubheader from "@mui/material/ListSubheader";
import ChatIcon from '@mui/icons-material/Chat';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TicketsListGroup from "../TicketsListGroup";
import TabPanel from "../TabPanel";

import {i18n} from "../../translate/i18n";
import {AuthContext} from "../../context/Auth/AuthContext";
import {Can} from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { Button, grid } from "@mui/material";
import {TagsFilter} from "../TagsFilter";
import {UsersFilter} from "../UsersFilter";
import useSettings from "../../hooks/useSettings";
import IconButton from "@mui/material/IconButton";
import api from "../../services/api";
import {QueueSelectedContext} from "../../context/QueuesSelected/QueuesSelectedContext";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { ToggleButton } from '@mui/material';
import { DatePickerMoment } from '../DatePickerMoment';
import NewTicketGroupModal from '../NewTicketGroup';


const useStyles = makeStyles(theme => ({
    ticketsWrapper: {
        position: "relative",
        display: "flex",
        height: "100%",
        flexDirection: "column",
        overflow: "hidden",
        borderTopRightRadius: 0,
        borderBottomRightRadius: 0,
    },

    tabsHeader: {
        flex: "none",
        backgroundColor: theme.palette.tabHeaderBackground,
    },

    tabsInternal: {
        flex: "none",
		backgroundColor: theme.palette.tabHeaderBackground
    },

    settingsIcon: {
        alignSelf: "center",
        marginLeft: "auto",
        padding: 8,
    },

    tab: {
		minWidth: 60,
		width: 60,
    },

    internalTab: {
		minWidth: 60,
		width: 60,
		padding: 5
    },

    ticketOptionsBox: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: theme.palette.optionsBackground,
        padding: theme.spacing(1),
    },

    ticketSearchLine: {
        padding: theme.spacing(1),
    },

    serachInputWrapper: {
        flex: 1,
        background: theme.palette.total,
        display: "flex",
        borderRadius: 40,
        padding: 4,
        marginRight: theme.spacing(1),
    },

    searchIcon: {
        color: "grey",
        marginLeft: 6,
        marginRight: 6,
        alignSelf: "center",
    },

    searchInput: {
        flex: 1,
      border: "none",
      borderRadius: 25,
      outline: "none",
    },

    badge: {
      right: "-10px",
    },
    show: {
      display: "block",
    },
    hide: {
      display: "none !important",
    },

    insiderTabPanel: {
        height: '100%',
        marginTop: "-72px",
        paddingTop: "72px"
    },

    insiderDoubleTabPanel: {
        display: "flex",
        flexDirection: "column",
        marginTop: "-72px",
        paddingTop: "72px",
        height: "100%"
    },

    snackbar: {
        display: "flex",
        justifyContent: "space-between",
        backgroundColor: theme.palette.primary.main,
        color: "white",
        borderRadius: 30,
        [theme.breakpoints.down('md')]: {
            fontSize: "0.8em",
        },
        [theme.breakpoints.up("md")]: {
            fontSize: "1em",
        },
    },

    labelContainer: {
        width: "auto",
        padding: 0
    },
    iconLabelWrapper: {
        flexDirection: "row",
        '& > *:first-child': {
            marginBottom: '3px !important',
            marginRight: 16
        }
    },
    insiderTabLabel: {
        [theme.breakpoints.down(1600)]: {
            display: 'none'
        }
    },
    smallFormControl: {
        '& .MuiOutlinedInput-input': {
            padding: "12px 10px",
        },
        '& .MuiInputLabel-outlined': {
            marginTop: "-6px"
        }
    }
}));

const TicketsManagerTabs = () => {
    const classes = useStyles();
    const history = useHistory();

    const [searchParam, setSearchParam] = useState("");
    const [tab, setTab] = useState("open");
    const [tabOpen, setTabOpen] = useState("open");
    const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [newTicketGroupModalOpen, setNewTicketGroupModalOpen] = useState(false);
    const [showAllTickets, setShowAllTickets] = useState(false);
    const searchInputRef = useRef();
    const {user} = useContext(AuthContext);
    const {profile} = user;
    const { getCachedSetting } = useSettings();
    const [showGroupTab, setShowGroupTab] = useState(false);
    const [activeSubTab, setActiveSubTab] = useState("private");

    const {setSelectedQueuesMessage} = useContext(QueueSelectedContext);

    const [openCount, setOpenCount] = useState(0);
    const [groupOpenCount, setGroupOpenCount] = useState(0);
    const [groupPendingCount, setGroupPendingCount] = useState(0);
    const [pendingCount, setPendingCount] = useState(0);
    //const [chatbotCount, setChatbotCount] = useState(0);
    const userQueueIds = user.queues.map((q) => q.id);
    const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const [hoveredButton, setHoveredButton] = useState(null);
    const [isHoveredAll, setIsHoveredAll] = useState(false);
    const [isHoveredNew, setIsHoveredNew] = useState(false);
    const [isHoveredResolve, setIsHoveredResolve] = useState(false);
    const [isHoveredOpen, setIsHoveredOpen] = useState(false);
    const [isHoveredClosed, setIsHoveredClosed] = useState(false);
    const [isFilterActive, setIsFilterActive] = useState(false);;

    useEffect(async () => {

        setSelectedQueuesMessage(selectedQueueIds);

        // Ativa a exibição de todos os tickets para administradores
        if (user.profile.toUpperCase() === "ADMIN") {
            setShowAllTickets(true);
        }

        // Foca o input de pesquisa quando a aba de pesquisa é selecionada
        if (tab === "search") {
            searchInputRef.current.focus();
        }

        // Configura a exibição da aba de grupo baseada nas configurações
        const checkMsgIsGroupSetting = await getCachedSetting("CheckMsgIsGroup");
        if (checkMsgIsGroupSetting) {
            setShowGroupTab(checkMsgIsGroupSetting.value === "disabled");
        }

    }, [selectedQueueIds, user.profile, tab]); // Dependências atualizadas para refletir todos os estados usados dentro do useEffect


    let searchTimeout;

  const handleSelectedDate = (value, range) => {
    setSelectedDateRange({ ...selectedDateRange, [range]: value });
  };
    const handleSearch = (e) => {
        const searchedTerm = e.target.value.toLowerCase();

        clearTimeout(searchTimeout);

        if (searchedTerm === "") {
            setSearchParam(searchedTerm);
            setTab("open");
            return;
        }

        searchTimeout = setTimeout(() => {
            setSearchParam(searchedTerm);
        }, 500);
    };

    const handleChangeTab = (e, newValue) => {
        setTab(newValue);
    };

    const handleChangeSubTab = (e, newValue) => {
        setActiveSubTab(newValue);
    };

    const handleChangeTabOpen = (e, newValue) => {
        setTabOpen(newValue);
    };

    const applyPanelStyle = (status) => {
        if (tabOpen !== status) {
            return {width: 0, height: 0};
        }
    };

    const CloseAllTicket = async () => {
        try {
            const {data} = await api.post("/tickets/closeAll", {
                status: tabOpen,
                selectedQueueIds,
            });
            handleSnackbarClose();
        } catch (err) {
            console.log("Error: ", err);
        }
    };
    const handleCloseOrOpenTicket = (ticket) => {
        setNewTicketModalOpen(false);
        if (ticket !== undefined && ticket.uuid !== undefined) {
            history.push(`/tickets/${ticket.uuid}`);
        }
    };

    const handleCloseOrOpenTicketGroup = (ticket) => {
      setNewTicketGroupModalOpen(false);
      if (ticket !== undefined && ticket.uuid !== undefined) {
        history.push(`/tickets/${ticket.uuid}`);
      }
    };

    const handleSnackbarOpen = () => {
        setSnackbarOpen(true);
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen(false);
    };
    const handleSelectedTags = (selecteds) => {
        const tags = selecteds.map((t) => t.id);
        setSelectedTags(tags);
    };

    const handleSelectedUsers = (selecteds) => {
        const users = selecteds.map((t) => t.id);
        setSelectedUsers(users);
    };

    return (
        <Paper elevation={0} variant="outlined" className={classes.ticketsWrapper}>
            <NewTicketModal
                modalOpen={newTicketModalOpen}
                onClose={(ticket) => {

                    handleCloseOrOpenTicket(ticket);
                }}
            />
      <NewTicketGroupModal
        modalOpen={newTicketGroupModalOpen}
        onClose={(ticket) => {
          handleCloseOrOpenTicketGroup(ticket);
        }}
      />
            <Paper elevation={0} square className={classes.tabsHeader}>
                <Tabs
                    value={tab}
                    onChange={handleChangeTab}
                    variant="fullWidth"
                    indicatorColor="primary"
                    textColor="primary"
                    aria-label="icon label tabs example"
                >
                    <Tab
                        value={"open"}
                        icon={<ChatIcon/>}
                        label={
                            <Badge
                                className={classes.badge}
                                badgeContent={openCount + pendingCount}
                                color="primary"
                            >
                            </Badge>
                        }
                        classes={{root: classes.tab}}
                    />
                    {showGroupTab && (
                    <Tab
                        value={"group"}
                        icon={<GroupIcon />}
                        label={
                            <Badge className={classes.badge} badgeContent={groupOpenCount + groupPendingCount} color="primary">
                            </Badge>
                        }
                        classes={{ root: classes.tab }}
                    />
                    )}
                    <Tab
                        value={"closed"}
                        icon={<DoneAllIcon/>}
                        classes={{root: classes.tab}}
                    />
                    <Tab
                        value={"search"}
                        icon={<SearchIcon/>}

                        classes={{root: classes.tab}}
                    />
                </Tabs>
            </Paper>
            <Paper square elevation={0} className={classes.ticketOptionsBox}>
                <div>
                    {tab === "search" ? (
                        <div className={classes.serachInputWrapper}>
                            <SearchIcon className={classes.searchIcon}/>
                            <InputBase
                                className={classes.searchInput}
                                inputRef={searchInputRef}
                                placeholder={i18n.t("tickets.search.placeholder")}
                                type="search"
                                onChange={handleSearch}
                            />
                        </div>
                    ) : (
                        <>


                            <Snackbar
                                open={snackbarOpen}
                                onClose={handleSnackbarClose}
                                message={i18n.t("tickets.inbox.closedAllTickets")}
                                ContentProps={{
                                    className: classes.snackbar,
                                }}
                                action={
                                    <>
                                        <Button
                                            className={classes.yesButton}
                                            size="small"
                                            color="secondary"
                                            onClick={CloseAllTicket}
                                        >
                                            {i18n.t("tickets.inbox.yes")}
                                        </Button>
                                        <Button
                                            className={classes.noButton}
                                            size="small"
                                            color="secondary"
                                            onClick={handleSnackbarClose}
                                        >
                                            {i18n.t("tickets.inbox.no")}
                                        </Button>
                                    </>
                                }
                            />
                            <Can
                                role={user.allUserChat === 'enabled' && user.profile === 'user' ? 'admin' : user.profile}
                                perform="tickets-manager:showall"
                                yes={() => (
                                    <Badge
                                        color="primary"
                                        invisible={
                                            !isHoveredAll ||
                                            isHoveredNew ||
                                            isHoveredResolve ||
                                            isHoveredOpen ||
                                            isHoveredClosed
                                        }
                                        badgeContent={"Todos"}
                                        classes={{badge: classes.tabsBadge}}
                                    >
                                        <ToggleButton
                                            onMouseEnter={() => setIsHoveredAll(true)}
                                            onMouseLeave={() => setIsHoveredAll(false)}
                                            className={classes.button}
                                            value="uncheck"
                                            selected={showAllTickets}
                                            onChange={() =>
                                                setShowAllTickets((prevState) => !prevState)
                                            }
                                        >
                                            {showAllTickets ? (
                                                <VisibilityIcon className={classes.icon}/>
                                            ) : (
                                                <VisibilityOffIcon className={classes.icon}/>
                                            )}
                                        </ToggleButton>
                                    </Badge>
                                )}
                            />
                            {
                              (tab === 'open' || tab === 'closed') && ( // Adiciona uma condição para exibir o botão em ambas as guias

                                  <Badge
                                      color="primary"
                                      invisible={
                                          isHoveredAll ||
                                          !isHoveredNew ||
                                          isHoveredResolve ||
                                          isHoveredOpen ||
                                          isHoveredClosed
                                      }
                                      badgeContent={i18n.t("ticketsManager.buttons.newTicket")}
                                      classes={{badge: classes.tabsBadge}}
                                  >

                                      <IconButton
                                          onMouseEnter={() => setIsHoveredNew(true)}
                                          onMouseLeave={() => setIsHoveredNew(false)}
                                          className={classes.button}
                                          onClick={() => {
                                              setNewTicketModalOpen(true);
                                          }}
                                          size="large">
                                          <AddIcon className={classes.icon}/>
                                      </IconButton>
                                  </Badge>
                              )
                            }
                            {tab === 'group' && (
                                <Badge
                                    color="primary"
                                    invisible={
                                        isHoveredAll ||
                                        !isHoveredNew ||
                                        isHoveredResolve ||
                                        isHoveredOpen ||
                                        isHoveredClosed
                                    }
                                    badgeContent={i18n.t("ticketsManager.buttons.newGroup")}
                                    classes={{badge: classes.tabsBadge}}
                                >
                                    <IconButton
                                        onMouseEnter={() => setIsHoveredNew(true)}
                                        onMouseLeave={() => setIsHoveredNew(false)}
                                        className={classes.button}
                                        onClick={() => {
                                            setNewTicketGroupModalOpen(true);
                                        }}
                                        size="large">
                                        <AddIcon className={classes.icon}/>
                                    </IconButton>
                                </Badge>
                            )}

                            {user.profile === "admin" && (
                                <Badge
                                    color="primary"
                                    invisible={
                                        isHoveredAll ||
                                        isHoveredNew ||
                                        !isHoveredResolve ||
                                        isHoveredOpen ||
                                        isHoveredClosed
                                    }
                                    badgeContent={i18n.t("tickets.inbox.closedAll")}
                                    classes={{badge: classes.tabsBadge}}
                                >
                                    <IconButton
                                        onMouseEnter={() => setIsHoveredResolve(true)}
                                        onMouseLeave={() => setIsHoveredResolve(false)}
                                        className={classes.button}
                                        onClick={handleSnackbarOpen}
                                        size="large">
                                        <PlaylistAddCheckOutlinedIcon style={{color: "green"}}/>
                                    </IconButton>
                                </Badge>
                            )}

                        </>
                    )}
                </div>
                <TicketsQueueSelect
                    style={{marginLeft: 6}}
                    selectedQueueIds={selectedQueueIds}
                    userQueues={user?.queues}
                    onChange={(values) => setSelectedQueueIds(values)}
                />
            </Paper>
            <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
                <Tabs
                    value={tabOpen}
                    onChange={handleChangeTabOpen}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab
                        label={
                            <Badge
                                className={classes.badge}
                                badgeContent={openCount}
                                color="primary"
                            >
                                {i18n.t("ticketsList.assignedHeader")}
                            </Badge>
                        }
                        value={"open"}
                    />
                    <Tab
                        label={
                            <Badge
                                className={classes.badge}
                                badgeContent={pendingCount}
                                color="secondary"
                            >
                                {i18n.t("ticketsList.pendingHeader")}
                            </Badge>
                        }
                        value={"pending"}
                    />
                </Tabs>
                <Paper className={classes.ticketsWrapper}>
                    <TicketsList
                        status="open"
                        setTabOpen={setTabOpen}
                        showAll={showAllTickets}
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => setOpenCount(val)}
                        updateGroupCount={(val) => setGroupOpenCount(val)}
                        style={applyPanelStyle("open")}
                    />

                    <TicketsList
                        chatbot={false}
                        status="pending"
                        setTabOpen={setTabOpen}
                        selectedQueueIds={selectedQueueIds}
                        updateGroupCount={(val) => setGroupPendingCount(val)}
                        updateCount={(val) => setPendingCount(val)}
                        style={applyPanelStyle("pending")}
                    />
                </Paper>
            </TabPanel>
            <TabPanel value={tab} name="group" className={classes.ticketsWrapper}>
                <Tabs
                    value={tabOpen}
                    onChange={handleChangeTabOpen}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab
                        label={
                            <Badge
                                className={classes.badge}
                                badgeContent={groupOpenCount}
                                color="primary"
                            >
                                {i18n.t("ticketsList.assignedHeader")}
                            </Badge>
                        }
                        value={"open"}
                    />
                    <Tab
                        label={
                            <Badge
                                className={classes.badge}
                                badgeContent={groupPendingCount}
                                color="secondary"
                            >
                                {i18n.t("ticketsList.pendingHeader")}
                            </Badge>
                        }
                        value={"pending"}
                    />
                </Tabs>
                <Paper className={classes.ticketsWrapper}>
                    <TicketsListGroup
                        status="open"
                        setTabOpen={setTabOpen}
                        showAll={showAllTickets}
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => {
                            setGroupOpenCount(val);
                        }
                        }
                        style={applyPanelStyle("open")}
                    />
                    <TicketsListGroup
                        status="pending"
                        setTabOpen={setTabOpen}
                        selectedQueueIds={selectedQueueIds}
                        updateCount={(val) => setGroupPendingCount(val)}
                        style={applyPanelStyle("pending")}
                    />
                </Paper>
            </TabPanel>
            {(profile === "admin" || profile === "superv") && (
                <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
                <Tabs
                    value={activeSubTab}
                    onChange={handleChangeSubTab}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                >
                    <Tab
                        label={i18n.t("tickets.tabs.private.title")}
                        value={"private"}
                    />
                {showGroupTab && (
                    <Tab
                        label={i18n.t("tickets.tabs.group.title")}
                        value={"group"}
                    />
                )}
                </Tabs>
                <Divider />
                {activeSubTab === "private" && (
                    <TicketsList
                        status="closed"
                        showAll={showAllTickets}
                        selectedQueueIds={selectedQueueIds}
                    />
                )}
                {activeSubTab === "group" && (
                    <>
                        <Divider />
                        <TicketsListGroup
                            status="closed"
                            showAll={true}
                            selectedQueueIds={selectedQueueIds}
                        />
                    </>
                )}
            </TabPanel>
            )}
            <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
                <TagsFilter onFiltered={handleSelectedTags}/>
                {(profile === 'admin' || profile === 'supervisor') && (
                    <UsersFilter onFiltered={handleSelectedUsers}/>
                )}
                <TicketsList
                    searchParam={searchParam}
                    showAll={true}
                    tags={selectedTags}
                    users={selectedUsers}
                    selectedQueueIds={selectedQueueIds}
                />
            </TabPanel>
        </Paper>
    );
};

export default TicketsManagerTabs;
