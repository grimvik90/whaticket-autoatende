import React, { useState, useRef, useEffect, useContext } from "react";
import { useTheme } from "@mui/material/styles";

import { useHistory } from "react-router-dom";
import { format } from "date-fns";
import useSound from "use-sound";

import Popover from "@mui/material/Popover";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import makeStyles from '@mui/styles/makeStyles';
import Badge from "@mui/material/Badge";
import ChatIcon from "@mui/icons-material/Chat";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

import TicketListItem from "../TicketListItem";
import { i18n } from "../../translate/i18n";
import useTickets from "../../hooks/useTickets";
import alertSound from "../../assets/sound.mp3";
import { AuthContext } from "../../context/Auth/AuthContext";
import { SocketContext } from "../../context/Socket/SocketContext";
import Favicon from "react-favicon";

const defaultLogoFavicon = "assets/vector/favicon.svg";

const useStyles = makeStyles((theme) => ({
  tabContainer: {
    overflowY: "auto",
    maxHeight: 350,
    ...theme.scrollbarStyles,
  },
  popoverPaper: {
    width: "100%",
    maxWidth: 350,
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(1),
    [theme.breakpoints.down('md')]: {
      maxWidth: 270,
    },
  },
  noShadow: {
    boxShadow: "none !important",
  },
}));

const NotificationsPopOver = (props) => {
  const classes = useStyles();
  const theme = useTheme();

  const history = useHistory();
  const { user } = useContext(AuthContext);
  const ticketIdUrl = +history.location.pathname.split("/")[2];
  const ticketIdRef = useRef(ticketIdUrl);
  const anchorEl = useRef();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { profile, queues } = user;

  const [, setDesktopNotifications] = useState([]);

  const { tickets } = useTickets({ withUnreadMessages: "true" });
  const [play] = useSound(alertSound, {volume: props.volume});
  const soundAlertRef = useRef();

  const historyRef = useRef(history);
  
  const socketManager = useContext(SocketContext);

	useEffect(() => {
		soundAlertRef.current = play;

		if (!("Notification" in window)) {
			console.log("This browser doesn't support notifications");
		} else {
			Notification.requestPermission();
		}
	}, [play]);

	useEffect(() => {
		setNotifications(tickets);
	}, [tickets]);

	useEffect(() => {
		ticketIdRef.current = ticketIdUrl;
	}, [ticketIdUrl]);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    const socket = socketManager.GetSocket(companyId);

    const onConnectNotificationsPopover = () => {
		socket.emit("joinNotification");
	}

	const onCompanyTicketNotificationsPopover = (data) => {
      if (data.action === "updateUnread" || data.action === "delete") {
				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticketId);
					if (ticketIndex !== -1) {
						prevState.splice(ticketIndex, 1);
						return [...prevState];
					}
					return prevState;
				});

				setDesktopNotifications(prevState => {
					const notfiticationIndex = prevState.findIndex(
						n => n.tag === String(data.ticketId)
					);
					if (notfiticationIndex !== -1) {
						prevState[notfiticationIndex].close();
						prevState.splice(notfiticationIndex, 1);
						return [...prevState];
					}
					return prevState;
				});
      }
    };
    
    const onCompanyAppMessageNotificationsPopover = (data) => {
      
			if (
				data.action === "create" &&
				!data.message.read &&
				(data.ticket.userId === user?.id || !data.ticket.userId)
			) {
				setNotifications(prevState => {
					const ticketIndex = prevState.findIndex(t => t.id === data.ticket.id);
					if (ticketIndex !== -1) {
						prevState[ticketIndex] = data.ticket;
						return [...prevState];
					}
					return [data.ticket, ...prevState];
				});

				const shouldNotNotificate =
					(data.message.ticketId === ticketIdRef.current &&
						document.visibilityState === "visible") ||
					(data.ticket.userId && data.ticket.userId !== user?.id) ||
					data.ticket.isGroup;

				if (shouldNotNotificate) return;

				handleNotifications(data);
			}
    }

    socketManager.onConnect(onConnectNotificationsPopover);
    socket.on(`company-${companyId}-ticket`, onCompanyTicketNotificationsPopover);
    socket.on(`company-${companyId}-appMessage`, onCompanyAppMessageNotificationsPopover);

    return () => {
        socket.off(`company-${companyId}-ticket`, onCompanyTicketNotificationsPopover);
        socket.off(`company-${companyId}-appMessage`, onCompanyAppMessageNotificationsPopover);

    };
  }, [user, profile, queues]);

  const handleNotifications = (data) => {
    const { message, contact, ticket } = data;

    const options = {
      body: `${message.body} - ${format(new Date(), "HH:mm")}`,
      icon: contact.profilePicUrl,
      tag: ticket.id,
      renotify: true,
    };

    const notification = new Notification(
      `${i18n.t("tickets.notification.message")} ${contact.name}`,
      options
    );

    notification.onclick = (e) => {
      e.preventDefault();
      window.focus();
      historyRef.current.push(`/tickets/${ticket.uuid}`);
    };

    setDesktopNotifications((prevState) => {
      const notfiticationIndex = prevState.findIndex(
        (n) => n.tag === notification.tag
      );
      if (notfiticationIndex !== -1) {
        prevState[notfiticationIndex] = notification;
        return [...prevState];
      }
      return [notification, ...prevState];
    });

    soundAlertRef.current();
  };

  const handleClick = () => {
    setIsOpen((prevState) => !prevState);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const NotificationTicket = ({ children }) => {
    return <div onClick={handleClickAway}>{children}</div>;
  };

  const browserNotification = () => {
    document.title = theme.appName || "...";
    return (
      <>
        <Favicon
          animated={true}
          url={ (theme?.appLogoFavicon) ? theme.appLogoFavicon : defaultLogoFavicon }
          alertCount={notifications.length}
          iconSize={195}
        />
      </>
    );
  };

  return <>
    {browserNotification()}
    <IconButton
      onClick={handleClick}
      ref={anchorEl}
      aria-label="Mostrar Notificações"
      variant="contained"
      size="large">
        <WhatsAppIcon style={{ color: "white" }} />
      {notifications.length > 0 ?<Badge variant="dot" color="secondary"
      style={{marginTop: "-25px"}}>
      </Badge>: ""}
    </IconButton>
    <Popover
      disableScrollLock
      open={isOpen}
      anchorEl={anchorEl.current}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      classes={{ paper: classes.popoverPaper }}
      onClose={handleClickAway}
    >
      <List dense className={classes.tabContainer}>
        {notifications.length === 0 ? (
          <ListItem>
            <ListItemText>{i18n.t("notifications.noTickets")}</ListItemText>
          </ListItem>
        ) : (
          notifications.map((ticket) => (
            <NotificationTicket key={ticket.id}>
              <TicketListItem ticket={ticket} />
            </NotificationTicket>
          ))
        )}
      </List>
    </Popover>
  </>;
};

export default NotificationsPopOver;