import React, { useEffect, useState } from "react";
import makeStyles from '@mui/styles/makeStyles';
import useSettings from "../../hooks/useSettings";
import axios from "axios";  // Importando axios

const useStyles = makeStyles((theme) => ({
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflowY: "scroll",
    ...theme.scrollbarStyles,
  },
  iframe: {
    border: "none",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  }
}));

const Typebot = () => {
  const classes = useStyles();
  const { settings } = useSettings();
  const [showTypeBotInMainMenu, setShowTypeBotInMainMenu] = useState("enabled");
  const [typeBotIframeUrl, setTypeBotIframeUrl] = useState(null);

  useEffect(() => {
    axios.get(`/settings`).then(({ data }) => {  // Usando axios para a chamada API
      if (Array.isArray(data)) {
        const showTypeBotInMainMenu = data.find((d) => d.key === "showTypeBotInMainMenu");
        if (showTypeBotInMainMenu) {
          setShowTypeBotInMainMenu(showTypeBotInMainMenu.value);
        }

        const typeBotIframeUrl = data.find((d) => d.key === "typeBotIframeUrl");
        if (typeBotIframeUrl) {
          setTypeBotIframeUrl(typeBotIframeUrl.value);
        }
      }
    });
  }, []);

  return (
    <div className={classes.iframe}>
      <iframe className={classes.iframe} src={typeBotIframeUrl}></iframe>
    </div>
  );
};

export default Typebot;
