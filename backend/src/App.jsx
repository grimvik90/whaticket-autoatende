import React, {useState, useEffect, useMemo} from "react";

import "react-toastify/dist/ReactToastify.css";
import {QueryClient, QueryClientProvider} from "react-query";

import {ptBR} from "@mui/material/locale";
import { createTheme, ThemeProvider, StyledEngineProvider, adaptV4Theme } from "@mui/material/styles";
import {useMediaQuery} from "@mui/material";
import ColorModeContext from "./layout/themeContext";
import useSettings from "./hooks/useSettings";
import Favicon from "react-favicon";

import './styles.css';
import Routes from "./routes";
import useAuth from "./hooks/useAuth.js";

const queryClient = new QueryClient();
const defaultLogoLight = "assets/vector/logo.svg";
const defaultLogoDark = "assets/vector/logo-dark.svg";
const defaultLogoFavicon = "assets/vector/favicon.svg";
const defaultLogoPWAIcon = "assets/vector/favicon.svg";

const App = () => {
    const [locale, setLocale] = useState();
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const preferredTheme = window.localStorage.getItem("preferredTheme");
    const [mode, setMode] = useState(preferredTheme ? preferredTheme : prefersDarkMode ? "dark" : "light");

    const [themeSettings, setThemeSettings] = useState({

        primaryColorLight: "#0000FF",
        secondaryColorLight: "#0000FF",
        primaryColorDark: "#39ACE7",
        secondaryColorDark: "#39ACE7",
        iconColorLight: "#0693E3",
        iconColorDark: "#39ACE7",
        appLogoLight: defaultLogoLight,
        appLogoDark: defaultLogoDark,
        appLogoFavicon: defaultLogoFavicon,
        appLogoPWAIcon: defaultLogoPWAIcon,
        appName: "AutoAtende",
        chatlistLight: "#eeeeee",
        chatlistDark: "#1C2E36",
        boxRightLight: "#39ACE7",
        boxRightDark: "#39ACE7",
        boxLeftLight: "#39ACE7",
        boxLeftDark: "#39ACE7",
        numberOfSupport: "5516996509803",
        allowSignup: 'disabled'
    });

    const {isAuth} = useAuth();


    const {getPublicSetting, getAllPublicSetting} = useSettings();


    let setSetting = (key, value) => {
        let themeBackup = themeSettings;
        themeBackup[key] = value;
        setThemeSettings({...themeBackup});

    }

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));

            },
            iconColorLight: themeSettings.iconColorLight, // Adicione isso
            iconColorDark: themeSettings.iconColorDark,
            setPrimaryColorLight: (color) => {
                if (!color || !color.startsWith("#")) {
                    color = "#0000FF";
                }
                setSetting("primaryColorLight", color);
            },
            setSecondaryColorLight: (color) => {
                if (!color || !color.startsWith("#")) {
                    color = "#0000FF";
                }
                setSetting("secondaryColorLight", color);
            },
            setPrimaryColorDark: (color) => {
                if (!color || !color.startsWith("#")) {
                    color = "#39ACE7";
                }
                setSetting("primaryColorDark", color);


            },
            setSecondaryColorDark: (color) => {
                if (!color || !color.startsWith("#")) {
                    color = "#39ACE7";
                }
                setSetting("secondaryColorDark", color);

            },
            setAppLogoLight: (file) => {
                setSetting("appLogoLight", file)
            },
            setAppLogoDark: (file) => {
                setSetting("appLogoDark", file)
            },
            setAppLogoFavicon: (file) => {
                setSetting("appLogoFavicon", file)
            },
            setAppLogoPWAIcon: (file) => {
                setSetting("appLogoPWAIcon", file)
            },
            setAppName: (name) => {
                setSetting("appName", name)
            },
            setIconColorLight: (color) => {
                setSetting("iconColorLight", color)
            },
            setIconColorDark: (color) => {
                setSetting("iconColorDark", color)
            },
            setChatlistLight: (color) => {
                setSetting("chatlistLight", color)
            },
            setChatlistDark: (color) => {
                setSetting("chatlistDark", color)

            },
            setBoxLeftLight: (color) => {
                setSetting("boxLeftLight", color)

            },
            setBoxLeftDark: (color) => {
                setSetting("boxLeftDark", color)

            },
            setBoxRightLight: (color) => {
                setSetting("boxRightLight", color)
            },
            setBoxRightDark: (color) => {
                setSetting("boxRightDark", color)

            },
            setNumberOfSupport: (number) => {
                setSetting("numberOfSupport", number)
            },
            setSetting
        }),
        []
    );

    async function loadSettings() {

        let themeBackup = themeSettings;
        let allSettings = await getAllPublicSetting();
        if (allSettings) {
            allSettings.forEach((setting) => {
                if (!setting.value)
                    return;

                if (setting.key.includes("Logo")) {
                    themeBackup[setting.key] = process.env.REACT_APP_BACKEND_URL + "/public/" + setting.value;
                } else {
                    themeBackup[setting.key] = setting.value;
                }
            });
            console.log(themeBackup)

            setThemeSettings({...themeBackup});

        }

        const i18nlocale = localStorage.getItem("language");
        if (!i18nlocale) {
            return;
        }

        const browserLocale = i18nlocale.substring(0, 2) + i18nlocale.substring(3, 5);

        if (browserLocale === "ptBR") {
            setLocale(ptBR);
        }
    }

    useEffect(async () => {
        await loadSettings();
    }, [isAuth]);

    const theme = useMemo(() => createTheme(adaptV4Theme({
        scrollbarStyles: {
            "&::-webkit-scrollbar": {
                width: '6px',
                height: '4px',
            },
            "&::-webkit-scrollbar-thumb": {
                // boxShadow: 'inset 0 0 6px rgba(0, 0, 0, 0.3)',
                backgroundColor: mode === "light" ? themeSettings.primaryColorLight : themeSettings.primaryColorDark,
                //borderRadius: "8px",
            },
        },
        scrollbarStylesSoft: {
            "&::-webkit-scrollbar": {
                width: "8px",
                // borderRadius: "8px",
            },
            "&::-webkit-scrollbar-thumb": {
                backgroundColor: mode === "light" ? "#00bfff" : "#fff !important",
                borderRadius: "8px",
            },
        },
      button: {
        color: mode === "light" ? themeSettings.primaryColorLight : themeSettings.primaryColorDark,
      },
      buttonIcon: {
        color: mode === "light" ? themeSettings.primaryColorLight : themeSettings.primaryColorDark,
      },

      palette: {
            mode: mode,
            primary: {main: mode === "light" ? themeSettings.primaryColorLight : themeSettings.primaryColorDark},
            secondary: {main: mode === "light" ? themeSettings.secondaryColorLight : themeSettings.secondaryColorDark},
            textPrimary: mode === "light" ? themeSettings.primaryColorLight : themeSettings.primaryColorDark,
            borderPrimary: mode === "light" ? themeSettings.primaryColorLight : themeSettings.primaryColorDark,
            dark: {main: mode === "light" ? "#1C2E36" : "#ffffff "},
            light: {main: mode === "light" ? "#F3F3F3" : "#1C2E36"},
            tabHeaderBackground: mode === "light" ? "#FFFFFF" : "#1C2E36", //Menu Atendimentos (Abertas, Grupos...)
            optionsBackground: mode === "light" ? "#F1F5F5" : "#0F1B20", //Aba Atendimentos (Novos, Todos, Filas)
            chatlist: mode === "light" ? themeSettings.chatlistLight : themeSettings.chatlistDark, // cor do fundo do chat
            boxRight: mode === "light" ? themeSettings.boxRightLight : themeSettings.boxRightDark, // cor do fundo do mensagem direita
            boxLeft: mode === "light" ? themeSettings.boxLeftLight : themeSettings.boxLeftDark, // cor do fundo do mensagem esquerda
            boxchatlist: mode === "light" ? "#ededed" : "#1C2E36", // ONDE???????????
            messageIcons: mode === "light" ? "ff0378" : "#F3F3F3",
            inputBackground: mode === "light" ? "#FFFFFF" : "#1C2E36", // ONDE???????????
            options: mode === "light" ? "#FFFFFF" : "#1C2E36", //Configurações (Abas: Integrações IXC ASAAS...)
            fontecor: mode === "light" ? themeSettings.primaryColorLight : themeSettings.primaryColorDark,

            iconColor: mode === "light" ? themeSettings.iconColorLight : themeSettings.iconColorDark,

            fancyBackground: mode === "light" ? "#F1F5F5" : "#0F1B20", //Cor Fundo Principal Escura
            bordabox: mode === "light" ? "#F1F5F5" : "#0F1B20", //Borda acima de onde digita a mensagem
            newmessagebox: mode === "light" ? "#F1F5F5" : "#0F1B20", //Em torno da Caixa de onde digita a mensagem
            inputdigita: mode === "light" ? "#FFFFFF" : "#1C2E36", //Caixa de Texto Atendimento onde digita a mensagem
            contactdrawer: mode === "light" ? "#fff" : "#1C2E36",
            announcements: mode === "light" ? "#ededed" : "#1C2E36",
            login: mode === "light" ? "#fff" : "#1C1C1C",
            announcementspopover: mode === "light" ? "#fff" : "#1C2E36",
            boxlist: mode === "light" ? "#ededed" : "#1C2E36",
            total: mode === "light" ? "#fff" : "#1C2E36",
            barraSuperior: mode === "light" ? themeSettings.primaryColorLight : "linear-gradient(to right, #31363d, #000000, #31363d)",//Barra Horizontal
            boxticket: mode === "light" ? "#EEE" : "#1C2E36",
            campaigntab: mode === "light" ? "#ededed" : "#1C2E36",
            corTextobarra: mode === "light" ? "#0F1B20" : "#FFFFFF",
            corTextosuporte: mode === "light" ? "#0F1B20" : "#FFFFFF",
            barraLateral: mode === "light" ? "linear-gradient(to right, #F1F5F5, #FFFFFF, #F1F5F5)" : "linear-gradient(to right, #0F1B20, #0F1B20, #0F1B20)", //Barra Vertical
            fundologoLateral: mode === "light" ? "linear-gradient(to right, #0F1B20, #0F1B20, #0F1B20)" : "linear-gradient(to right, #0F1B20, #0F1B20, #0F1B20)", //Fundo Logo Superior
            listaInterno: mode === "light" ? "#E7ECEE" : "#2E4C59",
            corIconesbarra: mode === "light" ? "#1C2E36" : "#00bfff",

            background: {
                default: mode === "light" ? "#FFFFFF" : "#0F1B20",
                paper: mode === "light" ? "#FFFFFF" : "#1C2E36",
            },
        },
        mode,
        calculatedLogoLight: () => {
            if (themeSettings.appLogoLight !== defaultLogoLight) {
                return themeSettings.appLogoLight;
            }
            return defaultLogoLight; // Retornar logo padrão se não definido
        },

        calculatedLogoDark: () => {
            if (themeSettings.appLogoDark !== defaultLogoDark) {
                return themeSettings.appLogoDark;
            }
            return defaultLogoDark; // Retornar logo padrão se não definido
        },

        ...themeSettings
    }, locale)), [
        locale,
        themeSettings,
        mode
    ]);

    useEffect(() => {
        window.localStorage.setItem("preferredTheme", mode);
    }, [mode]);

    return <>
        <Favicon
            url={((themeSettings.appLogoFavicon) ? process.env.REACT_APP_BACKEND_URL + "/public/" + theme.appLogoFavicon : defaultLogoFavicon)}/>
        <ColorModeContext.Provider value={{colorMode}}>
            <StyledEngineProvider injectFirst>
                <ThemeProvider theme={theme}>
                    <QueryClientProvider client={queryClient}>
                        <Routes/>
                    </QueryClientProvider>
                </ThemeProvider>
            </StyledEngineProvider>
        </ColorModeContext.Provider>
    </>;
};

export default App;
