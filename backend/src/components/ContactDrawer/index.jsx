import React, { useEffect, useState, useContext } from "react";
import api from "../../services/api";

import makeStyles from '@mui/styles/makeStyles';
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/KeyboardTab";
import Drawer from "@mui/material/Drawer";
import Link from "@mui/material/Link";
import InputLabel from "@mui/material/InputLabel";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import CreateIcon from '@mui/icons-material/Create';

import { i18n } from "../../translate/i18n";

import ContactDrawerSkeleton from "../ContactDrawerSkeleton";
import MarkdownWrapper from "../MarkdownWrapper";
import { CardHeader, Switch } from "@mui/material";
import { ContactForm } from "../ContactForm";
import ContactModal from "../ContactModal";
import { ContactNotes } from "../ContactNotes";
import { generateColor } from "../../helpers/colorGenerator";
import { getInitials } from "../../helpers/getInitials";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import Tooltip from '@mui/material/Tooltip';

const drawerWidth = 320;

const useStyles = makeStyles(theme => ({
	drawer: {
		width: drawerWidth,
		flexShrink: 0,
	},
	drawerPaper: {
		width: drawerWidth,
		display: "flex",
		borderTop: "1px solid rgba(0, 0, 0, 0.12)",
		borderRight: "1px solid rgba(0, 0, 0, 0.12)",
		borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
		borderTopRightRadius: 4,
		borderBottomRightRadius: 4,
	},
	header: {
		display: "flex",
		borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
		backgroundColor: theme.palette.contactdrawer,
		alignItems: "center",
		padding: theme.spacing(0, 1),
		minHeight: "73px",
		justifyContent: "flex-start",
	},
	content: {
		display: "flex",
		backgroundColor: theme.palette.contactdrawer,
		flexDirection: "column",
		padding: "8px 0px 8px 8px",
		height: "100%",
		overflowY: "scroll",
		...theme.scrollbarStyles,
	},

	contactAvatar: {
		margin: 15,
		width: 100,
		height: 100,
	},

	contactHeader: {
		display: "flex",
		padding: 8,
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		"& > *": {
			margin: 4,
		},
	},

	contactDetails: {
		marginTop: 8,
		padding: 8,
		display: "flex",
		flexDirection: "column",
	},
	contactExtraInfo: {
		marginTop: 4,
		padding: 6,
	},
}));

const ContactDrawer = ({ open, handleDrawerClose, contact, ticket, loading }) => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);

	const [modalOpen, setModalOpen] = useState(false);
	const [openForm, setOpenForm] = useState(false);
	const [disableBot, setDisableBot] = useState(contact.disableBot);

	useEffect(() => {
		setOpenForm(false);
		setDisableBot(contact.disableBot)
	}, [open, contact]);

	const handleContactToggleDisableBot = async () => {

		const { id } = contact;

		try {
			const { data } = await api.put(`/contacts/toggleDisableBot/${id}`);
			contact.disableBot = data.disableBot;
			setDisableBot(data.disableBot)

		} catch (err) {
			toastError(err);
		}
	};

	return <>
        <Drawer
            className={classes.drawer}
            variant="persistent"
            anchor="right"
            open={open}
            PaperProps={{ style: { position: "absolute" } }}
            BackdropProps={{ style: { position: "absolute" } }}
            ModalProps={{
                container: document.getElementById("drawer-container"),
                style: { position: "absolute" },
            }}
            classes={{
                paper: classes.drawerPaper,
            }}
        >
            <div className={classes.header}>
                <IconButton onClick={handleDrawerClose} size="large">
                <Tooltip title={i18n.t("contactDrawer.closeMenu")}>
                    <CloseIcon />
                </Tooltip>
                </IconButton>
                <Typography style={{ justifySelf: "center" }}>
                    {i18n.t("contactDrawer.header")}
                </Typography>
            </div>
            {loading ? (
                <ContactDrawerSkeleton classes={classes} />
            ) : (
                <div className={classes.content}>
                    <Paper square variant="outlined" className={classes.contactHeader}>
                    <Avatar
                        imgProps={{loading: "lazy"}}
                        src={contact.profilePicUrl} alt="contact_image" style={{ width: 60, height: 60, backgroundColor: generateColor(contact?.number), color: "white", fontWeight: "bold" }}>{ getInitials(contact?.name) }</Avatar>
                        <CardHeader
                            onClick={() => {}}
                            style={{ cursor: "pointer", width: '100%', textAlign: "center" }}
                            titleTypographyProps={{ noWrap: true }}
                            subheaderTypographyProps={{ noWrap: true }}
                            //avatar={<Avatar src={contact.profilePicUrl} alt="contact_image" style={{ width: 60, height: 60 }} />}
                            title={
                                <>
                                    <Typography onClick={() => setOpenForm(true)}>
                                        {contact.name}
                                        <CreateIcon style={{fontSize: 16, marginLeft: 5}} />
                                    </Typography>
                                </>
                            }
                            subheader={
                                <>
                                    <Typography style={{fontSize: 12}}>
                                    <Link href={`tel:${user.isTricked === "enabled" ? contact.number : contact.number.slice(0,-4) + "****"}`}>{user.isTricked === "enabled" ? contact.number : contact.number.slice(0,-4) + "****"}</Link>
                                    </Typography>
                                    <Typography style={{fontSize: 12}}>
                                        <Link href={`mailto:${contact.email}`}>{contact.email}</Link>
                                    </Typography>
                                </>
                            }
                        />
                        <Button
                            variant="outlined"
                            color="primary"
                            onClick={() => setModalOpen(!openForm)}
                            style={{fontSize: 12}}
                        >
                            {i18n.t("contactDrawer.buttons.edit")}
                        </Button>
                        {(contact.id && openForm) && <ContactForm initialContact={contact} onCancel={() => setOpenForm(false)} />}
                    </Paper>
                    <Paper square variant="outlined" className={classes.contactDetails}>
                        <Typography variant="subtitle1" style={{marginBottom: 10}}>
                            {i18n.t("ticketOptionsMenu.appointmentsModal.title")}
                        </Typography>
                        <ContactNotes ticket={ticket} />
                    </Paper>
                    <Paper square variant="outlined" className={classes.contactDetails}>
                        <ContactModal
                            open={modalOpen}
                            onClose={() => setModalOpen(false)}
                            contactId={contact.id}
                        ></ContactModal>
                        <Typography variant="subtitle1">
                            {i18n.t("contactDrawer.extraInfo")}
                        </Typography>
                        {contact?.extraInfo?.map(info => (
                            <Paper
                                key={info.id}
                                square
                                variant="outlined"
                                className={classes.contactExtraInfo}
                            >
                                <InputLabel>{info.name}</InputLabel>
                                <Typography component="div" noWrap style={{ paddingTop: 2 }}>
                                    <MarkdownWrapper>{info.value}</MarkdownWrapper>
                                </Typography>
                            </Paper>
                        ))}
                    </Paper>
                    <Paper square variant="outlined" className={classes.contactDetails}>
                        <Typography
                            style={{ marginBottom: 8, marginTop: 12 }}
                            variant="subtitle1"
                        >
                            <Switch
                                size="small"
                                checked={disableBot}
                                onChange={() => handleContactToggleDisableBot()}
                                name="disableBot"
                                color="primary"
                            />
                                {i18n.t("contactModal.form.disableBot")}
                        </Typography>
                    </Paper>
                </div>
            )}
        </Drawer>
    </>;
};

export default ContactDrawer;