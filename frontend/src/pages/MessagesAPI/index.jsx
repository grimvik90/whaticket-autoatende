import React, { useState } from "react";
import axios from "axios";
import makeStyles from "@mui/styles/makeStyles";
import Paper from "@mui/material/Paper";
import { i18n } from "../../translate/i18n";
import {
  Button,
  CircularProgress,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useFormik } from "formik";
import toastError from "../../errors/toastError";
import { toast } from "react-toastify";
import { BodyStyled, FormDataStyled } from "./styles";

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(2),
    paddingBottom: 100,
  },
  mainHeader: {
    marginTop: theme.spacing(1),
  },
  elementMargin: {
    marginTop: theme.spacing(2),
  },
  formContainer: {
    maxWidth: 500,
  },
  textRight: {
    textAlign: "right",
  },
}));

const MessagesAPI = () => {
  const classes = useStyles();
  const [file, setFile] = useState({});

  const handleRequest = async (values, endpoint, method, data = {}) => {
    const isFormData = data instanceof FormData;
    const headers = {
      Authorization: `Bearer ${values.token}`,
      "Content-Type": isFormData ? "multipart/form-data" : "application/json",
    };

    const options = {
      method,
      url: `${process.env.REACT_APP_BACKEND_URL}${endpoint}`, // Certifique-se de que REACT_APP_BACKEND_URL está correto
      headers,
      data: isFormData ? data : JSON.stringify(data),
    };

    try {
      const response = await axios.request(options);
      toast.success("Request successful");
      return response.data;
    } catch (error) {
      toastError(error);
      return null;
    }
  };

  const renderForm = (initialValues, endpoint, method, fields) => {
    const [file, setFile] = useState(null);

    const formik = useFormik({
      initialValues,
      enableReinitialize: true,
      onSubmit: async (values, actions) => {
        setTimeout(async () => {
          let responseData;
          if (
            endpoint.includes("/send") &&
            fields.some((field) => field.name === "medias")
          ) {
            const firstFile = file || null;
            const data = new FormData();

            data.append("number", values.number);
            data.append("body", values.body);
            data.append("token", values.token);
            data.append("medias", firstFile);

            responseData = await handleRequest(values, endpoint, method, data);
          } else {
            responseData = await handleRequest(
              values,
              endpoint,
              method,
              values
            );
          }

          if (responseData) {
            toast.success(`Response: ${JSON.stringify(responseData)}`);
          }

          actions.setSubmitting(false);
          actions.resetForm();
        }, 400);
      },
    });

    const handleFileChange = (e) => {
      if (endpoint.includes("/upload")) {
        setFile(e.target.files); // Para múltiplos arquivos
      } else {
        setFile(e.target.files[0]); // Para um único arquivo
      }
    };

    return (
      <form className={classes.formContainer} onSubmit={formik.handleSubmit}>
        <Grid container spacing={2}>
          {fields.map((field, index) => (
            <>
              {field.name !== "medias" &&
                (field.name !== "file" && (
                  <Grid item xs={12} md={6} key={index}>
                    <TextField
                      label={i18n.t(`messagesAPI.${field.name}`)}
                      name={field.name}
                      variant="outlined"
                      margin="dense"
                      fullWidth
                      value={formik.values[field.name]}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched[field.name] &&
                        Boolean(formik.errors[field.name])
                      }
                      helperText={
                        formik.touched[field.name] && formik.errors[field.name]
                      }
                    />
                  </Grid>
                ))}
            </>
          ))}
          {fields.some(
            (field) => field.name === "medias" || field.name === "file"
          ) && (
            <Grid item xs={12}>
              <input
                type="file"
                name={endpoint.includes("/upload") ? "file" : "medias"}
                id={endpoint.includes("/upload") ? "file" : "medias"}
                multiple={endpoint.includes("/upload")}
                onChange={handleFileChange}
              />
            </Grid>
          )}
          <Grid item xs={12} className={classes.textRight}>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              className={classes.btnWrapper}
            >
              {formik.isSubmitting ? (
                <CircularProgress
                  size={24}
                  className={classes.buttonProgress}
                />
              ) : (
                i18n.t("messagesAPI.buttons.submit")
              )}
            </Button>
          </Grid>
        </Grid>
      </form>
    );
  };

  const apiRoutes = [
    {
      endpoint: "/api/messages/send",
      method: "POST",
      hasMedia: true,
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "number",
          description: "Número do destinatário (incluindo o código do país)",
        },
        { name: "body", description: "Conteúdo da mensagem" },
        {
          name: "medias",
          description: "Arquivos de mídia para enviar (opcional)",
          required: false,
        },
      ],
      description: "Enviar mensagem de texto. Pode incluir arquivos de mídia.",
    },
    {
      endpoint: "/api/messages/send/linkPdf",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "number",
          description: "Número do destinatário (incluindo o código do país)",
        },
        { name: "body", description: "Conteúdo da mensagem" },
        { name: "pdfLink", description: "URL do PDF a ser enviado" },
      ],
      description: "Enviar um link para um PDF.",
    },
    {
      endpoint: "/api/messages/send/linkImage",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "number",
          description: "Número do destinatário (incluindo o código do país)",
        },
        { name: "body", description: "Conteúdo da mensagem" },
        { name: "imageLink", description: "URL da imagem a ser enviada" },
      ],
      description: "Enviar um link para uma imagem.",
    },
    {
      endpoint: "/api/messages/send/linkAudio",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "number",
          description: "Número do destinatário (incluindo o código do país)",
        },
        { name: "body", description: "Conteúdo da mensagem" },
        { name: "audioLink", description: "URL do áudio a ser enviado" },
      ],
      description: "Enviar um link para um áudio.",
    },
    {
      endpoint: "/api/messages/checkNumber",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "number",
          description: "Número a ser verificado (incluindo o código do país)",
        },
      ],
      description: "Verificar a validade de um número.",
    },
    {
      endpoint: "/api/ticket/QueueUpdate/:ticketId",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "ticketId", description: "ID do ticket a ser atualizado" },
        { name: "queue", description: "ID da nova fila para o ticket" },
      ],
      description: "Atualizar a fila de um ticket.",
    },
    {
      endpoint: "/api/ticket/close/:ticketId",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "ticketId", description: "ID do ticket a ser fechado" },
      ],
      description: "Fechar um ticket.",
    },
    {
      endpoint: "/api/ticket/TagUpdate",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "ticketId", description: "ID do ticket a ser atualizado" },
        {
          name: "tags",
          description: "Lista de tags a serem adicionadas ao ticket",
        },
      ],
      description: "Atualizar as tags de um ticket.",
    },
    {
      endpoint: "/api/ticket/TagRemove",
      method: "DELETE",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "ticketId",
          description: "ID do ticket do qual a tag será removida",
        },
        { name: "tagId", description: "ID da tag a ser removida" },
      ],
      description: "Remover uma tag de um ticket.",
    },
    {
      endpoint: "/api/ticket/ListTickets",
      method: "GET",
      fields: [{ name: "token", description: "Token de API" }],
      description: "Listar todos os tickets de uma empresa.",
    },
    {
      endpoint: "/api/ticket/ListByTag/:tagId",
      method: "GET",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "tagId", description: "ID da tag para filtrar os tickets" },
      ],
      description: "Listar tickets filtrados por uma tag específica.",
    },
    {
      endpoint: "/api/invoices",
      method: "GET",
      fields: [{ name: "token", description: "Token de API" }],
      description: "Listar todas as faturas.",
    },
    {
      endpoint: "/api/invoices/:invoiceId",
      method: "GET",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "invoiceId", description: "ID da fatura a ser exibida" },
      ],
      description: "Obter detalhes de uma fatura específica por ID.",
    },
    {
      endpoint: "/api/invoices/listByCompany",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "companyId",
          description: "ID da empresa para listar as faturas",
        },
      ],
      description: "Listar faturas por ID da empresa.",
    },
    {
      endpoint: "/api/invoices/:id",
      method: "PUT",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "id", description: "ID da fatura a ser atualizada" },
        {
          name: "updateFields",
          description: "Campos a serem atualizados na fatura",
        },
      ],
      description: "Atualizar os detalhes de uma fatura.",
    },
    {
      endpoint: "/api/contacts",
      method: "GET",
      fields: [{ name: "token", description: "Token de API" }],
      description: "Listar todos os contatos da empresa.",
    },
    {
      endpoint: "/api/contacts/list",
      method: "GET",
      fields: [{ name: "token", description: "Token de API" }],
      description: "Listar contatos com paginação e pesquisa.",
    },
    {
      endpoint: "/api/contacts/:contactId",
      method: "GET",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "contactId", description: "ID do contato a ser exibido" },
      ],
      description: "Mostrar detalhes de um contato por ID.",
    },
    {
      endpoint: "/api/contacts/findOrCreate",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "contactData",
          description: "Dados do contato para encontrar ou criar",
        },
      ],
      description: "Encontrar um contato existente ou criar um novo.",
    },
    {
      endpoint: "/api/contacts",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "contactData", description: "Dados do novo contato" },
      ],
      description: "Criar um novo contato.",
    },
    {
      endpoint: "/api/contacts/:contactId",
      method: "PUT",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "contactId", description: "ID do contato a ser atualizado" },
        { name: "updateData", description: "Dados atualizados do contato" },
      ],
      description: "Atualizar os dados de um contato existente.",
    },
    {
      endpoint: "/api/contacts/:contactId",
      method: "DELETE",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "contactId", description: "ID do contato a ser removido" },
      ],
      description: "Remover um contato por ID.",
    },
    {
      endpoint: "/api/contacts/toggleDisableBot/:contactId",
      method: "PUT",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "contactId",
          description: "ID do contato para ativar/desativar bot",
        },
      ],
      description: "Ativar ou desativar o bot para um contato específico.",
    },
    {
      endpoint: "/api/contacts",
      method: "DELETE",
      fields: [{ name: "token", description: "Token de API" }],
      description: "Remover todos os contatos da empresa.",
    },
    {
      endpoint: "/api/contacts/upload",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "file",
          description: "Arquivo de contatos para upload (XLS ou CSV)",
        },
      ],
      description: "Enviar um arquivo com contatos para upload.",
    },
    {
      endpoint: "/api/company/new",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        {
          name: "insertData",
          description: "Dados da empresa a serem atualizados",
        },
      ],
      description: "Criar nova empresa.",
    },
    {
      endpoint: "/api/company/edit/:id",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "id", description: "Código da empresa" },
        {
          name: "updateData",
          description: "Dados da empresa a serem atualizados",
        },
      ],
      description: "Editar uma empresa.",
    },
    {
      endpoint: "/api/company/block/:id",
      method: "POST",
      fields: [
        { name: "token", description: "Token de API" },
        { name: "id", description: "Código da empresa" },
        { name: "status", description: "Status ativo ou inativo" },
      ],
      description: "Bloquear uma empresa.",
    },
  ];

  return (
    <Paper className={classes.mainPaper} variant="outlined">
      <Typography variant="h5">{i18n.t("messagesAPI.doc")}</Typography>

      <Typography
        variant="h6"
        color="primary"
        className={classes.elementMargin}
      >
        {i18n.t("messagesAPI.formMethod")}
      </Typography>
      <Typography component="div">
        <ol>
          {apiRoutes.map((route, index) => (
            <li key={index}>{route.description}</li>
          ))}
        </ol>
      </Typography>
      <Typography
        variant="h6"
        color="primary"
        className={classes.elementMargin}
      >
        {i18n.t("messagesAPI.helpTexts.instructions")}
      </Typography>
      <Typography className={classes.elementMargin} component="div">
        <b>{i18n.t("messagesAPI.helpTexts.notes.title")}</b>
        <ul>
          <li>{i18n.t("messagesAPI.helpTexts.notes.textA")}</li>
          <li>
            {i18n.t("messagesAPI.helpTexts.notes.textB.title")}
            <ul>
              <li>{i18n.t("messagesAPI.helpTexts.notes.textB.partA")}</li>
              <li>{i18n.t("messagesAPI.helpTexts.notes.textB.partB")}</li>
              <li>{i18n.t("messagesAPI.helpTexts.notes.textB.partC")}</li>
            </ul>
          </li>
        </ul>
      </Typography>
      {apiRoutes.map((route, index) => (
        <React.Fragment key={index}>
          <Typography
            variant="h6"
            color="primary"
            className={classes.elementMargin}
          >
            {index + 1}. {route.description}
          </Typography>
          <Grid container>
            <Grid item xs={12} sm={6}>
              <Typography className={classes.elementMargin} component="div">
                <p>
                  {i18n.t("messagesAPI.helpTexts.info")} {route.description}
                </p>
                <b>{i18n.t("messagesAPI.helpTexts.endpoint")} </b>{" "}
                {process.env.REACT_APP_BACKEND_URL + route.endpoint} <br />
                <b>{i18n.t("messagesAPI.helpTexts.method")} </b> {route.method}{" "}
                <br />
                <b>{i18n.t("messagesAPI.helpTexts.headers")} </b> Authorization:
                Bearer (token cadastrado) <br />
                {route.method === "POST" || route.method === "PUT" ? (
                  <span>Content-Type: application/json</span>
                ) : (
                  <span>Content-Type: multipart/form-data</span>
                )}
                <br />
                <b>
                  {route.hasMedia
                    ? i18n.t("messagesAPI.helpTexts.mediaMsg.formData")
                    : i18n.t("messagesAPI.helpTexts.body")}{" "}
                </b>
                {!route?.hasMedia && (
                  <>
                    {"{"}
                    <BodyStyled>
                      {route.fields.map((field) => (
                        <div>
                          <b>"{field.name}":</b>{" "}
                          <span>"{field.description}"</span>
                        </div>
                      ))}
                    </BodyStyled>
                    {"}"}
                  </>
                )}
                {route?.hasMedia && (
                  <FormDataStyled>
                    {route.fields.map((field) => (
                      <li>
                        <b>{field.name}:</b> <span>{field.description}</span>
                      </li>
                    ))}
                  </FormDataStyled>
                )}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography className={classes.elementMargin}>
                <b>{i18n.t("messagesAPI.helpTexts.test")}</b>
              </Typography>
              {renderForm(
                route.fields.reduce(
                  (acc, field) => ({ ...acc, [field.name]: "" }),
                  {}
                ),
                route.endpoint,
                route.method,
                route.fields
              )}
            </Grid>
          </Grid>
        </React.Fragment>
      ))}
    </Paper>
  );
};

export default MessagesAPI;
