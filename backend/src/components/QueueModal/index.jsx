import React, {useState, useEffect, useRef} from "react";

import * as Yup from "yup";
import {Formik, Form, Field} from "formik";
import {toast} from "react-toastify";
import {head} from "lodash";

import makeStyles from '@mui/styles/makeStyles';
import {green} from "@mui/material/colors";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";

import {i18n} from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import ColorPicker from "../ColorPicker";
import MessageVariablesPicker from "../MessageVariablesPicker";

import {
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    MenuItem,
    Paper,
    Select, Switch,
    Tab,
    Tabs,
} from "@mui/material";
import {AttachFile, Colorize, DeleteOutline} from "@mui/icons-material";
import {QueueOptions} from "../QueueOptions";
import SchedulesForm from "../SchedulesForm";
import ConfirmationModal from "../ConfirmationModal";
import useSettings from "../../hooks/useSettings";

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    textField: {
        marginRight: theme.spacing(1),
        flex: 1,
    },

    btnWrapper: {
        position: "relative",
    },

    buttonProgress: {
        color: green[500],
        position: "absolute",
        top: "50%",
        left: "50%",
        marginTop: -12,
        marginLeft: -12,
    },
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
    colorAdorment: {
        width: 20,
        height: 20,
    },
}));

const QueueSchema = Yup.object().shape({
    name: Yup.string()
        .min(2, "Too Short!")
        .max(50, "Too Long!")
        .required("Required"),
    color: Yup.string().min(3, "Too Short!").max(9, "Too Long!").required(),
    greetingMessage: Yup.string(),
});

const QueueModal = ({open, onClose, queueId}) => {
    const classes = useStyles();

    const initialState = {
        name: "",
        color: "",
        greetingMessage: "",
        outOfHoursMessage: "",
        keywords: "",
        newTicketOnTransfer: false,
        orderQueue: "",
        integrationId: "",
        promptId: ""
    };

    const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);
    const [queue, setQueue] = useState(initialState);
    const [tab, setTab] = useState(0);
    const [schedulesEnabled, setSchedulesEnabled] = useState(false);
    const greetingRef = useRef();
    const [integrations, setIntegrations] = useState([]);
    const [attachment, setAttachment] = useState(null);
    const attachmentFile = useRef(null);
    const [queueEditable, setQueueEditable] = useState(true);
    const [confirmationOpen, setConfirmationOpen] = useState(false);

    const [schedules, setSchedules] = useState([
        {
            weekday: i18n.t("daysweek.day1"), weekdayEn: "monday", startTime: "08:00", endTime: "18:00",
            startLunchTime: "", endLunchTime: "",
        },
        {
            weekday: i18n.t("daysweek.day2"), weekdayEn: "tuesday", startTime: "08:00", endTime: "18:00",
            startLunchTime: "", endLunchTime: "",
        },
        {
            weekday: i18n.t("daysweek.day3"),
            weekdayEn: "wednesday",
            startTime: "08:00",
            endTime: "18:00",
            startLunchTime: "",
            endLunchTime: "",
        },
        {
            weekday: i18n.t("daysweek.day4"),
            weekdayEn: "thursday",
            startTime: "08:00",
            endTime: "18:00",
            startLunchTime: "",
            endLunchTime: "",
        },
        {
            weekday: i18n.t("daysweek.day5"),
            weekdayEn: "friday",
            startTime: "08:00",
            endTime: "18:00",
            startLunchTime: "",
            endLunchTime: "",
        },
        {
            weekday: i18n.t("daysweek.day6"),
            weekdayEn: "saturday",
            startTime: "08:00",
            endTime: "12:00",
            startLunchTime: "",
            endLunchTime: "",
        },
        {
            weekday: i18n.t("daysweek.day7"),
            weekdayEn: "sunday",
            startTime: "00:00",
            endTime: "00:00",
            startLunchTime: "",
            endLunchTime: "",
        },
    ]);
    const [selectedPrompt, setSelectedPrompt] = useState(null);
    const [prompts, setPrompts] = useState([]);
    const {getCachedSetting} = useSettings();


    useEffect(async () => {
        try {
            const {data} = await api.get("/prompt");
            setPrompts(data.prompts);
        } catch (err) {
            toastError(err);
        }

        const scheduleType = await getCachedSetting("scheduleType");
        if (scheduleType) {
            setSchedulesEnabled(scheduleType.value === "queue");
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const {data} = await api.get("/queueIntegration");

                setIntegrations(data.queueIntegrations);
            } catch (err) {
                toastError(err);
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (!queueId) return;
            try {
                const {data} = await api.get(`/queue/${queueId}`);
                setQueue((prevState) => {
                    return {...prevState, ...data};
                });
                data.promptId ? setSelectedPrompt(data.promptId) : setSelectedPrompt(null);

                setSchedules(data.schedules);
            } catch (err) {
                toastError(err);
            }
        })();

        return () => {
            setQueue({
                name: "",
                color: "",
                newTicketOnTransfer: false,
                greetingMessage: "",
                outOfHoursMessage: "",
                keywords: "",
                orderQueue: "",
                integrationId: ""
            });
        };
    }, [queueId, open]);

    const handleClose = () => {
        onClose();
        setQueue(initialState);
    };

    const handleAttachmentFile = (e) => {
        const file = head(e.target.files);
        if (file) {
            setAttachment(file);
        }
    };

    const deleteMedia = async () => {
        if (attachment) {
            setAttachment(null);
            attachmentFile.current.value = null;
        }

        if (queue.mediaPath) {
            await api.delete(`/queue/${queue.id}/media-upload`);
            setQueue((prev) => ({...prev, mediaPath: null, mediaName: null}));
            toast.success(i18n.t("queueModal.toasts.deleted"));
        }
    };


    const handleSaveQueue = async (values) => {
        try {
            if (queueId) {
                await api.put(`/queue/${queueId}`, {
                    ...values, schedules, promptId: selectedPrompt ? selectedPrompt : null
                });
                if (attachment != null) {
                    const formData = new FormData();
                    formData.append("file", attachment);
                    await api.post(`/queue/${queueId}/media-upload`, formData);
                }
            } else {
                await api.post("/queue", {
                    ...values, schedules, promptId: selectedPrompt ? selectedPrompt : null
                });
                if (attachment != null) {
                    const formData = new FormData();
                    formData.append("file", attachment);
                    await api.post(`/queue/${queueId}/media-upload`, formData);
                }
            }
            toast.success("Queue saved successfully");
            handleClose();
        } catch (err) {
            toastError(err);
        }
    };

    const handleSaveSchedules = async (values) => {
        toast.success("Clique em salvar para registar as alterações");
        setSchedules(values);
        setTab(0);
    };

    const handleChangePrompt = (e) => {
        setSelectedPrompt(e.target.value);
    };

    const handleClickMsgVar = async (msgVar, setFieldValue) => {
        const activeElement = document.activeElement; // Pega o elemento atualmente focado
        const fieldName = activeElement.name; // Supõe que o elemento focado tenha uma propriedade 'name' que corresponda ao nome do campo no Formik

        if (fieldName) {
            const firstHalfText = activeElement.value.substring(0, activeElement.selectionStart);
            const secondHalfText = activeElement.value.substring(activeElement.selectionEnd);
            const newCursorPos = activeElement.selectionStart + msgVar.length;

            setFieldValue(fieldName, `${firstHalfText}${msgVar}${secondHalfText}`);

            await new Promise(r => setTimeout(r, 100));
            activeElement.focus(); // Re-foca no campo ativo
            activeElement.setSelectionRange(newCursorPos, newCursorPos); // Posiciona o cursor corretamente
        }
    };


    return (
        <div className={classes.root}>
            <ConfirmationModal
                title={i18n.t("queueModal.confirmationModal.deleteTitle")}
                open={confirmationOpen}
                onClose={() => setConfirmationOpen(false)}
                onConfirm={deleteMedia}
            >
                {i18n.t("queueModal.confirmationModal.deleteMessage")}
            </ConfirmationModal>
            <Dialog
                maxWidth="md"
                fullWidth={true}
                open={open}
                onClose={handleClose}
                scroll="paper"
            >
                <DialogTitle>
                    {queueId
                        ? `${i18n.t("queueModal.title.edit")}`
                        : `${i18n.t("queueModal.title.add")}`}
                    <div style={{display: "none"}}>
                        <input
                            type="file"
                            ref={attachmentFile}
                            onChange={(e) => handleAttachmentFile(e)}
                        />
                    </div>
                </DialogTitle>
                <Tabs
                    value={tab}
                    indicatorColor="primary"
                    textColor="primary"
                    onChange={(_, v) => setTab(v)}
                    aria-label="disabled tabs example"
                >
                    <Tab label="Dados da Fila"/>
                    {schedulesEnabled && <Tab label="Horários de Atendimento"/>}
                </Tabs>
                {tab === 0 && (
                    <Paper>
                        <Formik
                            initialValues={queue}
                            enableReinitialize={true}
                            validationSchema={QueueSchema}
                            onSubmit={(values, actions) => {
                                setTimeout(async () => {
                                    await handleSaveQueue(values);
                                    actions.setSubmitting(false);
                                }, 400);
                            }}
                        >
                            {({touched, errors, isSubmitting, values, setFieldValue,}) => (
                                <Form>
                                    <DialogContent dividers>
                                        <Field
                                            as={TextField}
                                            label={i18n.t("queueModal.form.name")}
                                            autoFocus
                                            name="name"
                                            error={touched.name && Boolean(errors.name)}
                                            helperText={touched.name && errors.name}
                                            variant="outlined"
                                            margin="dense"
                                            className={classes.textField}
                                        />
                                        <Field
                                            as={TextField}
                                            label={i18n.t("queueModal.form.color")}
                                            name="color"
                                            id="color"
                                            onFocus={() => {
                                                setColorPickerModalOpen(true);
                                                greetingRef.current.focus();
                                            }}
                                            error={touched.color && Boolean(errors.color)}
                                            helperText={touched.color && errors.color}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <div
                                                            style={{backgroundColor: values.color}}
                                                            className={classes.colorAdorment}
                                                        ></div>
                                                    </InputAdornment>
                                                ),
                                                endAdornment: (
                                                    <IconButton
                                                        size="small"
                                                        color="default"
                                                        onClick={() => setColorPickerModalOpen(true)}
                                                    >
                                                        <Colorize/>
                                                    </IconButton>
                                                ),
                                            }}
                                            variant="outlined"
                                            margin="dense"
                                            className={classes.textField}
                                        />
                                        <ColorPicker
                                            open={colorPickerModalOpen}
                                            handleClose={() => setColorPickerModalOpen(false)}
                                            onChange={(color) => {
                                                values.color = color;
                                                setQueue(() => {
                                                    return {...values, color};
                                                });
                                            }}
                                        />
                                        <Field
                                            as={TextField}
                                            label={i18n.t("queueModal.form.orderQueue")}
                                            name="orderQueue"
                                            type="orderQueue"
                                            error={touched.orderQueue && Boolean(errors.orderQueue)}
                                            helperText={touched.orderQueue && errors.orderQueue}
                                            variant="outlined"
                                            margin="dense"
                                            className={classes.textField}
                                        />

                                        <FormControlLabel
                                            control={
                                                <Field
                                                    as={Switch}
                                                    color="primary"
                                                    name="newTicketOnTransfer"
                                                    checked={values.newTicketOnTransfer}
                                                />
                                            }
                                            label={i18n.t("queueModal.form.newTicketOnTransfer")}
                                        />
                                        <div>
                                            <FormControl
                                                variant="outlined"
                                                margin="dense"
                                                className={classes.FormControl}
                                                fullWidth
                                            >
                                                <InputLabel id="integrationId-selection-label">
                                                    {i18n.t("queueModal.form.integrationId")}
                                                </InputLabel>
                                                <Field
                                                    as={Select}
                                                    label={i18n.t("queueModal.form.integrationId")}
                                                    name="integrationId"
                                                    id="integrationId"
                                                    placeholder={i18n.t("queueModal.form.integrationId")}
                                                    labelId="integrationId-selection-label"
                                                    value={values.integrationId || ""}
                                                >
                                                    <MenuItem value={""}>{"Nenhum"}</MenuItem>
                                                    {integrations.map((integration) => (
                                                        <MenuItem key={integration.id} value={integration.id}>
                                                            {integration.name}
                                                        </MenuItem>
                                                    ))}
                                                </Field>

                                            </FormControl>
                                            <FormControl
                                                margin="dense"
                                                variant="outlined"
                                                fullWidth
                                            >
                                                <InputLabel>
                                                    {i18n.t("whatsappModal.form.prompt")}
                                                </InputLabel>
                                                <Select
                                                    labelId="dialog-select-prompt-label"
                                                    id="dialog-select-prompt"
                                                    name="promptId"
                                                    value={selectedPrompt || ""}
                                                    onChange={handleChangePrompt}
                                                    label={i18n.t("whatsappModal.form.prompt")}
                                                    fullWidth
                                                    MenuProps={{
                                                        anchorOrigin: {
                                                            vertical: "bottom",
                                                            horizontal: "left",
                                                        },
                                                        transformOrigin: {
                                                            vertical: "top",
                                                            horizontal: "left",
                                                        },
                                                        getContentAnchorEl: null,
                                                    }}
                                                >
                                                    <MenuItem value={""}>{"Nenhum"}</MenuItem>
                                                    {prompts.map((prompt) => (
                                                        <MenuItem
                                                            key={prompt.id}
                                                            value={prompt.id}
                                                        >
                                                            {prompt.name}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </div>
                                        <div style={{marginTop: 5}}>
                                            <Field
                                                as={TextField}
                                                label={i18n.t("queueModal.form.greetingMessage")}
                                                type="greetingMessage"
                                                multiline
                                                inputRef={greetingRef}
                                                rows={5}
                                                fullWidth
                                                name="greetingMessage"
                                                error={
                                                    touched.greetingMessage &&
                                                    Boolean(errors.greetingMessage)
                                                }
                                                helperText={
                                                    touched.greetingMessage && errors.greetingMessage
                                                }
                                                variant="outlined"
                                                margin="dense"
                                                className={classes.textField}
                                            />
                                            {schedulesEnabled && (
                                                <Field
                                                    as={TextField}
                                                    label={i18n.t("queueModal.form.outOfHoursMessage")}
                                                    type="outOfHoursMessage"
                                                    multiline
                                                    inputRef={greetingRef}
                                                    rows={5}
                                                    fullWidth
                                                    name="outOfHoursMessage"
                                                    error={
                                                        touched.outOfHoursMessage &&
                                                        Boolean(errors.outOfHoursMessage)
                                                    }
                                                    helperText={
                                                        touched.outOfHoursMessage && errors.outOfHoursMessage
                                                    }
                                                    variant="outlined"
                                                    margin="dense"
                                                    className={classes.textField}
                                                />
                                            )}

                                            <Field
                                                as={TextField}
                                                label={i18n.t("queueModal.form.keywords")}
                                                type="keywords"
                                                multiline
                                                inputRef={greetingRef}
                                                rows={3}
                                                fullWidth
                                                name="keywords"
                                                error={
                                                    touched.keywords &&
                                                    Boolean(errors.keywords)
                                                }
                                                helperText={
                                                    touched.keywords && errors.keywords
                                                }
                                                variant="outlined"
                                                margin="dense"
                                                className={classes.textField}
                                            />

                                            <Grid item>
                                                <MessageVariablesPicker
                                                    disabled={isSubmitting}
                                                    onClick={value => handleClickMsgVar(value, setFieldValue)}
                                                />
                                            </Grid>

                                        </div>
                                        <QueueOptions queueId={queueId}/>
                                        {(queue.mediaPath || attachment) && (
                                            <Grid xs={12} item>
                                                <Button startIcon={<AttachFile/>}>
                                                    {attachment != null
                                                        ? attachment.name
                                                        : queue.mediaName}
                                                </Button>
                                                {queueEditable && (
                                                    <IconButton onClick={() => setConfirmationOpen(true)} color="secondary" size="large">
                                                        <DeleteOutline/>
                                                    </IconButton>
                                                )}
                                            </Grid>
                                        )}
                                    </DialogContent>
                                    <DialogActions>
                                        {!attachment && !queue.mediaPath && queueEditable && (
                                            <Button
                                                color="primary"
                                                onClick={() => attachmentFile.current.click()}
                                                disabled={isSubmitting}
                                                variant="outlined"
                                            >
                                                {i18n.t("queueModal.buttons.attach")}
                                            </Button>
                                        )}
                                        <Button
                                            onClick={handleClose}
                                            color="secondary"
                                            disabled={isSubmitting}
                                            variant="outlined"
                                        >
                                            {i18n.t("queueModal.buttons.cancel")}
                                        </Button>
                                        <Button
                                            type="submit"
                                            color="primary"
                                            disabled={isSubmitting}
                                            variant="contained"
                                            className={classes.btnWrapper}
                                        >
                                            {queueId
                                                ? `${i18n.t("queueModal.buttons.okEdit")}`
                                                : `${i18n.t("queueModal.buttons.okAdd")}`}
                                            {isSubmitting && (
                                                <CircularProgress
                                                    size={24}
                                                    className={classes.buttonProgress}
                                                />
                                            )}
                                        </Button>
                                    </DialogActions>
                                </Form>
                            )}
                        </Formik>
                    </Paper>
                )}
                {tab === 1 && (
                    <Paper style={{padding: 20}}>
                        <SchedulesForm
                            loading={false}
                            onSubmit={handleSaveSchedules}
                            initialValues={schedules}
                            labelSaveButton="Adicionar"
                        />
                    </Paper>
                )}
            </Dialog>
        </div>
    );
};

export default QueueModal;