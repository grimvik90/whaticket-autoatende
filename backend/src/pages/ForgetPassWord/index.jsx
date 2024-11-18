import React, {useState} from "react";
import qs from "query-string";
import IconButton from "@mui/material/IconButton";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import InputAdornment from "@mui/material/InputAdornment";
import * as Yup from "yup";
import {useHistory} from "react-router-dom";
import {Link as RouterLink} from "react-router-dom";
import {Formik, Form, Field} from "formik";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import makeStyles from '@mui/styles/makeStyles';
import Container from "@mui/material/Container";
import api from "../../services/api";
import {i18n} from "../../translate/i18n";
import moment from "moment";
import {toast} from 'react-toastify';
import toastError from '../../errors/toastError';
import 'react-toastify/dist/ReactToastify.css';
import {BrowserRouter as Router, Route, Switch} from "react-router-dom";
import "./style.css";

const useStyles = makeStyles((theme) => ({
    root: {
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
    },
    paper: {
        backgroundColor: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "55px 30px",
        borderRadius: "12.5px",
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: "80%", // Fix IE 11 issue.
        marginTop: theme.spacing(1),
        paddingTop: "20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
    },
    submit: {
        "&.MuiButton-root": {
            margin: "20px 0px 16px",
        },

        margin: theme.spacing(3, 0, 2),
        width: "100%",
    },
    loginBox: {
        paddingRight: '0.75rem',
        paddingLeft: '0.75rem',
    },
    logoImg: {
        width: "75%",
        margin: "0 auto",
        content: "url(" + (theme.mode === "light" ? theme.calculatedLogoLight() : theme.calculatedLogoDark()) + ")"
    },
    gap: {
        gap: '2rem'
    },
    powered: {
        color: "white",
    },
}));

const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

const ForgetPassword = () => {
    const theme = useTheme();
    const classes = useStyles();
    const history = useHistory();
  
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [showResetPasswordButton, setShowResetPasswordButton] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState("");
  
    // Toggle para visibilidade da senha
    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };
  
    const toggleConfirmPasswordVisibility = () => {
      setShowConfirmPassword(!showConfirmPassword);
    };
  
    // Toggle para mostrar campos adicionais
    const toggleAdditionalFields = () => {
      setShowAdditionalFields(!showAdditionalFields);
      if (showAdditionalFields) {
        setShowResetPasswordButton(false);
      } else {
        setShowResetPasswordButton(true);
      }
    };
  
    // Obtenção do companyId dos parâmetros da URL
    const params = qs.parse(window.location.search);
    let companyId = null;
    if (params.companyId !== undefined) {
      companyId = params.companyId;
    }
  
    const initialState = { email: "" };
    const [user] = useState(initialState);
  
    // Função para enviar email de recuperação de senha
    const handleSendEmail = async (values) => {
      const email = values.email;
      try {
        const response = await api.post(
          `${process.env.REACT_APP_BACKEND_URL}/forgetpassword/${email}`
        );
        console.log("API Response:", response.data);
  
        if (response.data.status === 404) {
          toastError(i18n.t("resetpswd.error"));
        } else {
          toast(i18n.t("resetpswd.success"));
        }
        history.push("/");
      } catch (err) {
        console.log("API Error:", err);
        toastError(err.message);
      }
    };
  
    // Função para resetar a senha
    const handleResetPassword = async (values) => {
      const { email, token, newPassword, confirmPassword } = values;
  
      if (newPassword === confirmPassword) {
        try {
          await api.post(
            `${process.env.REACT_APP_BACKEND_URL}/resetpasswords/${email}/${token}/${newPassword}`
          );
          setError("");
          toast(i18n.t("resetpswd.success"));
          history.push("/");
        } catch (err) {
          console.log("API Error:", err);
          toastError(err.message);
        }
      } else {
        setError("As senhas não correspondem");
      }
    };
  
    const isResetPasswordButtonClicked = showResetPasswordButton;
  
    // Validação com Yup
    const UserSchema = Yup.object().shape({
      email: Yup.string().email("Email inválido").required("Campo obrigatório"),
      newPassword: isResetPasswordButtonClicked
        ? Yup.string()
            .required("Campo obrigatório")
            .matches(
              passwordRegex,
              "Sua senha precisa ter no mínimo 8 caracteres, sendo uma letra maiúscula, uma minúscula e um número."
            )
        : Yup.string(),
      confirmPassword: Yup.string().when("newPassword", {
        is: (newPassword) => isResetPasswordButtonClicked && newPassword,
        then: Yup.string()
          .oneOf([Yup.ref("newPassword"), null], "As senhas não correspondem")
          .required("Campo obrigatório"),
      }),
    });
  
    return (
      <div className={classes.root}>
        <CssBaseline />
        <Grid className={classes.gap} container alignItems="center" direction="column">
          <Grid item xs={12}>
            <div className="container-img">
              <img className={classes.logoImg} alt="Logo" />
            </div>
          </Grid>
          <Grid item xs={12} className={classes.loginBox}>
            <div className="box">
              <div className="container-header-box">
                <span
                  className="label-text"
                  style={{
                    textDecoration: "none",
                    backgroundColor: theme.palette.primary.main,
                    fontSize: "15px",
                    borderRadius: "30px",
                    padding: "8px",
                    WebkitTextFillColor: theme.palette.primary.contrastText,
                  }}
                >
                  {i18n.t("resetpswd.title2")}
                </span>
              </div>
              <Formik
                initialValues={{
                  email: "",
                  token: "",
                  newPassword: "",
                  confirmPassword: "",
                }}
                validationSchema={UserSchema}
                onSubmit={(values, actions) => {
                  setTimeout(() => {
                    if (showResetPasswordButton) {
                      handleResetPassword(values);
                    } else {
                      handleSendEmail(values);
                    }
                    actions.setSubmitting(false);
                    toggleAdditionalFields();
                  }, 400);
                }}
              >
                {({ touched, errors, isSubmitting }) => (
                  <Form className={classes.form}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Field
                          as={TextField}
                          variant="outlined"
                          margin="dense"
                          fullWidth
                          id="email"
                          label={i18n.t("signup.form.email")}
                          name="email"
                          error={touched.email && Boolean(errors.email)}
                          helperText={touched.email && errors.email}
                          autoComplete="email"
                          required
                        />
                      </Grid>
                      {showAdditionalFields && (
                        <>
                          <Grid item xs={12}>
                            <Field
                              as={TextField}
                              className={classes.input}
                              variant="outlined"
                              fullWidth
                              id="token"
                              label="Código de Verificação"
                              name="token"
                              error={touched.token && Boolean(errors.token)}
                              helperText={touched.token && errors.token}
                              autoComplete="off"
                              required
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Field
                              as={TextField}
                              className={classes.input}
                              variant="outlined"
                              fullWidth
                              type={showPassword ? "text" : "password"}
                              id="newPassword"
                              label="Nova senha"
                              name="newPassword"
                              error={touched.newPassword && Boolean(errors.newPassword)}
                              helperText={touched.newPassword && errors.newPassword}
                              autoComplete="off"
                              required
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={togglePasswordVisibility} size="large">
                                      {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <Field
                              as={TextField}
                              className={classes.input}
                              variant="outlined"
                              fullWidth
                              type={showConfirmPassword ? "text" : "password"}
                              id="confirmPassword"
                              label="Confirme a senha"
                              name="confirmPassword"
                              error={touched.confirmPassword && Boolean(errors.confirmPassword)}
                              helperText={touched.confirmPassword && errors.confirmPassword}
                              autoComplete="off"
                              required
                              InputProps={{
                                endAdornment: (
                                  <InputAdornment position="end">
                                    <IconButton onClick={toggleConfirmPasswordVisibility} size="large">
                                      {showConfirmPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                    </IconButton>
                                  </InputAdornment>
                                ),
                              }}
                            />
                          </Grid>
                        </>
                      )}
                    </Grid>
                    {showResetPasswordButton ? (
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                      >
                        Redefinir Senha
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                      >
                        Enviar Email
                      </Button>
                    )}
                    <Grid container justifyContent="center">
                      <Grid item>
                        <Link
                          href="#"
                          variant="body2"
                          component={RouterLink}
                          to="/login"
                          style={{ color: theme.palette.secondary.main, fontWeight: 500 }}
                        >
                          {i18n.t("signup.buttons.returlogin")}
                        </Link>
                      </Grid>
                    </Grid>
                    {error && (
                      <Typography variant="body2" color="error">
                        {error}
                      </Typography>
                    )}
                  </Form>
                )}
              </Formik>
            </div>
          </Grid>
        </Grid>
      </div>
    );
  };

export default ForgetPassword;
  