import React, { useEffect, useState, useContext, useRef } from "react";

import Grid from "@mui/material/Grid";
import { i18n } from "../../translate/i18n";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import FormHelperText from "@mui/material/FormHelperText";
import TextField from "@mui/material/TextField";
import Title from "../Title";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import useSettings from "../../hooks/useSettings";
import { ToastContainer, toast } from "react-toastify";
import makeStyles from '@mui/styles/makeStyles';
import { grey, blue } from "@mui/material/colors";
import { Tabs, Tab } from "@mui/material";

import OnlyForSuperUser from "../OnlyForSuperUser";
import useAuth from "../../hooks/useAuth.js";
import { Loop, Delete } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faGears } from "@fortawesome/free-solid-svg-icons";

import { generateSecureToken } from "../../helpers/generateSecureToken";
import { copyToClipboard } from "../../helpers/copyToClipboard";
import { Colorize } from "@mui/icons-material";
import ColorPicker from "../ColorPicker";
import ColorModeContext from "../../layout/themeContext";

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  colorAdorment: {
    width: 20,
    height: 20,
  },
  uploadInput: {
    display: "none",
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  tab: {
    backgroundColor: theme.palette.options,
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: theme.palette.fontecor,
    },
    "& .MuiTabs-flexContainer": {
      justifyContent: "center",
    },
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
}));

export default function Options(props) {
  const { settings, scheduleTypeChanged } = props;
  const classes = useStyles();

  const [userRating, setUserRating] = useState("disabled");
  const [scheduleType, setScheduleType] = useState("disabled");
  const [callType, setCallType] = useState("enabled");
  const [chatbotType, setChatbotType] = useState("");
  const [quickMessages, setQuickMessages] = useState("");
  const [allowSignup, setAllowSignup] = useState("disabled");
  const [CheckMsgIsGroup, setCheckMsgIsGroup] = useState("disabled");
  const [SendGreetingAccepted, setSendGreetingAccepted] = useState("disabled");
  const [SettingsTransfTicket, setSettingsTransfTicket] = useState("disabled");
  const [sendGreetingMessageOneQueues,setSendGreetingMessageOneQueues] = useState("enabled");
  const [showTypeBotInMainMenu, setShowTypeBotInMainMenu] = useState(false);
  const [typeBotIframeUrl, setTypeBotIframeUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [downloadLimit, setDownloadLimit] = useState("64");
  const [openAiModel, setOpenAiModel] = useState("gpt-4o-mini");
  const { getCurrentUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState({});
  // Adicionar os novos estados no início do componente
  const [sendEmailWhenRegister, setSendEmailWhenRegister] = useState("disabled");
  const [sendMessageWhenRegister, setSendMessageWhenRegister] = useState("disabled");
  const [loadingSendEmailWhenRegister,setLoadingSendEmailWhenRegister] = useState(false);
  const [loadingSendMessageWhenRegister,setLoadingSendMessageWhenRegister] = useState(false);
  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);
  const [loadingCallType, setLoadingCallType] = useState(false);
  const [loadingAllowSignup, setLoadingAllowSignup] = useState(false);
  const [loadingChatbotType, setLoadingChatbotType] = useState(false);
  const [loadingCheckMsgIsGroup, setLoadingCheckMsgIsGroup] = useState(false);
  const [loadingApiToken, setLoadingApiToken] = useState(false);
  const [waSuportType, setWaSuportType] = useState("");
  const [loadingWaSuportType, setLoadingWaSuportType] = useState(false);
  const [msgSuportType, setMsgSuportType] = useState("");
  const [loadingMsgSuportType, setLoadingMsgSuportType] = useState(false);
  const [loadingQuickMessages, setLoadingQuickMessages] = useState(false);

  const [ipixcType, setIpIxcType] = useState("");
  const [loadingIpIxcType, setLoadingIpIxcType] = useState(false);
  const [tokenixcType, setTokenIxcType] = useState("");
  const [loadingTokenIxcType, setLoadingTokenIxcType] = useState(false);
  const [ipmkauthType, setIpMkauthType] = useState("");
  const [loadingIpMkauthType, setLoadingIpMkauthType] = useState(false);
  const [clientidmkauthType, setClientIdMkauthType] = useState("");
  const [loadingClientIdMkauthType, setLoadingClientIdMkauthType] = useState(false);
  const [loadingDownloadLimit, setLoadingDownloadLimit] = useState(false);
  const [clientsecretmkauthType, setClientSecrectMkauthType] = useState("");
  const [loadingClientSecrectMkauthType,setLoadingClientSecrectMkauthType] = useState(false);
  const [asaasType, setAsaasType] = useState("");
  const [loadingAsaasType, setLoadingAsaasType] = useState(false);
  const [
    loadingSendGreetingAccepted,
    setLoadingSendGreetingAccepted,
  ] = useState(false);
  const [
    loadingSettingsTransfTicket,
    setLoadingSettingsTransfTicket,
  ] = useState(false);
  const [
    loadingSendGreetingMessageOneQueues,
    setLoadingSendGreetingMessageOneQueues,
  ] = useState(false);

  const [loadingOpenAiModel, setLoadingOpenAiModel] = useState(false);
  const [callSuport, setCallSuport] = useState("enabled");
  const [loadingCallSuport, setLoadingCallSuport] = useState(false);
  const [trialExpiration, setTrialExpiration] = useState(false);
  const [loadingTrialExpiration, setLoadingTrialExpiration] = useState(false);
  const [displayContactInfo, setDisplayContactInfo] = useState("enabled");
  const [enableTicketValueAndSku, setEnableTicketValueAndSku] = useState("enabled");
  const [loadingDisplayContactInfo, setLoadingDisplayContactInfo] = useState(false);
  const [
    loadingShowTypeBotInMainMenu,
    setLoadingShowTypeBotInMainMenu,
  ] = useState(false);
  const [loadingTypeBotIframeUrl, setLoadingTypeBotIframeUrl] = useState(false);

  //ATUALIZAÇÃO AA
  const [smtpauthType, setUrlSmtpauthType] = useState("");
  const [loadingUrlSmtpauthType, setLoadingUrlSmtpauthType] = useState(false);
  const [usersmtpauthType, setUserSmtpauthType] = useState("");
  const [loadingSmtpauthType, setLoadingSmptauthType] = useState(false);
  const [clientsecretsmtpauthType, setClientSecrectSmtpauthType] = useState("");
  const [
    loadingClientSecrectSmtpauthType,
    setLoadingClientSecrectSmtpauthType,
  ] = useState(false);
  const [smtpPortType, setSmtpPortType] = useState("");
  const [loadingSmtpPortType, setLoadingSmtpPortType] = useState(false);
  const [enableAllConnections, setEnableAllConnections] = useState("enabled"); // Initial state
  const [loadingEnableAllConnections, setLoadingEnableAllConnections] = useState(false);
  const [loadingEnableTicketValueAndSku, setLoadingEnableTicketValueAndSku] = useState(false);

  useState(false);

  const { update } = useSettings();

  useEffect(() => {
    getCurrentUserInfo().then((u) => {
      setCurrentUser(u);
      console.log(u);
    });
  }, []);

  useEffect(() => {
    if (Array.isArray(settings) && settings.length) {

      const quickMessages = settings.find((s) => s.key === "quickMessages");
      if(quickMessages) {
        setQuickMessages(quickMessages?.value || "individual");

      }
      
      const sendEmailSetting = settings.find(s => s.key === "sendEmailWhenRegister");
      if (sendEmailSetting) {
         setSendEmailWhenRegister(sendEmailSetting?.value || "disabled");
      }

      const sendMessageSetting = settings.find(s => s.key === "sendMessageWhenRegister");
      if (sendMessageSetting) {
        setSendMessageWhenRegister(sendMessageSetting?.value || "disabled");
      }

      const enableAllConnections = settings.find(s => s.key === "enableAllConnections");
      if (enableAllConnections) {
        setEnableAllConnections(enableAllConnections?.value || "disabled");
      }

      const userRating = settings.find((s) => s.key === "userRating");
      if (userRating) {
        setUserRating(userRating?.value || "");
      }
      const scheduleType = settings.find((s) => s.key === "scheduleType");
      if (scheduleType) {
        setScheduleType(scheduleType?.value || "");
      }
      const callType = settings.find((s) => s.key === "call");
      if (callType) {
        setCallType(callType?.value || "");
      }
      const CheckMsgIsGroup = settings.find((s) => s.key === "CheckMsgIsGroup");
      if (CheckMsgIsGroup) {
        setCheckMsgIsGroup(CheckMsgIsGroup?.value || "enabled");
      }

      const openaiModelSetting = settings.find((s) => s.key === "openaiModel");
      if (openaiModelSetting) {
        setOpenAiModel(openaiModelSetting?.value || "");
      }

      const apiToken = settings.find((s) => s.key === "apiToken");
      if (apiToken) {
        setApiToken(apiToken?.value);
      }
      
      const downloadLimit = settings.find((s) => s.key === "downloadLimit");
      if(downloadLimit) {
        setDownloadLimit(downloadLimit?.value || "64");
      }

      const enableTicketValueAndSku = settings.find((s) => s.key === "enableTicketValueAndSku");
      if(enableTicketValueAndSku) {
        setEnableTicketValueAndSku(enableTicketValueAndSku?.value || "enabled");
      }

      const SendGreetingAccepted = settings.find(
        (s) => s.key === "sendGreetingAccepted"
      );
      if (SendGreetingAccepted) {
        setSendGreetingAccepted(SendGreetingAccepted?.value || "");
      }

      {
        /*TRANSFERIR TICKET*/
      }
      const SettingsTransfTicket = settings.find(
        (s) => s.key === "sendMsgTransfTicket"
      );
      if (SettingsTransfTicket) {
        setSettingsTransfTicket(SettingsTransfTicket?.value || "");
      }
      {
        /*TRANSFERIR TICKET*/
      }

      const chatbotType = settings.find((s) => s.key === "chatBotType");
      if (chatbotType) {
        setChatbotType(chatbotType?.value || "");
      }

      /// Botão para ativar/desativar registro
      const allowSignup = settings.find((s) => s.key === "allowSignup");
      if (allowSignup) {
        setAllowSignup(allowSignup?.value || "enabled");
      }

      const sendGreetingMessageOneQueues = settings.find(
        (s) => s.key === "sendGreetingMessageOneQueues"
      );
      if (sendGreetingMessageOneQueues) {
        setSendGreetingMessageOneQueues(sendGreetingMessageOneQueues?.value || "");
      }

      const callSuport = settings.find((s) => s.key === "callSuport");
      if (callSuport) {
        setCallSuport(callSuport?.value || "");
      }

      const showTypeBotInMainMenu = settings.find(
        (s) => s.key === "showTypeBotInMainMenu"
      );
      if (showTypeBotInMainMenu) {
        setShowTypeBotInMainMenu(showTypeBotInMainMenu?.value || "");
      }

      const typeBotIframeUrl = settings.find(
        (s) => s.key === "typeBotIframeUrl"
      );
      if (typeBotIframeUrl) {
        setTypeBotIframeUrl(typeBotIframeUrl?.value || "");
      }

      const displayContactInfo = settings.find(
        (s) => s.key === "displayContactInfo"
      );
      if (displayContactInfo) {
        setDisplayContactInfo(displayContactInfo?.value || "enabled");
      }

      const trialExpiration = settings.find((s) => s.key === "trialExpiration");
      if (trialExpiration) {
        setTrialExpiration(trialExpiration?.value || "3");
      }

      const smtpauthType = settings.find((s) => s.key === "smtpauth");
      if (smtpauthType) {
        setUrlSmtpauthType(smtpauthType?.value || "");
      }

      const usersmtpauthType = settings.find((s) => s.key === "usersmtpauth");
      if (usersmtpauthType) {
        setUserSmtpauthType(usersmtpauthType?.value || "");
      }

      const clientsecretsmtpauthType = settings.find(
        (s) => s.key === "clientsecretsmtpauth"
      );
      if (clientsecretsmtpauthType) {
        setClientSecrectSmtpauthType(clientsecretsmtpauthType?.value || "");
      }

      const smtpPortType = settings.find((s) => s.key === "smtpport");
      if (smtpPortType) {
        setSmtpPortType(smtpPortType?.value || "");
      }

      const waSuportType = settings.find((s) => s.key === "wasuport");
      if (waSuportType) {
        setWaSuportType(waSuportType?.value || "");
      }

      const msgSuportType = settings.find((s) => s.key === "msgsuport");
      if (msgSuportType) {
        setMsgSuportType(msgSuportType?.value || "");
      }

      const ipixcType = settings.find((s) => s.key === "ipixc");
      if (ipixcType) {
        setIpIxcType(ipixcType?.value || "");
      }

      const tokenixcType = settings.find((s) => s.key === "tokenixc");
      if (tokenixcType) {
        setTokenIxcType(tokenixcType?.value || "");
      }

      const ipmkauthType = settings.find((s) => s.key === "ipmkauth");
      if (ipmkauthType) {
        setIpMkauthType(ipmkauthType?.value || "");
      }

      const clientidmkauthType = settings.find(
        (s) => s.key === "clientidmkauth"
      );
      if (clientidmkauthType) {
        setClientIdMkauthType(clientidmkauthType?.value || "");
      }

      const clientsecretmkauthType = settings.find(
        (s) => s.key === "clientsecretmkauth"
      );
      if (clientsecretmkauthType) {
        setClientSecrectMkauthType(clientsecretmkauthType?.value || "");
      }

      const asaasType = settings.find((s) => s.key === "asaas");
      if (asaasType) {
        setAsaasType(asaasType?.value || "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleQuickMessages(value) {
    setQuickMessages(value);
    setLoadingQuickMessages(true);
    await update({
      key: "quickMessages",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingQuickMessages(false);
  }

  // Funções para manipular os estados
  async function handleSendEmailWhenRegister(value) {
    setSendEmailWhenRegister(value);
    setLoadingSendEmailWhenRegister(true);
    await update({
      key: "sendEmailWhenRegister",
      value,
    });
    toast.success("Configuração de envio de email atualizada com sucesso!");
    setLoadingSendEmailWhenRegister(false);
  }
  async function handleSendMessageWhenRegister(value) {
    setSendMessageWhenRegister(value);
    setLoadingSendMessageWhenRegister(true);
    await update({
      key: "sendMessageWhenRegister",
      value,
    });
    toast.success("Configuração de envio de mensagem atualizada com sucesso!");
    setLoadingSendMessageWhenRegister(false);
  }

  async function handleOpenAiModel(value) {
    setOpenAiModel(value);
    setLoadingOpenAiModel(true);
    await update({
      key: "openaiModel",
      value,
    });
    toast.success("Modelo OpenAI atualizado com sucesso!");
    setLoadingOpenAiModel(false);
  }

  async function handleEnableAllConnections(value) {
    setEnableAllConnections(value);
    setLoadingEnableAllConnections(true);
    await update({
      key: "enableAllConnections",
      value
    });
    toast.success("Configuração atualizada com sucesso!");
    setLoadingEnableAllConnections(false);
  }
//
  async function generateApiToken() {
    const newToken = generateSecureToken(32);
    setApiToken(newToken);
    setLoadingApiToken(true);
    await update({
      key: "apiToken",
      value: newToken,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingApiToken(false);
  }

  async function deleteApiToken() {
    setApiToken("");
    setLoadingApiToken(true);
    await update({
      key: "apiToken",
      value: "",
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingApiToken(false);
  }

  async function copyApiToken() {
    copyToClipboard(apiToken);
    toast.success("Token copied to clipboard");
  }

  async function handleShowTypeBotInMainMenu(value) {
    setShowTypeBotInMainMenu(value);
    setLoadingShowTypeBotInMainMenu(true);
    await update({
      key: "showTypeBotInMainMenu",
      value,
    });
    toast.success("Configuração atualizada com sucesso!");
    setLoadingShowTypeBotInMainMenu(false);
  }

  async function handleTypeBotIframeUrl(value) {
    setTypeBotIframeUrl(value);
    setLoadingTypeBotIframeUrl(true);
    await update({
      key: "typeBotIframeUrl",
      value,
    });
    toast.success("Configuração atualizada com sucesso!");
    setLoadingTypeBotIframeUrl(false);
  }

  async function handleChangeUserRating(value) {
    setUserRating(value);
    setLoadingUserRating(true);
    await update({
      key: "userRating",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingUserRating(false);
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
    setLoadingScheduleType(true);
    await update({
      key: "scheduleType",
      value,
    });
    toast.success("Operação atualizada com sucesso.", {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      theme: "light",
    });
    setLoadingScheduleType(false);
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  async function handleCallType(value) {
    setCallType(value);
    setLoadingCallType(true);
    await update({
      key: "call",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingCallType(false);
  }

  async function handleAllowSignup(value) {
    setAllowSignup(value);
    setLoadingAllowSignup(true);
    await update({
      key: "allowSignup",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingAllowSignup(false);
  }

  async function handleChatbotType(value) {
    setChatbotType(value);
    setLoadingChatbotType(true);
    await update({
      key: "chatBotType",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingChatbotType(false);
  }

  async function handleGroupType(value) {
    setCheckMsgIsGroup(value);
    setLoadingCheckMsgIsGroup(true);
    await update({
      key: "CheckMsgIsGroup",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingCheckMsgIsGroup(false);
  }

  async function handleSendGreetingAccepted(value) {
    setSendGreetingAccepted(value);
    setLoadingSendGreetingAccepted(true);
    await update({
      key: "sendGreetingAccepted",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingSendGreetingAccepted(false);
  }

  async function handleSettingsTransfTicket(value) {
    setSettingsTransfTicket(value);
    setLoadingSettingsTransfTicket(true);
    await update({
      key: "sendMsgTransfTicket",
      value,
    });

    toast.success("Operação atualizada com sucesso.");
    setLoadingSettingsTransfTicket(false);
  }

  async function handleChangeWaSuport(value) {
    setWaSuportType(value);
    setLoadingWaSuportType(true);
    await update({
      key: "wasuport",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingWaSuportType(false);
  }

  async function handleChangeMsgSuport(value) {
    setMsgSuportType(value);
    setLoadingMsgSuportType(true);
    await update({
      key: "msgsuport",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingMsgSuportType(false);
  }

  async function handleChangeIPIxc(value) {
    setIpIxcType(value);
    setLoadingIpIxcType(true);
    await update({
      key: "ipixc",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingIpIxcType(false);
  }

  async function handleSendGreetingMessageOneQueues(value) {
    setSendGreetingMessageOneQueues(value);
    setLoadingSendGreetingMessageOneQueues(true);
    await update({
      key: "sendGreetingMessageOneQueues",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingSendGreetingMessageOneQueues(false);
  }

  async function handleCallSuport(value) {
    setCallSuport(value);
    setLoadingCallSuport(true);
    await update({
      key: "callSuport",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingCallSuport(false);
  }

  async function handleDisplayContactInfo(value) {
    setDisplayContactInfo(value);
    setLoadingDisplayContactInfo(true);
    await update({
      key: "displayContactInfo",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingDisplayContactInfo(false);
  }

  async function handleTrialExpiration(value) {
    setTrialExpiration(value);
    setLoadingTrialExpiration(true);
    await update({
      key: "trialExpiration",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingTrialExpiration(false);
  }

  async function handleChangeUrlSmtpauth(value) {
    setUrlSmtpauthType(value);
    setLoadingUrlSmtpauthType(true);
    await update({
      key: "smtpauth",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingUrlSmtpauthType(false);
  }

  async function handleChangeUserSmptauth(value) {
    setUserSmtpauthType(value);
    setLoadingSmptauthType(true);
    await update({
      key: "usersmtpauth",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingSmptauthType(false);
  }

  async function handleChangeClientSecrectSmtpauth(value) {
    setClientSecrectSmtpauthType(value);
    setLoadingClientSecrectSmtpauthType(true);
    await update({
      key: "clientsecretsmtpauth",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingClientSecrectSmtpauthType(false);
  }

  async function handleChangeTokenIxc(value) {
    setTokenIxcType(value);
    setLoadingTokenIxcType(true);
    await update({
      key: "tokenixc",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingTokenIxcType(false);
  }

  async function handleChangeIpMkauth(value) {
    setIpMkauthType(value);
    setLoadingIpMkauthType(true);
    await update({
      key: "ipmkauth",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingIpMkauthType(false);
  }

  async function handleChangeClientIdMkauth(value) {
    setClientIdMkauthType(value);
    setLoadingClientIdMkauthType(true);
    await update({
      key: "clientidmkauth",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingClientIdMkauthType(false);
  }

  async function handleChangeClientSecrectMkauth(value) {
    setClientSecrectMkauthType(value);
    setLoadingClientSecrectMkauthType(true);
    await update({
      key: "clientsecretmkauth",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingClientSecrectMkauthType(false);
  }

  async function handleChangeAsaas(value) {
    setAsaasType(value);
    setLoadingAsaasType(true);
    await update({
      key: "asaas",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingAsaasType(false);
  }

  async function handleChangeSmtpPort(value) {
    setSmtpPortType(value);
    setLoadingSmtpPortType(true);
    await update({
      key: "smtpport",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingSmtpPortType(false);
  }

  async function handleDownloadLimit(value) {
    setDownloadLimit(value);
    setLoadingDownloadLimit(true);
    await update({
      key: "downloadLimit",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingDownloadLimit(false);
  }

  async function handleEnableTicketValueAndSku(value) {
    setEnableTicketValueAndSku(value);
    setLoadingEnableTicketValueAndSku(true);
    await update({
      key: "enableTicketAndValueSku",
      value,
    });
    toast.success("Operação atualizada com sucesso.");
    setLoadingEnableTicketValueAndSku(false);
  }

  return <>
    <Grid spacing={3} container>
      <OnlyForSuperUser
        user={currentUser}
        yes={() => (
          <>
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="allowSignup-label">
                Permitir cadastro
              </InputLabel>
              <Select
                labelId="allowSignup-label"
                value={allowSignup}
                size="small"
                onChange={async (e) => {
                  handleAllowSignup(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>Desativado</MenuItem>
                <MenuItem value={"enabled"}>Ativado</MenuItem>
              </Select>
              <FormHelperText>
                {loadingAllowSignup && "Atualizando..."}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="downloadLimit-label">
                Limite de Download de Arquivos (MB)
              </InputLabel>
              <Select
                labelId="downloadLimit-label"
                value={downloadLimit}
                size="small"
                onChange={async (e) => {
                  handleDownloadLimit(e.target.value);
                }}
              >
                <MenuItem value={"32"}>32</MenuItem>
                <MenuItem value={"64"}>64</MenuItem>
                <MenuItem value={"128"}>128</MenuItem>
                <MenuItem value={"256"}>256</MenuItem>
                <MenuItem value={"512"}>512</MenuItem>
                <MenuItem value={"1024"}>1024</MenuItem>
                <MenuItem value={"2048"}>2048</MenuItem>
              </Select>
              <FormHelperText>
                {loadingDownloadLimit && "Atualizando..."}
              </FormHelperText>
            </FormControl>
          </Grid>


            <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="enableAllConections-label">
                Exibir Todas as Conexões?
              </InputLabel>
              <Select
                labelId="enableAllConections-label"
                value={enableAllConnections}
                size="small"
                onChange={async (e) => {
                  handleEnableAllConnections(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>Desativado</MenuItem>
                <MenuItem value={"enabled"}>Ativado</MenuItem>
              </Select>
              <FormHelperText>
                {loadingEnableAllConnections && "Atualizando..."}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="enableTicketValueAndSku-label">
                Exibir valor do ticket e sku?
              </InputLabel>
              <Select
                labelId="enableTicketValueAndSku-label"
                value={enableTicketValueAndSku}
                size="small"
                onChange={async (e) => {
                  handleEnableTicketValueAndSku(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>Desativado</MenuItem>
                <MenuItem value={"enabled"}>Ativado</MenuItem>
              </Select>
              <FormHelperText>
                {loadingEnableTicketValueAndSku && "Atualizando..."}
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="sendEmailWhenRegister-label">
            Enviar email ao registrar
          </InputLabel>
          <Select
            labelId="sendEmailWhenRegister-label"
            value={sendEmailWhenRegister}
            size="small"
            onChange={async (e) => {
              handleSendEmailWhenRegister(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>Desabilitado</MenuItem>
            <MenuItem value={"enabled"}>Habilitado</MenuItem>
          </Select>
          <FormHelperText>
            {loadingSendEmailWhenRegister && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="sendMessageWhenRegister-label">
            Enviar mensagem ao registrar
          </InputLabel>
          <Select
            labelId="sendMessageWhenRegister-label"
            value={sendMessageWhenRegister}
            size="small"
            onChange={async (e) => {
              handleSendMessageWhenRegister(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>Desabilitado</MenuItem>
            <MenuItem value={"enabled"}>Habilitado</MenuItem>
          </Select>
          <FormHelperText>
            {loadingSendMessageWhenRegister && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
          </>
        )}
      />

      {/* Campo para selecionar o modelo OpenAI */}
    <Grid xs={12} sm={6} md={4} item>
      <FormControl className={classes.selectContainer}>
        <InputLabel id="openai-model-label">Modelo OpenAI</InputLabel>
        <Select
          labelId="openai-model-label"
          value={openAiModel}
          size="small"
          onChange={async (e) => {
            handleOpenAiModel(e.target.value);
          }}
        >
          <MenuItem value={"gpt-4o"}>gpt-4o</MenuItem>
          <MenuItem value={"gpt-4o-2024-05-13"}>gpt-4o-2024-05-13</MenuItem>
          <MenuItem value={"gpt-4o-mini"}>gpt-4o-mini</MenuItem>
          <MenuItem value={"gpt-4o-mini-2024-07-18"}>gpt-4o-mini-2024-07-18</MenuItem>
          <MenuItem value={"gpt-4-turbo"}>gpt-4-turbo</MenuItem>
          <MenuItem value={"gpt-4-turbo-2024-04-09"}>gpt-4-turbo-2024-04-09</MenuItem>
          <MenuItem value={"gpt-4-turbo-preview"}>gpt-4-turbo-preview</MenuItem>
          <MenuItem value={"gpt-4-0125-preview"}>gpt-4-0125-preview</MenuItem>
          <MenuItem value={"gpt-4-1106-preview"}>gpt-4-1106-preview</MenuItem>
          <MenuItem value={"gpt-4"}>gpt-4</MenuItem>
          <MenuItem value={"gpt-4-0613"}>gpt-4-0613</MenuItem>
          <MenuItem value={"gpt-4-0314"}>gpt-4-0314</MenuItem>
          <MenuItem value={"gpt-3.5-turbo-0125"}>gpt-3.5-turbo-0125</MenuItem>
          <MenuItem value={"gpt-3.5-turbo"}>gpt-3.5-turbo</MenuItem>
          <MenuItem value={"gpt-3.5-turbo-1106"}>gpt-3.5-turbo-1106</MenuItem>
          <MenuItem value={"gpt-3.5-turbo-instruct"}>gpt-3.5-turbo-instruct</MenuItem>
        </Select>
        <FormHelperText>
          {loadingOpenAiModel && "Atualizando..."}
        </FormHelperText>
      </FormControl>
    </Grid>

      {/* RESPOSTAS RÁPIDAS POR EMPRESA OU POR USUÁRIO */}
      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="quickmessages-label">
            Mensagens Rápidas
          </InputLabel>
          <Select
            labelId="quickmessages-label"
            value={quickMessages}
            size="small"
            onChange={async (e) => {
              handleQuickMessages(e.target.value);
            }}
          >
            <MenuItem value={"company"}>Por empresa</MenuItem>
            <MenuItem value={"individual"}>Por usuário</MenuItem>
          </Select>
          <FormHelperText>
            {loadingQuickMessages && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
      
      {/* ENVIAR SAUDAÇÃO AO ACEITAR O TICKET */}
      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="sendGreetingAccepted-label">
            {i18n.t("optionsPage.sendanun")}
          </InputLabel>
          <Select
            label="sendGreetingAccepted-label"
            value={SendGreetingAccepted}
            size="small"
            onChange={async (e) => {
              handleSendGreetingAccepted(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>
              {i18n.t("optionsPage.buttons.off")}
            </MenuItem>
            <MenuItem value={"enabled"}>
              {i18n.t("optionsPage.buttons.on")}
            </MenuItem>
          </Select>
          <FormHelperText>
            {loadingSendGreetingAccepted && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="ratings-label">
            {i18n.t("optionsPage.calif")}
          </InputLabel>
          <Select
            label="ratings-label"
            value={userRating}
            size="small"
            onChange={async (e) => {
              handleChangeUserRating(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>
              {i18n.t("optionsPage.buttons.offs")}
            </MenuItem>
            <MenuItem value={"enabled"}>
              {i18n.t("optionsPage.buttons.ons")}
            </MenuItem>
          </Select>
          <FormHelperText>
            {loadingUserRating && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="schedule-type-label">
            {i18n.t("optionsPage.expedient")}
          </InputLabel>
          <Select
            label="schedule-type-label"
            value={scheduleType}
            size="small"
            onChange={async (e) => {
              handleScheduleType(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>
              {i18n.t("optionsPage.buttons.off")}
            </MenuItem>
            <MenuItem value={"queue"}>
              {i18n.t("optionsPage.buttons.quee")}
            </MenuItem>
            <MenuItem value={"company"}>
              {i18n.t("optionsPage.buttons.partner")}
            </MenuItem>
          </Select>
          <FormHelperText>
            {loadingScheduleType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="group-type-label">
            {i18n.t("optionsPage.ignore")}
          </InputLabel>
          <Select
            label={i18n.t("optionsPage.ignore")}
            size="small"
            value={CheckMsgIsGroup}
            onChange={async e => {
              handleGroupType(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>
              {i18n.t("optionsPage.buttons.off")}
            </MenuItem>
            <MenuItem value={"enabled"}>
              {i18n.t("optionsPage.buttons.on")}
            </MenuItem>
          </Select>
          <FormHelperText>
            {loadingCheckMsgIsGroup && i18n.t("optionsPage.updating")}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="call-type-label">
            {i18n.t("optionsPage.aceptcall")}
          </InputLabel>
          <Select
            label="call-type-label"
            value={callType}
            size="small"
            onChange={async (e) => {
              handleCallType(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>
              {i18n.t("optionsPage.buttons.calldeny")}
            </MenuItem>
            <MenuItem value={"enabled"}>
              {i18n.t("optionsPage.buttons.callok")}
            </MenuItem>
          </Select>
          <FormHelperText>
            {loadingCallType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="chatbot-type-label">
            {i18n.t("optionsPage.typechatbot")}
          </InputLabel>
          <Select
            label="chatbot-type-label"
            value={chatbotType}
            size="small"
            onChange={async (e) => {
              handleChatbotType(e.target.value);
            }}
          >
            <MenuItem value={"text"}>Texto</MenuItem>
            <MenuItem value={"list"}>Lista</MenuItem>
          </Select>
          <FormHelperText>
            {loadingChatbotType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>

      {/* ENVIAR MENSAGEM DE TRANSFERENCIA DE SETOR/ATENDENTE */}
      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="sendMsgTransfTicket-label">
            {i18n.t("optionsPage.sendagent")}
          </InputLabel>
          <Select
            label="sendMsgTransfTicket-label"
            value={SettingsTransfTicket}
            size="small"
            onChange={async (e) => {
              handleSettingsTransfTicket(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>
              {i18n.t("optionsPage.buttons.off")}
            </MenuItem>
            <MenuItem value={"enabled"}>
              {i18n.t("optionsPage.buttons.on")}
            </MenuItem>
          </Select>
          <FormHelperText>
            {loadingSettingsTransfTicket && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>

      {/* ENVIAR SAUDAÇÃO QUANDO HOUVER SOMENTE 1 FILA */}
      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="sendGreetingMessageOneQueues-label">
            {i18n.t("optionsPage.greeatingOneQueue")}
          </InputLabel>
          <Select
            label="sendGreetingMessageOneQueues-label"
            value={sendGreetingMessageOneQueues}
            size="small"
            onChange={async (e) => {
              handleSendGreetingMessageOneQueues(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>Desabilitado</MenuItem>
            <MenuItem value={"enabled"}>Habilitado</MenuItem>
          </Select>
          <FormHelperText>
            {loadingSendGreetingMessageOneQueues && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="show-typebot-mainmenu-label">
            {i18n.t("optionsPage.showTypeBotInMainMenu")}
          </InputLabel>
          <Select
            label="show-typebot-mainmenu-label"
            value={showTypeBotInMainMenu}
            size="small"
            onChange={async (e) => {
              handleShowTypeBotInMainMenu(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>Desabilitado</MenuItem>
            <MenuItem value={"enabled"}>Habilitado</MenuItem>
          </Select>
          <FormHelperText>
            {loadingShowTypeBotInMainMenu && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>

      {/* Habilita botão de Suporte */}
      <OnlyForSuperUser
        user={currentUser}
        yes={() => (
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="callSuport-label">
                {i18n.t("optionsPage.callSuport")}
              </InputLabel>
              <Select
                label="callSuport-label"
                value={callSuport}
                size="small"
                onChange={async (e) => {
                  handleCallSuport(e.target.value);
                }}
              >
                <MenuItem value={"disabled"}>Desabilitado</MenuItem>
                <MenuItem value={"enabled"}>Habilitado</MenuItem>
              </Select>
              <FormHelperText>
                {loadingCallSuport && "Atualizando..."}
              </FormHelperText>
            </FormControl>
          </Grid>
        )}
      />

      {/* Define dias para testes */}
      <OnlyForSuperUser
        user={currentUser}
        yes={() => (
          <Grid xs={12} sm={6} md={4} item>
            <FormControl className={classes.selectContainer}>
              <InputLabel id="trialExpiration-label">
                {i18n.t("optionsPage.trialExpiration")}
              </InputLabel>
              <Select
                label="trialExpiration-label"
                value={trialExpiration}
                size="small"
                onChange={async (e) => {
                  handleTrialExpiration(e.target.value);
                }}
              >
                <MenuItem value={"3"}>3</MenuItem>
                <MenuItem value={"7"}>7</MenuItem>
                <MenuItem value={"9"}>9</MenuItem>
                <MenuItem value={"15"}>15</MenuItem>
                <MenuItem value={"30"}>30</MenuItem>
              </Select>
              <FormHelperText>
                {loadingTrialExpiration && "Atualizando..."}
              </FormHelperText>
            </FormControl>
          </Grid>
        )}
      />

      <Grid xs={12} sm={6} md={4} item>
        <FormControl className={classes.selectContainer}>
          <InputLabel id="displayContactInfo-label">
            {i18n.t("optionsPage.displayContactInfo")}
          </InputLabel>
          <Select
            label="displayContactInfo-label"
            value={displayContactInfo}
            size="small"
            onChange={async (e) => {
              handleDisplayContactInfo(e.target.value);
            }}
          >
            <MenuItem value={"disabled"}>Desabilitado</MenuItem>
            <MenuItem value={"enabled"}>Habilitado</MenuItem>
          </Select>
          <FormHelperText>
            {loadingDisplayContactInfo && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>


    </Grid>

    <Grid spacing={3} container>
      <Tabs
        value={1}
        indicatorColor="primary"
        textColor="primary"
        scrollButtons
        variant="scrollable"
        className={classes.tab}
        style={{
          marginBottom: 20,
          marginTop: 20,
        }}
        allowScrollButtonsMobile>
        <Tab value={1} label={i18n.t("optionsPage.advanced")} />
      </Tabs>
    </Grid>

    {/*-----------------SUPORTE-----------------*/}
    {callSuport === "enabled" && (
      <OnlyForSuperUser
        user={currentUser}
        yes={() => (
          <Grid spacing={3} container style={{ marginBottom: 10 }}>
            <Tabs
              indicatorColor="primary"
              textColor="primary"
              scrollButtons
              variant="scrollable"
              className={classes.tab}
              allowScrollButtonsMobile>
              <Tab label="Suporte" />
            </Tabs>
            <Grid xs={12} sm={6} md={4} item>
              <FormControl className={classes.selectContainer}>
                <TextField
                  id="wasuport"
                  name="wasuport"
                  label="WhatsApp do Suporte"
                  size="small"
                  value={waSuportType}
                  onChange={(e) => {
                    if (
                      e.target.value === "" ||
                      /^[0-9\b]+$/.test(e.target.value)
                    ) {
                      setWaSuportType(e.target.value);
                    }
                  }}
                  onBlur={() => handleChangeWaSuport(waSuportType)}
                ></TextField>
                <FormHelperText>
                  {loadingWaSuportType && "Atualizando..."}
                </FormHelperText>
              </FormControl>
            </Grid>

            <Grid xs={12} sm={6} md={8} item>
              <FormControl className={classes.selectContainer}>
                <TextField
                  id="msgsuporte"
                  name="msgsuporte"
                  label="Mensagem pré-definida"
                  size="small"
                  value={msgSuportType}
                  onChange={(e) => setMsgSuportType(e.target.value)}
                  onBlur={() => handleChangeMsgSuport(msgSuportType)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.target.blur();
                    }
                  }}
                ></TextField>
                <FormHelperText>
                  {loadingMsgSuportType && "Atualizando..."}
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        )}
      />
    )}

    <Grid xs={12} sm={6} md={4} item>
      <FormControl className={classes.selectContainer}>
        <TextField
          id="primary-color-light-field"
          label="API Token"
          size="small"
          value={apiToken}
          InputProps={{
            endAdornment: (
              <>
                {apiToken && (
                  <>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => {
                        copyApiToken();
                      }}
                    >
                      <FontAwesomeIcon icon={faCopy} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="default"
                      onClick={() => {
                        deleteApiToken();
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </>
                )}
                {!apiToken && (
                  <IconButton
                    size="small"
                    color="default"
                    onClick={() => {
                      generateApiToken();
                    }}
                  >
                    <FontAwesomeIcon icon={faGears} />
                  </IconButton>
                )}
              </>
            ),
          }}
        />
        <FormHelperText>
          {loadingApiToken && "Atualizando..."}
        </FormHelperText>
      </FormControl>
    </Grid>

    {/*-----------------TYPEBOT-----------------*/}
    {showTypeBotInMainMenu === "enabled" && (
      <OnlyForSuperUser
        user={currentUser}
        yes={() => (
          <Grid spacing={3} container style={{ marginBottom: 10 }}>
            <Tabs
              indicatorColor="primary"
              textColor="primary"
              scrollButtons
              variant="scrollable"
              className={classes.tab}
              allowScrollButtonsMobile>
              <Tab label="Typebot" />
            </Tabs>
            <Grid xs={12} sm={6} md={4} item>
              <FormControl className={classes.selectContainer}>
                <TextField
                  id="typebot-iframe-url"
                  name="typebot-iframe-url"
                  margin="dense"
                  label={i18n.t("optionsPage.typeBotIframeUrl")}
                  size="small"
                  value={typeBotIframeUrl}
                  onChange={async (e) => {
                    handleTypeBotIframeUrl(e.target.value);
                  }}
                />
                <FormHelperText>
                  {loadingTypeBotIframeUrl && "Atualizando..."}
                </FormHelperText>
              </FormControl>
            </Grid>
          </Grid>
        )}
      />
    )}

    {/*-----------------IXC-----------------*/}
    <Grid spacing={3} container style={{ marginBottom: 10 }}>
      <Tabs
        indicatorColor="primary"
        textColor="primary"
        scrollButtons
        variant="scrollable"
        className={classes.tab}
        allowScrollButtonsMobile>
        <Tab label="IXC" />
      </Tabs>
      <Grid xs={12} sm={6} md={6} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="ipixc"
            name="ipixc"
            label="IP do IXC"
            size="small"
            value={ipixcType}
            onChange={async (e) => {
              handleChangeIPIxc(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingIpIxcType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
      <Grid xs={12} sm={6} md={6} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="tokenixc"
            name="tokenixc"  
            label="Token do IXC"
            size="small"
            value={tokenixcType}
            onChange={async (e) => {
              handleChangeTokenIxc(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingTokenIxcType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
    </Grid>
    {/*-----------------MK-AUTH-----------------*/}
    <Grid spacing={3} container style={{ marginBottom: 10 }}>
      <Tabs
        indicatorColor="primary"
        textColor="primary"
        scrollButtons
        variant="scrollable"
        className={classes.tab}
        allowScrollButtonsMobile>
        <Tab label="MK-AUTH" />
      </Tabs>
      <Grid xs={12} sm={12} md={4} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="ipmkauth"
            name="ipmkauth"
            label="Ip Mk-Auth"
            size="small"
            value={ipmkauthType}
            onChange={async (e) => {
              handleChangeIpMkauth(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingIpMkauthType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
      <Grid xs={12} sm={12} md={4} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="clientidmkauth"
            name="clientidmkauth"
            label="Client Id"
            size="small"
            value={clientidmkauthType}
            onChange={async (e) => {
              handleChangeClientIdMkauth(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingClientIdMkauthType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
      <Grid xs={12} sm={12} md={4} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="clientsecretmkauth"
            name="clientsecretmkauth"  
            label="Client Secret"
            size="small"
            value={clientsecretmkauthType}
            onChange={async (e) => {
              handleChangeClientSecrectMkauth(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingClientSecrectMkauthType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
    </Grid>
    {/*-----------------ASAAS-----------------*/}
    <Grid spacing={3} container style={{ marginBottom: 10 }}>
      <Tabs
        indicatorColor="primary"
        textColor="primary"
        scrollButtons
        variant="scrollable"
        className={classes.tab}
        allowScrollButtonsMobile>
        <Tab label="ASAAS" />
      </Tabs>
      <Grid xs={12} sm={12} md={12} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="asaas"
            name="asaas"
            label="Token Asaas"
            size="small"
            value={asaasType}
            onChange={async (e) => {
              handleChangeAsaas(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingAsaasType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
    </Grid>
    {/*-----------------SMTP-AUTH-----------------*/}
    <Grid spacing={3} container style={{ marginBottom: 10 }}>
      <Tabs
        value={1}
        indicatorColor="primary"
        textColor="primary"
        scrollButtons
        variant="scrollable"
        className={classes.tab}
        allowScrollButtonsMobile>
        <Tab value={1} label="SMTP" />
      </Tabs>
      <Grid xs={12} sm={12} md={3} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="smtpauth"
            name="smtpauth"
            label="Servidor SMTP"
            size="small"
            value={smtpauthType}
            onChange={async (e) => {
              handleChangeUrlSmtpauth(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingUrlSmtpauthType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
      <Grid xs={12} sm={12} md={3} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="usersmtpauth"
            name="usersmtpauth"
            label="SMTP Username"
            size="small"
            value={usersmtpauthType}
            onChange={async (e) => {
              handleChangeUserSmptauth(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingSmtpauthType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
      <Grid xs={12} sm={12} md={3} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="clientsecretsmtpauth"
            name="clientsecretsmtpauth"
            label="SMTP Password"
            size="small"
            value={clientsecretsmtpauthType}
            onChange={async (e) => {
              handleChangeClientSecrectSmtpauth(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingClientSecrectSmtpauthType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
      <Grid xs={12} sm={12} md={3} item>
        <FormControl className={classes.selectContainer}>
          <TextField
            id="smtpport"
            name="smtpport"
            label="SMTP Port"
            size="small"
            value={smtpPortType}
            onChange={async (e) => {
              handleChangeSmtpPort(e.target.value);
            }}
          ></TextField>
          <FormHelperText>
            {loadingSmtpPortType && "Atualizando..."}
          </FormHelperText>
        </FormControl>
      </Grid>
    </Grid>
  </>;
}
