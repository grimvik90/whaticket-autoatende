import React, { useState, useEffect, useContext } from "react";

import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { toast } from "react-toastify";

import makeStyles from '@mui/styles/makeStyles';
import { green } from "@mui/material/colors";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import { Colorize } from "@mui/icons-material";
import { ColorBox } from 'mui-color';
import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { IconButton, InputAdornment } from "@mui/material";
import { FormControlLabel, Switch } from '@mui/material';
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import Checkbox from '@mui/material/Checkbox';

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		flexWrap: "wrap",
	},
	multFieldLine: {
		display: "flex",
		"& > *:not(:last-child)": {
			marginRight: theme.spacing(1),
		},
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

const TagSchema = Yup.object().shape({
	name: Yup.string()
		.min(3, "Mensagem muito curta")
		.required("Obrigatório")
});

const TagModal = ({ open, onClose, tagId, reload }) => {
	const classes = useStyles();
	const { user } = useContext(AuthContext);
	const [colorPickerModalOpen, setColorPickerModalOpen] = useState(false);

	const initialState = {
		name: "",
		color: "",
		kanban: 0
	};

	const [tag, setTag] = useState(initialState);
	const [ kanban, setKanban] = useState(0);

	useEffect(() => {
		try {
			(async () => {
				if (!tagId) return;

				const { data } = await api.get(`/tags/${tagId}`);
				setKanban(data.kanban);
				setTag(prevState => {
					return { ...prevState, ...data };
				});
			})()
		} catch (err) {
			toastError(err);
		}
	}, [tagId, open]);

	const handleClose = () => {
		setTag(initialState);
		setColorPickerModalOpen(false);
		onClose();
	};

	const handleKanbanChange = (e) => {
		setKanban( e.target.checked ? 1 : 0);
	};

	const handleSaveTag = async values => {
		const tagData = { ...values, userId: user.id, kanban };
		try {
			if (tagId) {
				await api.put(`/tags/${tagId}`, tagData);
			} else {
				await api.post("/tags", tagData);
			}
			toast.success(i18n.t("tagModal.success"));
			if (typeof reload == 'function') {
				reload();
			}
		} catch (err) {
			toastError(err);
		}
		handleClose();
	};

	return (
		<div className={classes.root}>
			<Dialog
				open={open}
				onClose={handleClose}
				maxWidth="xs"
				fullWidth
				scroll="paper"
			>
				<DialogTitle id="form-dialog-title">
					{(tagId ? `${i18n.t("tagModal.title.edit")}` : `${i18n.t("tagModal.title.add")}`)}
				</DialogTitle>
				<Formik
					initialValues={tag}
					enableReinitialize={true}
					validationSchema={TagSchema}
					onSubmit={(values, actions) => {
						setTimeout(() => {
							handleSaveTag(values);
							actions.setSubmitting(false);
						}, 400);
					}}
				>
					{({ touched, errors, isSubmitting, values }) => (
						<Form>
							<DialogContent dividers>
								<div className={classes.multFieldLine}>
									<Field
										as={TextField}
										label={i18n.t("tagModal.form.name")}
										name="name"
										error={touched.name && Boolean(errors.name)}
										helperText={touched.name && errors.name}
										variant="outlined"
										margin="dense"
										onChange={(e) => setTag(prev => ({ ...prev, name: e.target.value }))}
										fullWidth
									/>
								</div>
								<br />
								<div className={classes.multFieldLine}>
									<Field
										as={TextField}
										fullWidth
										label={i18n.t("tagModal.form.color")}
										name="color"
										id="color"
										error={touched.color && Boolean(errors.color)}
										helperText={touched.color && errors.color}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<div
														style={{ backgroundColor: values.color }}
														className={classes.colorAdorment}
													></div>
												</InputAdornment>
											),
											endAdornment: (
												<IconButton
													size="small"
													color="default"
													onClick={() => setColorPickerModalOpen(!colorPickerModalOpen)}
												>
													<Colorize />
												</IconButton>
											),
										}}
										variant="outlined"
										margin="dense"
									/>
								</div>
								{(user.profile === "admin" || user.profile === "supervisor") && (
                                <>
								<div className={classes.multFieldLine}>
        							<FormControlLabel
          								control={
            								<Checkbox
             									checked={kanban === 1}
             									onChange={handleKanbanChange}
              									value={kanban}
              									color="primary"
            								/>
          								}
          								label="Kanban"
          								labelPlacement="start"
        							/>
      							</div>
      							<br />
                                </>
								)}
								{colorPickerModalOpen && (
									<div>
										<ColorBox
											disableAlpha={true}
											hslGradient={false}
											style={{ margin: '20px auto 0' }}
											value={tag.color}
											onChange={val => {
												setTag(prev => ({ ...prev, color: `#${val.hex}` }));
											}}
										/>
									</div>
								)}
							</DialogContent>
							<DialogActions>
								<Button
									onClick={handleClose}
									color="secondary"
									disabled={isSubmitting}
									variant="outlined"
								>
									{i18n.t("tagModal.buttons.cancel")}
								</Button>
								<Button
									type="submit"
									color="primary"
									disabled={isSubmitting}
									variant="contained"
									className={classes.btnWrapper}
								>
									{tagId
										? `${i18n.t("tagModal.buttons.okEdit")}`
										: `${i18n.t("tagModal.buttons.okAdd")}`}
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
			</Dialog>
		</div>
	);
};

export default TagModal;
